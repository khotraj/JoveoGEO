import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

const { callLLM } = await import("@/lib/llm/index");

describe("callLLM", () => {
  beforeEach(() => {
    process.env.LLM_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    vi.clearAllMocks();
  });

  it("calls Gemini and returns Zod-validated output", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => '{"result":"mocked"}' },
    });
    const schema = z.object({ result: z.string() });
    const result = await callLLM("test prompt", schema, { tier: "fast" });
    expect(result).toEqual({ result: "mocked" });
    expect(mockGenerateContent).toHaveBeenCalledOnce();
  });

  it("throws when Zod validation fails after retries", async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '{"wrong_field":123}' },
    });
    const schema = z.object({ required_field: z.string() });
    await expect(callLLM("test", schema, { maxRetries: 0 })).rejects.toThrow();
  });

  it("throws for unsupported LLM_PROVIDER", async () => {
    process.env.LLM_PROVIDER = "openai";
    const schema = z.object({ x: z.string() });
    await expect(callLLM("test", schema)).rejects.toThrow("not supported");
    process.env.LLM_PROVIDER = "gemini";
  });
});
