import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LEN    = 12; // 96-bit IV — GCM recommended
const TAG_LEN   = 16; // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 64-hex-char (32-byte) value");
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt an OAuth token string.
 * Wire format: base64( [12 IV] [16 AuthTag] [N ciphertext] )
 */
export function encryptToken(plaintext: string): string {
  const key    = getKey();
  const iv     = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const body   = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return Buffer.concat([iv, tag, body]).toString("base64");
}

/**
 * Decrypt a previously encrypted token string.
 * Throws if the ciphertext is tampered or the key is wrong.
 */
export function decryptToken(ciphertext: string): string {
  const key = getKey();
  const buf = Buffer.from(ciphertext, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("ciphertext too short — likely corrupted");
  }
  const iv      = buf.subarray(0, IV_LEN);
  const tag     = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const body    = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}
