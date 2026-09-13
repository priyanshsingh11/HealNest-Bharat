import { DEMO_ADMIN_ID } from "@/lib/seed";
import type { Role } from "@/types";

// Who is logged in. Stored in one signed cookie (src/lib/auth.ts, src/lib/session-token.ts), and set only after an
// email + password log-in, a sign-up, a password reset, or the two-step staff sign-in.

export type Session = {
  role: Role;
  userId: string;
  /** Set only for the provider role: which provider profile this login controls. */
  providerId: string | null;
};

export const SESSION_COOKIE = "hn_session";
/** Unsigned cookies from before sessions were signed. Never read; cleared whenever a session is set or ended. */
export const LEGACY_SESSION_COOKIES = ["hn_role", "hn_provider", "hn_user"] as const;

/** Session user id for someone who isn't logged in. No account has it, so guests can browse but not book. */
export const GUEST_USER_ID = "guest";

const PROVIDER_ID_PATTERN = /^prov_\d{2,4}$/;
/** Customer ids: created "user_c…" accounts and email sign-ups. Provider logins (user_prov_…) never match. */
const CUSTOMER_ID_PATTERN = /^user_[a-z0-9]{2,40}$/;

export function buildSession(role: string | undefined, providerId: string | undefined, userId?: string): Session {
  if (role === "admin") return { role: "admin", userId: DEMO_ADMIN_ID, providerId: null };
  if (role === "provider" && providerId && PROVIDER_ID_PATTERN.test(providerId)) {
    return { role: "provider", userId: `user_${providerId}`, providerId };
  }
  // No role, a provider login without a usable profile id, or no customer account: browse as a guest.
  const customerId = userId && CUSTOMER_ID_PATTERN.test(userId) ? userId : GUEST_USER_ID;
  return { role: "user", userId: customerId, providerId: null };
}

export const isGuest = (session: Session) => session.userId === GUEST_USER_ID;
