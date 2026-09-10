import { ArrowRight, Check, Info } from "lucide-react";
import type { Metadata } from "next";
import { CareServiceIcon, CategoryIcon } from "@/components/category-meta";
import { EmergencyBanner } from "@/components/emergency-banner";
import { ButtonLink } from "@/components/ui/button";
import { CARE_SERVICES } from "@/lib/care-services";
import { categoryName } from "@/lib/categories";
import { getRepository } from "@/lib/db";
import { formatMoney } from "@/lib/formatters";
import { toQuery } from "@/lib/location";
import type { CareServiceId } from "@/types";

export const metadata: Metadata = { title: "Home care services" };

export default async function ServicesPage() {
  const repo = getRepository();
  const [services, providers, categories, config] = await Promise.all([
    repo.listServices(),
    repo.listProviders(),
    repo.listCategories(),
    repo.getPlatformConfig(),
  ]);
  const activeProviders = new Set(providers.filter((p) => p.active).map((p) => p.id));
  const activeCategories = new Set(categories.filter((c) => c.active).map((c) => c.id));

  /** Lowest visit fee across bookable listings, or null when nobody currently offers the service. */
  function startingPrice(id: CareServiceId): number | null {
    const prices = services
      .filter((s) => s.careService === id && s.active && activeProviders.has(s.providerId) && activeCategories.has(s.category))
      .map((s) => s.basePriceMinor);
    return prices.length ? Math.min(...prices) : null;
  }

  return (
    <>
      <EmergencyBanner emergencyNumber={config.emergencyNumber} />

      <section className="hero-surface">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Our services</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Care at home, done properly.</h1>
          <p className="mt-3 max-w-3xl text-lg text-ink-muted">
            Eight home services from verified nurses, physiotherapists, phlebotomists, doctors and caregivers. Prices below are
            starting visit fees. Your full itemised quote appears before you confirm.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <ul className="grid gap-4 md:grid-cols-2">
          {CARE_SERVICES.map((service) => {
            const from = startingPrice(service.id);
            return (
              <li key={service.id} id={service.id} className="flex scroll-mt-24 flex-col rounded-2xl border border-line bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <CareServiceIcon service={service.id} className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-ink">{service.name}</h2>
                    <p className="text-sm font-semibold text-ink-muted">
                      {from === null ? "Currently unavailable" : <>From {formatMoney(from)}</>}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-ink">{service.description}</p>

                <ul className="mt-3 space-y-1.5 text-sm text-ink">
                  {service.includes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                      {item}
                    </li>
                  ))}
                </ul>

                {service.note && (
                  <p className="mt-4 flex gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
                    <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                    {service.note}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-ink-muted">
                    <span className="uppercase tracking-wide">Provided by</span>
                    {service.providedBy.map((category) => (
                      <span key={category} className="inline-flex items-center gap-1 text-ink">
                        <CategoryIcon category={category} className="size-3.5" />
                        {categoryName(category)}
                      </span>
                    ))}
                  </p>
                  {from !== null && (
                    <ButtonLink size="sm" href={`/discover${toQuery({ service: service.id })}`} data-testid={`find-${service.id}`}>
                      Find providers <ArrowRight aria-hidden className="size-4" />
                    </ButtonLink>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 max-w-3xl text-sm text-ink-muted">
          Home visits are for non-emergency needs only. Medicines and injections are administered only against a valid
          prescription from a registered medical practitioner. For emergencies, dial {config.emergencyNumber}.
        </p>
      </div>
    </>
  );
}
