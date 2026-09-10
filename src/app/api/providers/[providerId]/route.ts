import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { updateProvider } from "@/lib/services/admin";
import { providerUpdateSchema } from "@/lib/validations";

type Context = { params: Promise<{ providerId: string }> };

export async function GET(request: Request, { params }: Context) {
  return handle(request, LIMITS.read, async () => {
    const { providerId } = await params;
    const repo = getRepository();
    const provider = await repo.getProvider(providerId);
    if (!provider || !provider.active) throw notFound("Provider");
    const [services, slots, reviews] = await Promise.all([
      repo.listServices({ providerId }),
      repo.listSlots({ providerId, from: new Date().toISOString(), status: "open" }),
      repo.listReviews(providerId),
    ]);
    return { provider, services: services.filter((s) => s.active), slots, reviews };
  });
}

/** PATCH — admin: verification/active; provider (own profile): service radius. */
export async function PATCH(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { providerId } = await params;
    const patch = providerUpdateSchema.parse(await readJson(request));
    const provider = await updateProvider(getRepository(), await getSession(), providerId, patch);
    return { provider };
  });
}
