import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { CareRepository } from "@/lib/repository/types";

// Device-bound accounts.
//
// Signing up issues a long random secret to the browser that created the account. The browser keeps it in
// localStorage; the server keeps only its SHA-256 hash. Logging in means presenting the secret, so an account
// is reachable only from a device it was registered on — nobody can enumerate or pick someone else's account.
//
// Note: clearing site data on the only registered device loses the account. There is no recovery path yet.

/** 32 random bytes, base64url — 43 characters, no padding. */
const TOKEN_BYTES = 32;
export const DEVICE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Shown back to the account owner in a device list. Never used to decide access. */
const MAX_LABEL = 80;

export function createDeviceToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A short, readable name for the browser a request came from, e.g. "Mac · Chrome". */
export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const platform =
    /iPhone|iPad|iPod/i.test(userAgent) ? "iPhone/iPad"
    : /Android/i.test(userAgent) ? "Android"
    : /Macintosh|Mac OS X/i.test(userAgent) ? "Mac"
    : /Windows/i.test(userAgent) ? "Windows"
    : /Linux/i.test(userAgent) ? "Linux"
    : "Unknown device";
  // Order matters: Edge and Chrome both claim "Chrome"/"Safari", Chrome claims "Safari".
  const browser =
    /Edg\//i.test(userAgent) ? "Edge"
    : /OPR\/|Opera/i.test(userAgent) ? "Opera"
    : /Firefox\//i.test(userAgent) ? "Firefox"
    : /Chrome\//i.test(userAgent) ? "Chrome"
    : /Safari\//i.test(userAgent) ? "Safari"
    : null;
  return (browser ? `${platform} · ${browser}` : platform).slice(0, MAX_LABEL);
}

/** Registers the calling device for an account and returns the secret the browser must keep. */
export async function registerDevice(
  repo: CareRepository,
  userId: string,
  userAgent: string | null,
  now: Date = new Date(),
): Promise<string> {
  const token = createDeviceToken();
  await repo.registerDevice({
    tokenHash: hashDeviceToken(token),
    userId,
    label: describeDevice(userAgent),
    createdAt: now.toISOString(),
  });
  return token;
}

/** True when this secret was issued for that account on some device. Any malformed token is simply a no. */
export async function deviceOwnsAccount(repo: CareRepository, token: string | undefined, userId: string): Promise<boolean> {
  if (!token || !DEVICE_TOKEN_PATTERN.test(token)) return false;
  return (await repo.findDeviceUser(hashDeviceToken(token))) === userId;
}
