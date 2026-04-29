import { NonRetriableError } from "inngest";

import { inngest } from "@/inngest/client";
import { canConsume, recordConsumption } from "@/lib/acquisition/budget";
import { persistActivities } from "@/lib/acquisition/persist";
import { policiesForPlatform } from "@/lib/acquisition/policies";
import { providerFor } from "@/lib/acquisition/providers";
import { db } from "@/lib/db";

const RETRY_POLICY: Record<
  string,
  { attempts: number; backoff: "exponential" | "fixed" | "none"; baseSeconds: number }
> = {
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

void RETRY_POLICY; // reserved for future per-provider step retry configuration

export const acquireSurface = inngest.createFunction(
  {
    id: "acquire-surface",
    concurrency: { limit: 5, key: "event.data.surfaceId" },
    retries: 0,
  },
  { event: "acquisition/surface.requested" },
  async ({ event, step }) => {
    const { surfaceId, windowDays, idempotencyKey } = event.data as {
      surfaceId: string;
      windowDays: number;
      idempotencyKey: string;
    };

    const surface = await step.run("load-surface", () =>
      db.surface.findUnique({ where: { id: surfaceId }, include: { employee: true } }),
    );
    if (!surface) throw new NonRetriableError(`surface_missing:${surfaceId}`);

    const existing = await step.run("check-idempotency", () =>
      db.acquisitionJob.findUnique({ where: { idempotencyKey } }),
    );
    if (existing && (existing.status === "SUCCEEDED" || existing.status === "PARTIAL")) {
      return { ok: true, idempotent: true, jobId: existing.id };
    }

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - windowDays * 86_400_000);
    const policies = policiesForPlatform(surface.platform);

    const job = await step.run("create-job", () =>
      db.acquisitionJob.upsert({
        where: { idempotencyKey },
        create: {
          surfaceId,
          provider: policies[0]?.provider ?? "MANUAL",
          status: "RUNNING",
          windowStart,
          windowEnd,
          attempts: 1,
          startedAt: new Date(),
          idempotencyKey,
        },
        update: {
          status: "RUNNING",
          attempts: { increment: 1 },
          startedAt: new Date(),
        },
      }),
    );

    for (const policy of policies) {
      const budget = await step.run(`budget-check-${policy.provider}`, () =>
        canConsume(policy.provider),
      );
      if (!budget.allowed) {
        await step.run(`budget-skip-${policy.provider}`, () =>
          db.acquisitionJob.update({
            where: { id: job.id },
            data: {
              failureCode: "budget_exhausted",
              failureReason: `Daily cap reached for ${policy.provider}`,
            },
          }),
        );
        continue;
      }

      const result = await step.run(`provider-${policy.provider}`, async () => {
        const adapter = providerFor(policy.provider);
        return adapter.collect({ surface, policy, windowStart, windowEnd });
      });

      if (result.status === "success") {
        await step.run(`persist-${policy.provider}`, () =>
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
        await step.run("mark-succeeded", () =>
          db.acquisitionJob.update({
            where: { id: job.id },
            data: { status: "SUCCEEDED", provider: policy.provider, completedAt: new Date() },
          }),
        );
        await step.sendEvent("trigger-recategorize", {
          name: "acquisition/posts.recategorize-requested",
          data: { employeeId: surface.employeeId },
        });
        return { ok: true, provider: policy.provider, jobId: job.id };
      }
    }

    await step.run("mark-dead-letter", () =>
      db.acquisitionJob.update({
        where: { id: job.id },
        data: {
          status: "DEAD_LETTER",
          deadLetterAt: new Date(),
          failureCode: "all_routes_failed",
          failureReason: `All ${policies.length} routes returned disabled or failed for ${surface.platform}`,
          completedAt: new Date(),
        },
      }),
    );
    return { ok: false, deadLetter: true, jobId: job.id };
  },
);
