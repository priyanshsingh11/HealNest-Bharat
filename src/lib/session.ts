import { DEMO_ADMIN_ID, DEMO_PROVIDER_ID, DEMO_USER_ID } from "@/lib/mock-data";
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

const PROVIDER_ID_PATTERN = /^prov_\d{2,4}$/;

export function buildSession(role: string | undefined, providerId: string | undefined): Session {
  if (role === "admin") return { role: "admin", userId: DEMO_ADMIN_ID, providerId: null };
  if (role === "provider") {
    const id = providerId && PROVIDER_ID_PATTERN.test(providerId) ? providerId : DEMO_PROVIDER_ID;
    return { role: "provider", userId: `user_${id}`, providerId: id };
  }
  return { role: "user", userId: DEMO_USER_ID, providerId: null };
}
