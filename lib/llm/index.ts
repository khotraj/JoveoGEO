import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const provider = process.env.LLM_PROVIDER ?? "gemini";

const MODELS = {
  fast:  process.env.LLM_MODEL_FAST  ?? "gemini-2.0-flash",
  deep:  process.env.LLM_MODEL_DEEP  ?? "gemini-2.5-pro",
  cheap: process.env.LLM_MODEL_CHEAP ?? "gemini-2.0-flash",
} as const;

type Tier = keyof typeof MODELS;

export interface LLMCallOptions {
  tier?: Tier;
  systemPrompt?: string;
  maxRetries?: number;
}

export async function callLLM<T>(
  userPrompt: string,
  schema: z.ZodType<T>,
  opts: LLMCallOptions = {}
): Promise<T> {
  const { tier = "fast", systemPrompt, maxRetries = 1 } = opts;
  const modelId = MODELS[tier];

  if (provider === "gemini") {
    return callGemini(userPrompt, schema, { systemPrompt, modelId, maxRetries });
  }

  // Anthropic fallback (wire up when key is available)
  throw new Error("LLM_PROVIDER not supported: " + provider);
}

async function callGemini<T>(
  userPrompt: string,
  schema: z.ZodType<T>,
  opts: { systemPrompt?: string; modelId: string; maxRetries: number }
): Promise<T> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: opts.modelId,
    systemInstruction: opts.systemPrompt,
    generationConfig: { responseMimeType: "application/json" },
  });

  let lastError: unknown;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      return schema.parse(parsed);
    } catch (err) {
      lastError = err;
      if (attempt === opts.maxRetries) break;
    }
  }
  throw lastError;
}
