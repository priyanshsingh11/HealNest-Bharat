import "server-only";
import { cookies } from "next/headers";
import { forbidden } from "@/lib/errors";
import { buildSession, PROVIDER_COOKIE, ROLE_COOKIE, type Session } from "@/lib/session";
import type { Role } from "@/types";

/** Reads the mock session from cookies. Defaults to the demo customer. */
export async function getSession(): Promise<Session> {
  const store = await cookies();
  return buildSession(store.get(ROLE_COOKIE)?.value, store.get(PROVIDER_COOKIE)?.value);
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
