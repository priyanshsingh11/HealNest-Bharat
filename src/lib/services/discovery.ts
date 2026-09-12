import { bookableCategories } from "@/lib/categories";
import { APP_TIME_ZONE } from "@/lib/formatters";
import { roundedDistanceKm } from "@/lib/geo";
import type { CareRepository } from "@/lib/repository/types";
import type { ProviderSearchParams, SortOption } from "@/lib/validations";
import type { AvailabilitySlot, GeoPoint, ProviderSearchResult } from "@/types";

export const DEFAULT_MAX_DISTANCE_KM = 25;

const istDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(date);

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 3600 * 1000);
}

export type DiscoveryResult = {
  results: ProviderSearchResult[];
  location: GeoPoint | null;
  /** Providers matching category and care service only, before the other filters — used for empty-state hints. */
  totalInCategory: number;
};

function availableBy(slots: AvailabilitySlot[], window: NonNullable<ProviderSearchParams["availability"]>, now: Date) {
  const lastDay = istDay(addDays(now, window === "today" ? 0 : window === "tomorrow" ? 1 : 6));
  return slots.some((slot) => istDay(new Date(slot.startAt)) <= lastDay);
}

function compare(sort: SortOption) {
  return (a: ProviderSearchResult, b: ProviderSearchResult): number => {
    const distance = (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    const rating = b.provider.rating - a.provider.rating;
    const price = a.startingPriceMinor - b.startingPriceMinor;
    const soonest =
      (a.earliestSlot ? Date.parse(a.earliestSlot.startAt) : Infinity) -
      (b.earliestSlot ? Date.parse(b.earliestSlot.startAt) : Infinity);
    switch (sort) {
      case "rating":
        return rating || distance;
      case "price":
        return price || distance;
      case "availability":
        return soonest || distance;
      case "distance":
      default:
        return distance || rating;
    }
  };
}

/** Finds providers near a location whose service radius covers it, then filters and sorts them. */
export async function searchProviders(
  repo: CareRepository,
  params: ProviderSearchParams,
  now: Date = new Date(),
): Promise<DiscoveryResult> {
  const location: GeoPoint | null =
    params.lat !== undefined && params.lng !== undefined ? { latitude: params.lat, longitude: params.lng } : null;

  const [providers, categories] = await Promise.all([
    repo.listProviders(params.category ? { category: params.category } : undefined),
    repo.listCategories(),
  ]);
  const activeCategories = new Set(bookableCategories(categories).map((c) => c.id));
  const candidates = providers.filter((p) => p.active && activeCategories.has(p.category));
  const ids = candidates.map((p) => p.id);

  const [services, slots] = await Promise.all([
    ids.length ? repo.listServices({ providerIds: ids }) : Promise.resolve([]),
    ids.length ? repo.listSlots({ providerIds: ids, from: now.toISOString(), status: "open" }) : Promise.resolve([]),
  ]);

  const maxDistance = params.maxDistanceKm ?? DEFAULT_MAX_DISTANCE_KM;
  const query = params.q?.trim().toLowerCase();
  const language = params.language?.trim().toLowerCase();

  const all: ProviderSearchResult[] = candidates.map((provider) => {
    // With a care service selected, only matching services count (for listing and starting price).
    const providerServices = services.filter(
      (s) => s.providerId === provider.id && s.active && (!params.service || s.careService === params.service),
    );
    const providerSlots = slots.filter((s) => s.providerId === provider.id);
    const distanceKm = location ? roundedDistanceKm(location, provider.baseLocation) : null;
    return {
      provider,
      distanceKm,
      withinRadius: distanceKm === null || distanceKm <= provider.serviceRadiusKm,
      startingPriceMinor: providerServices.length ? Math.min(...providerServices.map((s) => s.basePriceMinor)) : 0,
      earliestSlot: providerSlots[0] ?? null,
      services: providerServices,
    };
  });

  const inArea = all.filter((r) => r.services.length > 0 && r.withinRadius && (r.distanceKm ?? 0) <= maxDistance);

  const results = inArea.filter((r) => {
    const { provider } = r;
    if (params.verifiedOnly && provider.verificationStatus !== "verified") return false;
    if (params.minRating !== undefined && provider.rating < params.minRating) return false;
    if (params.maxPrice !== undefined && r.startingPriceMinor > params.maxPrice * 100) return false;
    if (params.gender && provider.gender !== params.gender) return false;
    if (language && !provider.languages.some((l) => l.toLowerCase() === language)) return false;
    if (params.availability) {
      const providerSlots = slots.filter((s) => s.providerId === provider.id);
      if (!availableBy(providerSlots, params.availability, now)) return false;
    }
    if (query) {
      const haystack = [provider.name, provider.baseLocation.locality, ...r.services.map((s) => s.name)]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  results.sort(compare(params.sort ?? "distance"));
  return { results, location, totalInCategory: inArea.length };
}

/** Distinct languages across providers, for the language filter. */
export async function listLanguages(repo: CareRepository): Promise<string[]> {
  const providers = await repo.listProviders();
  return [...new Set(providers.flatMap((p) => p.languages))].sort();
}
