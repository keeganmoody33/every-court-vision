import "server-only";

import OpenAI from "openai";

import type { IntentContext, IntentResult } from "@/lib/intent/classify";
import type { IntentClass } from "@/lib/types";

const VALID_INTENTS: IntentClass[] = ["threePoint", "midRange", "paint", "freeThrow", "pass"];

function parseConfidence(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.7;
}

export async function classifyIntentWithLLM(text: string, ctx: IntentContext): Promise<IntentResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions
    .create({
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

Player: ${ctx.name}
Role: ${ctx.role}
Platform: ${ctx.platform}
Post: ${text}`,
        },
      ],
    })
    .catch(() => null);

  const content = response?.choices[0]?.message.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as {
      intentClass?: unknown;
      intentConfidence?: unknown;
      signals?: unknown;
      isAssist?: unknown;
    };
    if (typeof parsed.intentClass !== "string" || !VALID_INTENTS.includes(parsed.intentClass as IntentClass)) {
      return null;
    }
    return {
      intentClass: parsed.intentClass as IntentClass,
      intentConfidence: parseConfidence(parsed.intentConfidence),
      signals: Array.isArray(parsed.signals)
        ? parsed.signals.filter((signal): signal is string => typeof signal === "string")
        : ["llm"],
      isAssist: parsed.isAssist === true,
      source: "llm",
    };
  } catch {
    return null;
  }
}
