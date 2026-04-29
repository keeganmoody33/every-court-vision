import { AcquisitionJobStatus, AcquisitionProvider } from "@prisma/client";
import { NonRetriableError } from "inngest";

import { acquisitionSurfaceRequested, inngest, postsRecategorizeRequested } from "@/inngest/client";
import { canConsume, recordConsumption } from "@/lib/acquisition/budget";
import { persistActivities } from "@/lib/acquisition/persist";
import { policiesForPlatform } from "@/lib/acquisition/policies";
import { providerFor } from "@/lib/acquisition/providers";
import { db } from "@/lib/db";

const RETRY_POLICY: Record<AcquisitionProvider, { attempts: number; backoff: "exponential" | "fixed" | "none"; baseSeconds: number }> = {
  X_API: { attempts: 3, backoff: "exponential", baseSeconds: 1 },
  GITHUB_API: { attempts: 3, backoff: "exponential", baseSeconds: 1 },
  YOUTUBE_API: { attempts: 2, backoff: "fixed", baseSeconds: 5 },
  RSS: { attempts: 2, backoff: "fixed", baseSeconds: 2 },
  SPIDER: { attempts: 1, backoff: "none", baseSeconds: 0 },
  PARALLEL: { attempts: 2, backoff: "exponential", baseSeconds: 2 },
  LINKEDIN_API: { attempts: 2, backoff: "exponential", baseSeconds: 2 },
  INSTAGRAM_GRAPH: { attempts: 2, backoff: "exponential", baseSeconds: 2 },
  MANUAL: { attempts: 0, backoff: "none", baseSeconds: 0 },
};

const IDEMPOTENT_STATUSES: AcquisitionJobStatus[] = [
  AcquisitionJobStatus.QUEUED,
  AcquisitionJobStatus.RUNNING,
  AcquisitionJobStatus.SUCCEEDED,
  AcquisitionJobStatus.PARTIAL,
];

function backoffSeconds(provider: AcquisitionProvider, attemptIndex: number) {
  const policy = RETRY_POLICY[provider];
  if (policy.backoff === "none") return 0;
  if (policy.backoff === "fixed") return policy.baseSeconds;
  return policy.baseSeconds * 2 ** attemptIndex;
}

export const acquireSurface = inngest.createFunction(
  {
    id: "acquire-surface",
    concurrency: { limit: 5, key: "event.data.surfaceId" },
    retries: 0,
    triggers: [acquisitionSurfaceRequested],
  },
  async ({ event, step, runId }) => {
    const { surfaceId, windowDays, idempotencyKey } = event.data;

    const surface = await step.run("load-surface", () =>
      db.surface.findUnique({ where: { id: surfaceId }, include: { employee: true } }),
    );
    if (!surface) throw new NonRetriableError(`surface_missing:${surfaceId}`);

    const existing = await step.run("check-idempotency", () =>
      db.acquisitionJob.findUnique({ where: { idempotencyKey } }),
    );
    if (existing && IDEMPOTENT_STATUSES.includes(existing.status)) {
      return { ok: true, idempotent: true, jobId: existing.id, status: existing.status };
    }

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - windowDays * 86_400_000);
    const policies = policiesForPlatform(surface.platform);
    const firstProvider = policies[0]?.provider ?? AcquisitionProvider.MANUAL;

    const job = await step.run("upsert-job", () =>
      db.acquisitionJob.upsert({
        where: { idempotencyKey },
        create: {
          surfaceId,
          provider: firstProvider,
          status: AcquisitionJobStatus.RUNNING,
          windowStart,
          windowEnd,
          attempts: 1,
          attemptNumber: 1,
          startedAt: new Date(),
          idempotencyKey,
          inngestRunId: runId,
        },
        update: {
          provider: firstProvider,
          status: AcquisitionJobStatus.RUNNING,
          attempts: { increment: 1 },
          attemptNumber: { increment: 1 },
          startedAt: new Date(),
          completedAt: null,
          deadLetterAt: null,
          nextAttemptAt: null,
          failureCode: null,
          failureReason: null,
          inngestRunId: runId,
        },
      }),
    );

    let lastPartial:
      | {
          provider: AcquisitionProvider;
          rawCount: number;
          inserted: number;
          updated: number;
          skipped: number;
        }
      | undefined;

    for (const policy of policies) {
      const budget = await step.run(`budget-check-${policy.provider}`, () => canConsume(policy.provider));
      if (!budget.allowed) {
        await step.run(`budget-skip-${policy.provider}`, () =>
          db.acquisitionJob.update({
            where: { id: job.id },
            data: {
              provider: policy.provider,
              failureCode: "budget_exhausted",
              failureReason: `Daily cap reached for ${policy.provider}`,
            },
          }),
        );
        continue;
      }

      const retryPolicy = RETRY_POLICY[policy.provider];
      const attempts = Math.max(1, retryPolicy.attempts);

      for (let attemptIndex = 0; attemptIndex < attempts; attemptIndex++) {
        await step.run(`mark-attempt-${policy.provider}-${attemptIndex + 1}`, () =>
          db.acquisitionJob.update({
            where: { id: job.id },
            data: {
              provider: policy.provider,
              status: AcquisitionJobStatus.RUNNING,
              attemptNumber: attemptIndex + 1,
              nextAttemptAt: null,
            },
          }),
        );

        const result = await step.run(`provider-${policy.provider}-${attemptIndex + 1}`, async () => {
          const adapter = providerFor(policy.provider);
          return adapter.collect({ surface, policy, windowStart, windowEnd });
        });

        if (result.status === "disabled") {
          await step.run(`disabled-${policy.provider}`, () =>
            db.acquisitionJob.update({
              where: { id: job.id },
              data: {
                status: AcquisitionJobStatus.DISABLED,
                failureCode: result.failureCode,
                failureReason: result.failureReason,
                completedAt: new Date(),
              },
            }),
          );
          break;
        }

        if (result.status === "failed") {
          const shouldRetry = attemptIndex < attempts - 1;
          const waitSeconds = shouldRetry ? result.retryAfterSeconds ?? backoffSeconds(policy.provider, attemptIndex) : 0;
          await step.run(`failed-${policy.provider}-${attemptIndex + 1}`, () =>
            db.acquisitionJob.update({
              where: { id: job.id },
              data: {
                status: AcquisitionJobStatus.FAILED,
                failureCode: result.failureCode,
                failureReason: result.failureReason,
                nextAttemptAt: shouldRetry ? new Date(Date.now() + waitSeconds * 1000) : null,
                completedAt: shouldRetry ? null : new Date(),
              },
            }),
          );
          if (shouldRetry && waitSeconds > 0) {
            await step.sleep(`backoff-${policy.provider}-${attemptIndex + 1}`, `${waitSeconds}s`);
            continue;
          }
          break;
        }

        const persisted = await step.run(`persist-${policy.provider}`, () =>
          persistActivities({
            surfaceId,
            jobId: job.id,
            provider: policy.provider,
            activities: result.activities,
          }),
        );
        await step.run(`record-budget-${policy.provider}`, () =>
          recordConsumption(policy.provider, result.activities.length),
        );

        if (persisted.rawCount > 0) {
          await step.run("mark-succeeded", () =>
            db.acquisitionJob.update({
              where: { id: job.id },
              data: {
                provider: policy.provider,
                status: AcquisitionJobStatus.SUCCEEDED,
                rawCount: persisted.rawCount,
                inserted: persisted.inserted,
                updated: persisted.updated,
                skipped: persisted.skipped,
                failureCode: null,
                failureReason: null,
                completedAt: new Date(),
                surface: { update: { lastScrapedAt: new Date() } },
              },
            }),
          );
          if (surface.employeeId) {
            await step.sendEvent(
              "trigger-recategorize",
              postsRecategorizeRequested.create({ employeeId: surface.employeeId }),
            );
          }
          return { ok: true, provider: policy.provider, jobId: job.id, status: "SUCCEEDED" };
        }

        await step.run(`mark-partial-${policy.provider}`, () =>
          db.acquisitionJob.update({
            where: { id: job.id },
            data: {
              provider: policy.provider,
              status: AcquisitionJobStatus.PARTIAL,
              rawCount: persisted.rawCount,
              inserted: persisted.inserted,
              updated: persisted.updated,
              skipped: persisted.skipped,
              failureCode: "no_activity_found",
              failureReason: "Provider succeeded but returned no activity in the window.",
              completedAt: new Date(),
            },
          }),
        );
        lastPartial = { provider: policy.provider, ...persisted };
        break;
      }
    }

    if (lastPartial) {
      return { ok: true, provider: lastPartial.provider, jobId: job.id, status: "PARTIAL" };
    }

    await step.run("mark-dead-letter", () =>
      db.acquisitionJob.update({
        where: { id: job.id },
        data: {
          status: AcquisitionJobStatus.DEAD_LETTER,
          deadLetterAt: new Date(),
          failureCode: "all_routes_failed",
          failureReason: `All ${policies.length} routes returned disabled or failed for ${surface.platform}`,
          completedAt: new Date(),
        },
      }),
    );
    return { ok: false, deadLetter: true, jobId: job.id, status: "DEAD_LETTER" };
  },
);
