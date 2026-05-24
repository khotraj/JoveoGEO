import { describe, it, expect, beforeEach, afterEach } from "vitest";

const VALID_KEY = "a".repeat(64); // 32-byte hex key for testing

beforeEach(() => {
  process.env.TOKEN_ENCRYPTION_KEY = VALID_KEY;
});

afterEach(() => {
  delete process.env.TOKEN_ENCRYPTION_KEY;
});

// Import after env is set
const { encryptToken, decryptToken } = await import("@/lib/crypto/tokens");

describe("encryptToken / decryptToken", () => {
  it("round-trips a short string", () => {
    const plain = "ya29.some-access-token";
    expect(decryptToken(encryptToken(plain))).toBe(plain);
  });

  it("round-trips a long string", () => {
    const plain = "x".repeat(2000);
    expect(decryptToken(encryptToken(plain))).toBe(plain);
  });

  it("produces different ciphertexts each time (random IV)", () => {
    const plain = "same-plaintext";
    const c1 = encryptToken(plain);
    const c2 = encryptToken(plain);
    expect(c1).not.toBe(c2);
  });

  it("returns a base64 string", () => {
    const ct = encryptToken("hello");
    expect(() => Buffer.from(ct, "base64")).not.toThrow();
    expect(ct).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("throws when ciphertext is tampered (bit-flip in body)", () => {
    const plain = "secret-token";
    const ct = encryptToken(plain);
    const buf = Buffer.from(ct, "base64");
    // Flip a byte in the ciphertext body (after 12-byte IV + 16-byte tag)
    buf[29] ^= 0xff;
    const tampered = buf.toString("base64");
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("throws when ciphertext is too short", () => {
    expect(() => decryptToken(Buffer.alloc(10).toString("base64"))).toThrow("too short");
  });

  it("throws when TOKEN_ENCRYPTION_KEY is missing", () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => encryptToken("anything")).toThrow("TOKEN_ENCRYPTION_KEY");
  });

  it("throws when TOKEN_ENCRYPTION_KEY is wrong length", () => {
    process.env.TOKEN_ENCRYPTION_KEY = "short";
    expect(() => encryptToken("anything")).toThrow("TOKEN_ENCRYPTION_KEY");
  });
});
