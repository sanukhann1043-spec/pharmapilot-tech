import bcrypt from "bcryptjs";

// Cost factor 12 is a reasonable balance of security vs. latency as of 2026.
// Never lower this without a documented reason.
const SALT_ROUNDS = 12;

const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 128; // prevents bcrypt DoS via extremely long input

export class WeakPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeakPasswordError";
  }
}

/**
 * Server-side password strength check. UI should mirror this, but the
 * server check is the one that actually matters.
 */
export function assertPasswordStrength(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new WeakPasswordError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new WeakPasswordError("Password is too long.");
  }
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const varietyScore = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  if (varietyScore < 3) {
    throw new WeakPasswordError(
      "Password must include at least 3 of: lowercase, uppercase, number, symbol."
    );
  }

  // Reject a short list of extremely common passwords outright.
  const blocklist = ["password", "12345678", "qwerty123", "letmein123", "pharmapilot"];
  if (blocklist.includes(password.toLowerCase())) {
    throw new WeakPasswordError("This password is too common. Choose another.");
  }
}

export async function hashPassword(plainText: string): Promise<string> {
  assertPasswordStrength(plainText);
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function verifyPassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
