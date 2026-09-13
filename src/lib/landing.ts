import type { Session } from "@/lib/session";

/** Where a fresh session should land: caretakers on their dashboard, everyone else back where they came from. */
export function landingFor(session: Session, next: string | null): string {
  return session.role === "provider" ? "/dashboard/provider" : (next ?? "/");
}
