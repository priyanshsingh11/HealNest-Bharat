import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role } from "@/types";

// The session cookie's value: `<claims>.<signature>`, both base64url. The claims say who is logged in; the HMAC
// signature is what stops anyone editing them in the browser to become someone else (or an admin).
// Kept free of `server-only` so the end-to-end suite can mint a session for its test server.

export type SessionClaims = {
  role: Role;
  userId: string;
  providerId: string | null;
  /** Expiry, in milliseconds since the epoch. */
  exp: number;
};

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function signSessionToken(claims: SessionClaims, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** The claims in a token, or null when it is missing, altered, signed with another secret or expired. */
export function verifySessionToken(token: string | undefined, secret: string, now = Date.now()): SessionClaims | null {
  if (!token) return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SessionClaims>;
    if (typeof claims.role !== "string" || typeof claims.userId !== "string" || typeof claims.exp !== "number") return null;
    if (claims.exp <= now) return null;
    return { role: claims.role, userId: claims.userId, providerId: claims.providerId ?? null, exp: claims.exp };
  } catch {
    return null;
  }
}
