/**
 * Accepts Nigerian numbers as 0818…, 818…, 234818… or +234818… (spaces, dashes and brackets
 * allowed) and other countries in full international format. Returns E.164 or null.
 * Mirrors `normalizePhone` in the backend, which re-validates every number.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  let e164: string;
  if (hasPlus) e164 = `+${digits}`;
  else if (digits.startsWith("234")) e164 = `+${digits}`;
  else if (digits.startsWith("0") && digits.length === 11) e164 = `+234${digits.slice(1)}`;
  else if (/^[789]\d{9}$/.test(digits)) e164 = `+234${digits}`;
  else return null;
  if (e164.startsWith("+234") && e164.length !== 14) return null;
  return /^\+[1-9]\d{6,14}$/.test(e164) ? e164 : null;
}

export const PHONE_ERROR = "That number looks short. Nigerian numbers have 11 digits, like 0818 000 0000.";
export const EMAIL_ERROR = "That email doesn't look right. Check for a typo?";

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
