import type { IntentClass, Platform, PostMetrics, PostScores, ShotOutcome } from "@/lib/types";
import { classifyOutcome } from "@/lib/intent/outcome";
import { postToCoord } from "@/lib/intent/courtMapping";

type Candidate = {
  id: string;
  employeeId: string;
  platform: Platform;
  text: string;
  employee: { name: string; role: string };
  metrics: PostMetrics | null;
  scores: PostScores | null;
};

export type RecategorizeResult = {
  posts: number;
  llmEscalations: number;
  metricsRecomputed: number;
  refined: number;
  skipped: number;
  errors: number;
};

type IntentResult = {
  intentClass: IntentClass;
  intentConfidence: number;
  signals: string[];
  isAssist: boolean;
  source: "llm";
};

export function createRecategorizer(deps: {
  findCandidates: (employeeId: string) => Promise<Candidate[]>;
  classifyIntentWithLLM: (text: string, ctx: { name: string; role: string; platform: Platform }) => Promise<IntentResult | null>;
  transaction: <T>(ops: () => Promise<T>) => Promise<T>;
  updatePost: (update: {
    id: string;
    intentClass: IntentClass;
    intentConfidence: number;
    outcome: ShotOutcome;
    recovered: boolean;
    isAssist: boolean;
    x: number;
    y: number;
    zone: string;
  }) => Promise<{ count: number }>;
  metricUpsertsForEmployee: (employeeId: string) => Promise<unknown[]>;
}): { recategorizeForEmployee: (employeeId: string) => Promise<RecategorizeResult> } {
  return {
    async recategorizeForEmployee(employeeId: string) {
      const candidates = await deps.findCandidates(employeeId);

      if (!process.env.OPENAI_API_KEY) {
        return { posts: candidates.length, llmEscalations: 0, metricsRecomputed: 0, refined: 0, skipped: candidates.length, errors: 0 };
      }

      let errors = 0;
      const planned: {
        id: string;
        employeeId: string;
        platform: Platform;
        intentClass: IntentClass;
        intentConfidence: number;
        outcome: ShotOutcome;
        recovered: boolean;
        isAssist: boolean;
        x: number;
        y: number;
        zone: string;
      }[] = [];

      for (const post of candidates) {
        if (!post.metrics || !post.scores) {
          errors += 1;
          continue;
        }

        const llm = await deps.classifyIntentWithLLM(post.text, {
          name: post.employee.name,
          role: post.employee.role,
          platform: post.platform,
        });
        if (!llm) {
          errors += 1;
          continue;
        }
        const outcome = classifyOutcome({ text: post.text, metrics: post.metrics, scores: post.scores }, llm.intentClass);
        const coord = postToCoord(post.id, post.employeeId, llm.intentClass, outcome.outcome, post.platform);
        planned.push({
          id: post.id,
          employeeId: post.employeeId,
          platform: post.platform,
          intentClass: llm.intentClass,
          intentConfidence: llm.intentConfidence,
          outcome: outcome.outcome,
          recovered: outcome.recovered,
          isAssist: llm.isAssist,
          ...coord,
        });
      }

      let updatedRows = 0;

      await deps.transaction(async () => {
        for (const update of planned) {
          const res = await deps.updatePost({
            id: update.id,
            intentClass: update.intentClass,
            intentConfidence: update.intentConfidence,
            outcome: update.outcome,
            recovered: update.recovered,
            isAssist: update.isAssist,
            x: update.x,
            y: update.y,
            zone: update.zone,
          });
          updatedRows += res.count;
        }
      });

      let metricsRecomputed = 0;
      if (updatedRows > 0) {
        const metricOps = await deps.metricUpsertsForEmployee(employeeId);
        metricsRecomputed = metricOps.length;
      }

      const refined = planned.length;
      return {
        posts: candidates.length,
        llmEscalations: planned.length,
        metricsRecomputed,
        refined,
        skipped: candidates.length - refined - errors,
        errors,
      };
    },
  };
}

