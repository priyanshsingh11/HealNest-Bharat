import { ArrowRight, Check, Info } from "lucide-react";
import type { Metadata } from "next";
import { CareServiceIcon, CategoryIcon, ComingSoonBadge } from "@/components/category-meta";
import { EmergencyBanner } from "@/components/emergency-banner";
import { ServiceScopeAccordion } from "@/components/service-scope-accordion";
import { ButtonLink } from "@/components/ui/button";
import { AVAILABLE_CARE_SERVICES, CARE_SERVICES, isCareServiceComingSoon } from "@/lib/care-services";
import { bookableCategories, isComingSoon } from "@/lib/categories";
import { getRepository } from "@/lib/db";
import { formatMoney } from "@/lib/formatters";
import { domainMessages, localizeCareService } from "@/lib/i18n/messages/domain";
import { servicesMessages } from "@/lib/i18n/messages/services";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { toQuery } from "@/lib/location";
import type { CareServiceId } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(servicesMessages);
  return { title: t.metaTitle };
}

export default async function ServicesPage() {
  const repo = getRepository();
  const [services, providers, categories, config, locale] = await Promise.all([
    repo.listServices(),
    repo.listProviders(),
    repo.listCategories(),
    repo.getPlatformConfig(),
    getLocale(),
  ]);
  const t = servicesMessages[locale];
  const domain = domainMessages[locale];
  const activeProviders = new Set(providers.filter((p) => p.active).map((p) => p.id));
  const activeCategories = new Set(bookableCategories(categories).map((c) => c.id));

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
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">{t.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t.heading}</h1>
          <p className="mt-3 max-w-3xl text-lg text-ink-muted">
            {t.intro(AVAILABLE_CARE_SERVICES.length, CARE_SERVICES.length - AVAILABLE_CARE_SERVICES.length)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6">
        <ul className="grid gap-4 md:grid-cols-2">
          {CARE_SERVICES.map((english) => {
            const service = localizeCareService(english, locale);
            const soon = isCareServiceComingSoon(service);
            const from = soon ? null : startingPrice(service.id);
            return (
              <li key={service.id} id={service.id} className="flex scroll-mt-24 flex-col rounded-2xl border border-line bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <CareServiceIcon service={service.id} className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-ink">{service.name}</h2>
                      {soon && <ComingSoonBadge />}
                    </div>
                    <p className="text-sm font-semibold text-ink-muted">
                      {soon ? t.notOpen : from === null ? t.unavailable : t.from(formatMoney(from))}
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

                {service.scope && <ServiceScopeAccordion items={service.scope} />}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-ink-muted">
                    <span className="uppercase tracking-wide">{t.providedBy}</span>
                    {service.providedBy
                      .filter((category) => activeCategories.has(category) || isComingSoon(category))
                      .map((category) => (
                        <span key={category} className="inline-flex items-center gap-1 text-ink">
                          <CategoryIcon category={category} className="size-3.5" />
                          {domain.categories[category].name}
                        </span>
                      ))}
                  </p>
                  {from !== null && (
                    <ButtonLink size="sm" href={`/discover${toQuery({ service: service.id })}`} data-testid={`find-${service.id}`}>
                      {t.findProviders} <ArrowRight aria-hidden className="size-4" />
                    </ButtonLink>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 max-w-3xl text-sm text-ink-muted">{t.disclaimer(config.emergencyNumber)}</p>
      </div>
    </>
  );
}
