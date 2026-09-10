import { handle, LIMITS } from "@/lib/api";
import { getRepository } from "@/lib/db";
import { searchProviders } from "@/lib/services/discovery";
import { providerSearchSchema } from "@/lib/validations";

/** GET /api/providers?lat=&lng=&category=&sort=… — nearby providers whose service area covers the location. */
export async function GET(request: Request) {
  return handle(request, LIMITS.read, async () => {
    const params = providerSearchSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const { results, location, totalInCategory } = await searchProviders(getRepository(), params);
    return {
      location,
      totalInCategory,
      count: results.length,
      results: results.map((r) => ({
        provider: r.provider,
        distanceKm: r.distanceKm,
        startingPriceMinor: r.startingPriceMinor,
        earliestSlot: r.earliestSlot,
        services: r.services.map((s) => ({ id: s.id, name: s.name, basePriceMinor: s.basePriceMinor })),
      })),
    };
  });
}
