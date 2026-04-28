type RefineRequest = {
  employeeId?: string;
};

type RefineResponse =
  | { ok: true; refined: 0; skipped: number; errors: number; reason: "llm_disabled" }
  | { ok: true; refined: number; skipped: number; errors: number }
  | { ok: false; error: string };

type RecategorizeForEmployeeResult = {
  posts: number;
  llmEscalations: number;
  metricsRecomputed: number;
  refined: number;
  skipped: number;
  errors: number;
};

export function createRefineEndpoint(deps: {
  recategorizeForEmployee: (employeeId: string) => Promise<RecategorizeForEmployeeResult>;
  recategorizeAllLowConfidence: () => Promise<{ refined: number; skipped: number; errors: number }>;
}): (req: RefineRequest) => Promise<RefineResponse> {
  return async (req) => {
    if (!process.env.OPENAI_API_KEY) {
      return { ok: true, refined: 0, skipped: 0, errors: 0, reason: "llm_disabled" };
    }

    if (req.employeeId) {
      const result = await deps.recategorizeForEmployee(req.employeeId);
      return { ok: true, refined: result.refined, skipped: result.skipped, errors: result.errors };
    }

    const result = await deps.recategorizeAllLowConfidence();
    return { ok: true, refined: result.refined, skipped: result.skipped, errors: result.errors };
  };
}

