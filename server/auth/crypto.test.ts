import { describe, it, expect } from "vitest";
import { normalizeEmail, hashPassword, verifyPassword } from "./crypto";

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases the email", () => {
    expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });
});

describe("hashPassword / verifyPassword", () => {
  it("produces a hash in the scrypt$<salt>$<hash> format", () => {
    const encoded = hashPassword("correct-horse-battery-staple");
    expect(encoded).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  });

  it("verifies the correct password against its own hash", () => {
    const encoded = hashPassword("correct-horse-battery-staple");
    expect(verifyPassword("correct-horse-battery-staple", encoded)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const encoded = hashPassword("correct-horse-battery-staple");
    expect(verifyPassword("wrong-password", encoded)).toBe(false);
  });

  it("rejects a malformed encoded hash missing segments", () => {
    expect(verifyPassword("correct-horse-battery-staple", "not-a-valid-hash")).toBe(false);
  });

  it("rejects an encoded hash with an unsupported algorithm tag", () => {
    const encoded = hashPassword("correct-horse-battery-staple");
    const [, salt, hash] = encoded.split("$");
    expect(verifyPassword("correct-horse-battery-staple", `md5$${salt}$${hash}`)).toBe(false);
  });

  it("rejects an encoded hash whose stored hash length does not match the computed hash", () => {
    const encoded = hashPassword("correct-horse-battery-staple");
    const [, salt] = encoded.split("$");
    expect(verifyPassword("correct-horse-battery-staple", `scrypt$${salt}$abcd`)).toBe(false);
  });
});
