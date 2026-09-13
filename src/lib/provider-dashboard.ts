import "server-only";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";

/**
 * Loads what every caretaker dashboard page needs: the signed-in provider, or null when nobody is.
 *
 * It deliberately does not load the list of all providers: a dashboard opens only for the caretaker logged in.
 */
export async function getProviderDashboard() {
  const session = await getSession();
  const repo = getRepository();
  const provider = session.role === "provider" && session.providerId ? await repo.getProvider(session.providerId) : null;
  return { session, repo, provider };
}
