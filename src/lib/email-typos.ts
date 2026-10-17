/**
 * "Did you mean gmail.com?": catches common typos in the email domain before an applicant
 * submits, so their offer and receipts don't bounce. Only suggests; never blocks.
 */
const COMMON_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "ymail.com", "live.com", "aol.com", "yahoo.co.uk"];

/** Typos too far from the real domain for the distance check. */
const KNOWN_TYPOS: Record<string, string> = {
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "g.mail.com": "gmail.com",
  "yahoo.con": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "hotmail.con": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlook.con": "outlook.com",
  "outlok.com": "outlook.com",
  "icloud.con": "icloud.com",
};

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/** The corrected address, or null when the domain looks fine (or isn't close to a common one). */
export function suggestEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (COMMON_DOMAINS.includes(domain)) return null;
  const known = KNOWN_TYPOS[domain];
  if (known) return `${local}@${known}`;
  let best: { domain: string; score: number } | null = null;
  for (const candidate of COMMON_DOMAINS) {
    const score = distance(domain, candidate);
    if (score <= 2 && (!best || score < best.score)) best = { domain: candidate, score };
  }
  return best ? `${local}@${best.domain}` : null;
}
