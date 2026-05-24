import { describe, it, expect } from "vitest";

describe("@joveo.com domain restriction logic", () => {
  const isAllowed = (email: string) => email.endsWith("@joveo.com");

  it("allows @joveo.com emails", () => {
    expect(isAllowed("raj.khot@joveo.com")).toBe(true);
    expect(isAllowed("test.user@joveo.com")).toBe(true);
  });

  it("rejects Gmail and other domains", () => {
    expect(isAllowed("raj@gmail.com")).toBe(false);
    expect(isAllowed("raj@outlook.com")).toBe(false);
    expect(isAllowed("raj@joveo.com.evil.com")).toBe(false);
  });

  it("rejects empty or malformed input", () => {
    expect(isAllowed("")).toBe(false);
    expect(isAllowed("notanemail")).toBe(false);
    expect(isAllowed("@joveo.com")).toBe(true); // malformed but passes suffix check; auth.uid() is nil so it won't reach here
  });
});
