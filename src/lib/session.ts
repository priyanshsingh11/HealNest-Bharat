import { DEMO_ADMIN_ID, DEMO_USER_ID } from "@/lib/seed";
import type { Role } from "@/types";

// Mock session model. Replace with a real auth provider (e.g. Supabase Auth) later;
// keep the Session shape so authorization checks stay the same.

export type Session = {
  role: Role;
  userId: string;
  /** Set only for the provider role: which provider profile this login controls. */
  providerId: string | null;
};

export const ROLE_COOKIE = "hn_role";
export const PROVIDER_COOKIE = "hn_provider";
/** Which customer account is logged in. Absent = the demo customer. */
export const USER_COOKIE = "hn_user";

const PROVIDER_ID_PATTERN = /^prov_\d{2,4}$/;
/** Customer ids: the seeded "user_demo" and created "user_c…" accounts. Provider logins (user_prov_…) never match. */
const CUSTOMER_ID_PATTERN = /^user_[a-z0-9]{2,40}$/;

export function buildSession(role: string | undefined, providerId: string | undefined, userId?: string): Session {
  if (role === "admin") return { role: "admin", userId: DEMO_ADMIN_ID, providerId: null };
  if (role === "provider" && providerId && PROVIDER_ID_PATTERN.test(providerId)) {
    return { role: "provider", userId: `user_${providerId}`, providerId };
  }
  // No role, or a provider login without a usable profile id: browse as a customer.
  const customerId = userId && CUSTOMER_ID_PATTERN.test(userId) ? userId : DEMO_USER_ID;
  return { role: "user", userId: customerId, providerId: null };
}
