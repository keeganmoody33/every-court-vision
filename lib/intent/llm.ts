import "server-only";

import OpenAI from "openai";

import type { IntentContext, IntentResult } from "@/lib/intent/classify";
import type { IntentClass } from "@/lib/types";

const VALID_INTENTS: IntentClass[] = ["threePoint", "midRange", "paint", "freeThrow", "pass"];

function parseConfidence(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.7;
}

function sanitizeForPrompt(value: string) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function safeUserData(text: string, ctx: IntentContext) {
  const payload = {
    player: sanitizeForPrompt(ctx.name),
    role: sanitizeForPrompt(ctx.role),
    platform: sanitizeForPrompt(ctx.platform),
    post: text.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 5_000),
  };
  return JSON.stringify(payload);
}

function validateIntentPayload(value: unknown): {
  intentClass: IntentClass;
  intentConfidence: number;
  signals: string[];
  isAssist: boolean;
} | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  for (const key of keys) {
    if (key !== "intentClass" && key !== "intentConfidence" && key !== "signals" && key !== "isAssist") return null;
  }

  const intentClass = record.intentClass;
  if (typeof intentClass !== "string" || !VALID_INTENTS.includes(intentClass as IntentClass)) return null;

  const signalsRaw = record.signals;
  const signals = Array.isArray(signalsRaw)
    ? signalsRaw.filter((signal): signal is string => typeof signal === "string").slice(0, 30)
    : ["llm"];

  return {
    intentClass: intentClass as IntentClass,
    intentConfidence: parseConfidence(record.intentConfidence),
    signals,
    isAssist: record.isAssist === true,
  };
}

export async function classifyIntentWithLLM(text: string, ctx: IntentContext): Promise<IntentResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  const response = await client.chat.completions
    .create(
      {
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Classify social posts for a basketball-shot-chart GTM map. "Where on the court" = what kind of shot. "What color" = what platform. "How bright" = how recent.',
          },
          {
            role: "user",
            content: `Return JSON only with keys intentClass, intentConfidence, signals, isAssist.

Intent classes:
- threePoint: explicit purchase, demo, enterprise, paid subscription, consulting, high-ACV CTA
- midRange: signup, newsletter, trial, waitlist, owned audience CTA
- paint: follow, like, comment, reply, low-friction social action
- freeThrow: personal, cultural, trust-building, no work CTA
- pass: setup content, framework, opinion, teammate boost, no direct CTA

USER_DATA_JSON:
\`\`\`json
${safeUserData(text, ctx)}
\`\`\``,
          },
        ],
      },
      { signal: controller.signal },
    )
    .catch(() => null)
    .finally(() => clearTimeout(timeoutId));

  const content = response?.choices[0]?.message.content;
  if (!content) return null;

  try {
    const payload = validateIntentPayload(JSON.parse(content));
    if (!payload) return null;

    return {
      intentClass: payload.intentClass,
      intentConfidence: payload.intentConfidence,
      signals: payload.signals,
      isAssist: payload.isAssist,
      source: "llm",
    };
  } catch {
    return null;
  }
}
