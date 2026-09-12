import "server-only";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";

/**
 * Loads what every caretaker dashboard page needs: the signed-in provider, or null when nobody is.
 *
 * It deliberately does not load the list of all providers. That list used to feed a profile picker on this page,
 * which meant any visitor could open any caretaker's dashboard; switching profiles now comes from the accounts
 * registered on the visitor's own device (see components/dashboard/provider-switcher.tsx).
 */
export async function getProviderDashboard() {
  const session = await getSession();
  const repo = getRepository();
  const provider = session.role === "provider" && session.providerId ? await repo.getProvider(session.providerId) : null;
  return { session, repo, provider };
}
