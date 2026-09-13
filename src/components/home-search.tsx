"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CareServiceIcon, CategoryIcon, ComingSoonBadge } from "@/components/category-meta";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { CARE_SERVICES, isCareServiceComingSoon } from "@/lib/care-services";
import { isComingSoon } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n/client";
import { domainMessages, localizeCareService } from "@/lib/i18n/messages/domain";
import { homeMessages } from "@/lib/i18n/messages/home";
import { locationToParams, type ChosenLocation } from "@/lib/location";
import type { CareServiceId, Category, CategoryId } from "@/types";

type Selection = { category?: CategoryId; service?: CareServiceId };

/** Homepage flow: choose a location, then a care service or professional → discovery results. */
export function HomeSearch({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const locale = useLocale();
  const t = homeMessages[locale].search;
  const professions = domainMessages[locale].professions;
  const inputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useState<ChosenLocation | null>(null);
  const [error, setError] = useState<string | undefined>();

  function go(selection: Selection = {}) {
    if (!location) {
      setError(t.chooseLocationFirst);
      inputRef.current?.focus();
      return;
    }
    const params = locationToParams(location);
    if (selection.category) params.set("category", selection.category);
    if (selection.service) params.set("service", selection.service);
    router.push(`/discover?${params.toString()}`);
  }

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
        <LocationPicker
          size="lg"
          value={location}
          inputRef={inputRef}
          errorMessage={error}
          onChange={(next) => {
            setLocation(next);
            if (next) setError(undefined);
          }}
        />
        <Button size="lg" className="mt-4 w-full sm:w-auto" onClick={() => go()} data-testid="find-care">
          {t.findNearby} <ArrowRight aria-hidden className="size-4" />
        </Button>
      </div>

      <section aria-labelledby="services-heading">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="services-heading" className="text-xl font-bold text-ink">
            {t.servicesHeading}
          </h2>
          <Link href="/services" className="text-sm font-semibold text-brand-700 hover:underline">
            {t.servicesLink}
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CARE_SERVICES.map((english) => {
            const service = localizeCareService(english, locale);
            const soon = isCareServiceComingSoon(service);
            return (
              <li key={service.id}>
                <button
                  type="button"
                  disabled={soon}
                  aria-disabled={soon || undefined}
                  onClick={() => go({ service: service.id })}
                  data-testid={`service-${service.id}`}
                  className={cn(
                    "flex h-full w-full flex-col items-start gap-2 rounded-2xl border p-3 text-left text-sm font-semibold transition sm:flex-row sm:items-center sm:gap-3 sm:text-base",
                    soon
                      ? "cursor-not-allowed border-dashed border-line bg-canvas text-ink-muted"
                      : "border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      soon ? "bg-white text-ink-muted" : "bg-brand-50 text-brand-700",
                    )}
                  >
                    <CareServiceIcon service={service.id} className="size-5" />
                  </span>
                  <span className="min-w-0 break-words">
                    {service.name}
                    {soon && (
                      <span className="mt-1 block sm:mt-1.5">
                        <ComingSoonBadge />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="categories-heading" className="flex flex-wrap items-center gap-3">
        <h2 id="categories-heading" className="text-sm font-semibold text-ink-muted">
          {t.categoriesHeading}
        </h2>
        {/* One swipeable row on phones; wraps on wider screens. */}
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {categories.map((category) => {
            const soon = isComingSoon(category.id);
            return (
              <li key={category.id} className="shrink-0">
                <button
                  type="button"
                  disabled={soon}
                  aria-disabled={soon || undefined}
                  title={soon ? t.comingSoonTitle(professions[category.id]) : undefined}
                  onClick={() => go({ category: category.id })}
                  data-testid={`category-${category.id}`}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition",
                    soon
                      ? "cursor-not-allowed border-dashed border-line bg-canvas text-ink-muted"
                      : "border-line bg-white text-ink hover:border-brand-300 hover:text-brand-700",
                  )}
                >
                  <CategoryIcon category={category.id} className="size-4" />
                  {professions[category.id]}
                  {soon && <span className="text-xs font-bold text-amber-700">{t.soon}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
