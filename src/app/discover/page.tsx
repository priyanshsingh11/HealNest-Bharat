import { Info, MapPin, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CareServiceIcon, CategoryIcon } from "@/components/category-meta";
import { DiscoverLocationBar } from "@/components/discover-location-bar";
import { EmergencyBanner } from "@/components/emergency-banner";
import { MapPanel } from "@/components/map-panel";
import { ProviderCard } from "@/components/provider-card";
import { AutoScrollRow } from "@/components/auto-scroll-row";
import { ProviderFilters } from "@/components/provider-filters";
import { ButtonLink } from "@/components/ui/button";
import { CARE_SERVICES, findCareService } from "@/lib/care-services";
import { bookableCategories } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { getRepository } from "@/lib/db";
import { flattenParams, locationFromParams, toQuery } from "@/lib/location";
import { listLanguages, searchProviders } from "@/lib/services/discovery";
import { providerSearchSchema } from "@/lib/validations";

export const metadata: Metadata = { title: "Find care nearby" };

const chipClass = "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition";
const chipOnClass = "border-brand-700 bg-brand-700 text-white";
const chipOffClass = "border-line bg-white text-ink hover:border-brand-300 hover:text-brand-700";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DiscoverPage({ searchParams }: PageProps) {
  const raw = flattenParams(await searchParams);
  const parsed = providerSearchSchema.safeParse(raw);
  const params = parsed.success ? parsed.data : {};
  const location = locationFromParams(raw);

  const repo = getRepository();
  const [categories, config, languages] = await Promise.all([repo.listCategories(), repo.getPlatformConfig(), listLanguages(repo)]);
  const activeCategories = bookableCategories(categories);
  const selected = activeCategories.find((c) => c.id === params.category);
  const careService = findCareService(params.service);
  /** With a category chosen, only the services that category actually provides are offered. */
  const offeredServices = selected ? CARE_SERVICES.filter((s) => s.providedBy.includes(selected.id)) : CARE_SERVICES;

  const locationQuery = location ? { lat: location.latitude, lng: location.longitude, label: location.label } : {};
  const discovery = location ? await searchProviders(repo, params) : null;

  return (
    <>
      <EmergencyBanner emergencyNumber={config.emergencyNumber} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-start">
          {/* lg:pt-7 lines the title up with the location input, below its label. */}
          <div className="lg:pt-7">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {careService ? careService.name : selected ? selected.name : "Care providers"}
              {location && <span className="text-ink-muted"> near {location.label}</span>}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {careService && <>{careService.description} </>}
              Showing providers whose service area covers your location. Distances are approximate.
            </p>
            {careService?.note && (
              <p className="mt-2 flex gap-2 text-sm font-medium text-sky-900">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                {careService.note}
              </p>
            )}
          </div>
          <DiscoverLocationBar
            key={location?.label ?? "none"}
            location={location}
            category={params.category}
            service={params.service}
          />
        </div>

        {/* Scope pickers: who can help, then what they should do. Both rows scroll sideways on
            phones — by hand, and drifting on their own between swipes, with a fade on the right
            hinting there is more. Links carry the current filters through so switching scope does
            not throw away a price or rating the user just set. */}
        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 text-xs font-bold tracking-wider text-ink-muted uppercase">Who can help</p>
            <AutoScrollRow
              label="Provider categories"
              className="-mx-4 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:mx-0 sm:px-0 sm:[mask-image:none]"
            >
              <ul className="flex w-max gap-2 pr-4 sm:w-auto sm:flex-wrap sm:pr-0">
                <li>
                  <Link
                    href={`/discover${toQuery({ ...raw, category: undefined })}`}
                    aria-current={!selected ? "page" : undefined}
                    className={cn(chipClass, !selected ? chipOnClass : chipOffClass)}
                  >
                    All care
                  </Link>
                </li>
                {activeCategories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/discover${toQuery({ ...raw, category: category.id, service: undefined })}`}
                      aria-current={selected?.id === category.id ? "page" : undefined}
                      className={cn(chipClass, "gap-2", selected?.id === category.id ? chipOnClass : chipOffClass)}
                    >
                      <CategoryIcon category={category.id} className="size-4" />
                      {category.shortName}
                    </Link>
                  </li>
                ))}
              </ul>
            </AutoScrollRow>
          </div>

          {/* Hidden for a category with no services mapped to it, rather than showing a lone "Any service". */}
          <div className={cn(offeredServices.length === 0 && "hidden")}>
            <p className="mb-2 text-xs font-bold tracking-wider text-ink-muted uppercase">What you need</p>
            <AutoScrollRow
              label="Care services"
              className="-mx-4 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:mx-0 sm:px-0 sm:[mask-image:none]"
            >
              <ul className="flex w-max gap-2 pr-4 sm:w-auto sm:flex-wrap sm:pr-0">
                <li>
                  <Link
                    href={`/discover${toQuery({ ...raw, service: undefined })}`}
                    aria-current={!careService ? "page" : undefined}
                    className={cn(chipClass, !careService ? chipOnClass : chipOffClass)}
                  >
                    Any service
                  </Link>
                </li>
                {offeredServices.map((service) => {
                  const isOn = careService?.id === service.id;
                  return (
                    <li key={service.id}>
                      <Link
                        href={`/discover${toQuery({ ...raw, service: service.id })}`}
                        aria-current={isOn ? "page" : undefined}
                        title={service.summary}
                        className={cn(chipClass, "gap-2", isOn ? chipOnClass : chipOffClass)}
                      >
                        <CareServiceIcon service={service.id} className={cn("size-4", !isOn && "text-brand-600")} />
                        {service.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </AutoScrollRow>
          </div>
        </div>

        {!parsed.success && (
          <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            Some filters in the link were invalid and have been ignored.
          </p>
        )}

        {!location || !discovery ? (
          <div className="mt-10 rounded-2xl border border-line bg-white px-6 py-14 text-center shadow-sm">
            <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-brand-50 text-brand-700">
              <MapPin aria-hidden className="size-7" />
            </span>
            <h2 className="text-lg font-bold text-ink">Set your location to see nearby providers</h2>
            <p className="mt-1 text-sm text-ink-muted">Search your area above or use your current location.</p>
          </div>
        ) : (
          <div className="mt-6">
            <section aria-labelledby="results-heading" className="min-w-0">
              <ProviderFilters current={raw} languages={languages} resultCount={discovery.results.length} />

              <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <h2 id="results-heading" className="font-bold text-ink" aria-live="polite">
                  {discovery.results.length} {discovery.results.length === 1 ? "provider" : "providers"} available
                </h2>
                {discovery.results.length > 0 && (
                  <MapPanel
                    collapsible
                    caption="Provider base locations are approximate."
                    markers={[
                      { id: "you", latitude: location.latitude, longitude: location.longitude, label: `You: ${location.label}`, kind: "user" },
                      ...discovery.results.map((r) => ({
                        id: r.provider.id,
                        latitude: r.provider.baseLocation.latitude,
                        longitude: r.provider.baseLocation.longitude,
                        label: r.provider.name,
                        kind: "provider" as const,
                      })),
                    ]}
                  />
                )}
              </div>

              {discovery.results.length === 0 ? (
                <div className="rounded-2xl border border-line bg-white p-8 text-center">
                  <SearchX aria-hidden className="mx-auto size-10 text-ink-muted" />
                  <h3 className="mt-3 text-lg font-bold">No providers match</h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                    {discovery.totalInCategory > 0
                      ? `${discovery.totalInCategory} provider${discovery.totalInCategory === 1 ? " serves" : "s serve"} this area, but your filters hide them.`
                      : "No providers for this service or category serve this location yet. Try another one or a nearby area — larger cities have the most providers."}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <ButtonLink
                      variant="secondary"
                      href={`/discover${toQuery({ ...locationQuery, category: params.category, service: params.service })}`}
                    >
                      Clear filters
                    </ButtonLink>
                    <ButtonLink variant="ghost" href={`/discover${toQuery(locationQuery)}`}>
                      See all categories
                    </ButtonLink>
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {discovery.results.map((result) => (
                    <li key={result.provider.id}>
                      <ProviderCard result={result} href={`/providers/${result.provider.id}${toQuery(locationQuery)}`} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
