import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { forbidden } from "@/lib/errors";
import { buildSession, PROVIDER_COOKIE, ROLE_COOKIE, USER_COOKIE, type Session } from "@/lib/session";
import type { Role } from "@/types";

const COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 };

/** Reads the mock session from cookies. Defaults to the demo customer. */
export async function getSession(): Promise<Session> {
  const store = await cookies();
  return buildSession(store.get(ROLE_COOKIE)?.value, store.get(PROVIDER_COOKIE)?.value, store.get(USER_COOKIE)?.value);
}

/** True once someone has logged in. Until then the app browses as the demo customer. */
export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(ROLE_COOKIE)?.value);
}

export function requireRole(session: Session, ...roles: Role[]): void {
  if (!roles.includes(session.role)) {
    throw forbidden(`This action requires the ${roles.join(" or ")} role. Switch role from the header.`);
  }
}

/** Stores the mock session on a response. */
export function setSessionCookies<T>(response: NextResponse<T>, session: Session): NextResponse<T> {
  response.cookies.set(ROLE_COOKIE, session.role, COOKIE_OPTIONS);
  if (session.providerId) response.cookies.set(PROVIDER_COOKIE, session.providerId, COOKIE_OPTIONS);
  else response.cookies.delete(PROVIDER_COOKIE);
  if (session.role === "user") response.cookies.set(USER_COOKIE, session.userId, COOKIE_OPTIONS);
  else response.cookies.delete(USER_COOKIE);
  return response;
}

export function clearSessionCookies<T>(response: NextResponse<T>): NextResponse<T> {
  response.cookies.delete(ROLE_COOKIE);
  response.cookies.delete(PROVIDER_COOKIE);
  response.cookies.delete(USER_COOKIE);
  return response;
}
