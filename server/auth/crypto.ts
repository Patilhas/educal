import crypto from "node:crypto";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

export const verifyPassword = (password: string, encodedHash: string): boolean => {
  const [algorithm, salt, storedHash] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  if (computedHash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(computedHash, "hex"));
};


