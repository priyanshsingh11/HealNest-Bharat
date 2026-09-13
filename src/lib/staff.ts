import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Staff (admin) sign-in. Two steps, both required:
//   1. ADMIN_PASSCODE — a shared secret that gates the flow, so nobody can make us email codes at will.
//   2. An email code from Supabase Auth, sent only to an address listed in ADMIN_EMAILS.
// Step 1 hands back a short-lived signed challenge that step 2 must present, so the two steps can't be
// taken out of order or for different addresses. Miss any of the three settings and staff sign-in is off
// entirely rather than falling back to the passcode alone.

export const MIN_PASSCODE_LENGTH = 8;
/** How long a staff member has to type the emailed code before starting again. */
export const CHALLENGE_TTL_MS = 10 * 60 * 1000;

function passcode(): string {
  return (process.env.ADMIN_PASSCODE ?? "").trim();
}

const digest = (value: string) => createHash("sha256").update(value).digest();

/** False when ADMIN_PASSCODE is missing or too short to be worth anything. */
export function passcodeConfigured(): boolean {
  return passcode().length >= MIN_PASSCODE_LENGTH;
}

/**
 * Constant-time comparison of the submitted passcode. Both sides are hashed first so the comparison is over
 * equal-length buffers and the timing carries nothing about the real passcode's length.
 */
export function checkStaffPasscode(submitted: string): boolean {
  if (!passcodeConfigured()) return false;
  return timingSafeEqual(digest(submitted), digest(passcode()));
}

/** Addresses allowed to receive a staff code, from ADMIN_EMAILS (comma or space separated). */
export function staffEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.includes("@"));
}

export function isStaffEmail(email: string): boolean {
  return staffEmails().includes(email.trim().toLowerCase());
}

/** Supabase Auth sends the codes, which needs the project URL and its publishable (anon) key. */
export function staffOtpConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY ?? "").trim());
}

/**
 * Staff sign-in only works when all of it is set up: a usable passcode, at least one staff address, and a
 * Supabase project that can send the code. Anything missing switches staff sign-in off — the second factor
 * is never skipped.
 */
export function staffLoginConfigured(): boolean {
  return passcodeConfigured() && staffEmails().length > 0 && staffOtpConfigured();
}

/** What is still missing, for the operator setting this up. Never shown to visitors. */
export function staffLoginSetupGaps(): string[] {
  const gaps: string[] = [];
  if (!passcodeConfigured()) gaps.push(`ADMIN_PASSCODE (at least ${MIN_PASSCODE_LENGTH} characters)`);
  if (staffEmails().length === 0) gaps.push("ADMIN_EMAILS");
  if (!staffOtpConfigured()) gaps.push("SUPABASE_URL and SUPABASE_ANON_KEY");
  return gaps;
}

// ---------------------------------------------------------------------------
// Challenge issued by step 1 and spent by step 2.

const challengeKey = () => createHmac("sha256", digest(`healnest:staff:${passcode()}`));

function sign(payload: string): string {
  return challengeKey().update(payload).digest("base64url");
}

/** `<email>.<expiry>.<signature>` — carries no secret, and is useless once expired or altered. */
export function issueChallenge(email: string, now = Date.now()): string {
  const payload = `${Buffer.from(email.trim().toLowerCase()).toString("base64url")}.${now + CHALLENGE_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

/** The address a challenge was issued for, or null when it is expired, altered or not ours. */
export function readChallenge(token: string | undefined, now = Date.now()): string | null {
  if (!token || !passcodeConfigured()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedEmail, expiresAt, signature] = parts;
  const expected = sign(`${encodedEmail}.${expiresAt}`);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) <= now) return null;
  const email = Buffer.from(encodedEmail, "base64url").toString("utf8");
  return isStaffEmail(email) ? email : null;
}
