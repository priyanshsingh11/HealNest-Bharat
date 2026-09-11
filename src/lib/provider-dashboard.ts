import "server-only";
import { getSession } from "@/lib/auth";
import { categoryName } from "@/lib/categories";
import { getRepository } from "@/lib/db";

/** Loads what every caretaker dashboard page needs: the signed-in provider (or null) and the demo profile picker. */
export async function getProviderDashboard() {
  const session = await getSession();
  const repo = getRepository();
  const providers = await repo.listProviders();
  const pickerOptions = providers.map((p) => ({ id: p.id, name: p.name, category: categoryName(p.category) }));
  const provider = session.role === "provider" && session.providerId ? await repo.getProvider(session.providerId) : null;
  return { session, repo, provider, pickerOptions };
}

export type ProviderPickerOption = Awaited<ReturnType<typeof getProviderDashboard>>["pickerOptions"][number];
