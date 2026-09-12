import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

// Staff (admin) login. There is no admin account picker and no link to it from the site: staff go to /staff
// and enter ADMIN_PASSCODE. Unset means staff login is switched off entirely rather than open to everyone.

export const MIN_PASSCODE_LENGTH = 8;

function passcode(): string {
  return (process.env.ADMIN_PASSCODE ?? "").trim();
}

/** False when ADMIN_PASSCODE is missing or too short to be worth anything — /staff then refuses every attempt. */
export function staffLoginConfigured(): boolean {
  return passcode().length >= MIN_PASSCODE_LENGTH;
}

/**
 * Constant-time comparison of the submitted passcode. Both sides are hashed first so the comparison is over
 * equal-length buffers and the timing carries nothing about the real passcode's length.
 */
export function checkStaffPasscode(submitted: string): boolean {
  if (!staffLoginConfigured()) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(submitted), digest(passcode()));
}
