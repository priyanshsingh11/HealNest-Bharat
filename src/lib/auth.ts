import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { forbidden } from "@/lib/errors";
import { buildSession, LEGACY_SESSION_COOKIES, SESSION_COOKIE, type Session } from "@/lib/session";
import { signSessionToken, verifySessionToken } from "@/lib/session-token";
import type { Role } from "@/types";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

type GlobalWithSecret = typeof globalThis & { __healnestSessionSecret?: string };

/**
 * Key for signing session cookies. SESSION_SECRET when set; otherwise derived from the Supabase service-role key,
 * which is already a server-only secret (rotating it logs everyone out). With neither — the in-memory data source
 * in development and tests — a random key per server process, so sessions simply end on restart.
 */
function sessionSecret(): string {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) return createHash("sha256").update(`healnest:session:${serviceKey}`).digest("hex");
  const store = globalThis as GlobalWithSecret;
  store.__healnestSessionSecret ??= randomBytes(32).toString("hex");
  return store.__healnestSessionSecret;
}

async function readClaims() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value, sessionSecret());
}

/** The logged-in session, or a guest customer when nobody is (or the cookie was tampered with). */
export async function getSession(): Promise<Session> {
  const claims = await readClaims();
  return claims ? buildSession(claims.role, claims.providerId ?? undefined, claims.userId) : buildSession(undefined, undefined);
}

export async function isSignedIn(): Promise<boolean> {
  return Boolean(await readClaims());
}

export function requireRole(session: Session, ...roles: Role[]): void {
  if (!roles.includes(session.role)) {
    throw forbidden(`This action requires the ${roles.join(" or ")} role. Switch role from the header.`);
  }
}

/** Logs the response's browser into `session`. */
export function setSessionCookies<T>(response: NextResponse<T>, session: Session): NextResponse<T> {
  const token = signSessionToken({ ...session, exp: Date.now() + MAX_AGE_SECONDS * 1000 }, sessionSecret());
  response.cookies.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
  for (const name of LEGACY_SESSION_COOKIES) response.cookies.delete(name);
  return response;
}

export function clearSessionCookies<T>(response: NextResponse<T>): NextResponse<T> {
  response.cookies.delete(SESSION_COOKIE);
  for (const name of LEGACY_SESSION_COOKIES) response.cookies.delete(name);
  return response;
}
