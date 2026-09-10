"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CareServiceIcon } from "@/components/category-meta";
import { CategorySelector } from "@/components/category-selector";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { CARE_SERVICES } from "@/lib/care-services";
import { locationToParams, type ChosenLocation } from "@/lib/location";
import type { CareServiceId, Category, CategoryId } from "@/types";

type Selection = { category?: CategoryId; service?: CareServiceId };

/** Homepage flow: choose a location, then a care service or category → discovery results. */
export function HomeSearch({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useState<ChosenLocation | null>(null);
  const [error, setError] = useState<string | undefined>();

  function go(selection: Selection = {}) {
    if (!location) {
      setError("Choose your area or use your current location first.");
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
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={() => go()} data-testid="find-care">
            Find care nearby <ArrowRight aria-hidden className="size-4" />
          </Button>
          <span className="text-sm text-ink-muted">or pick the kind of help you need below</span>
        </div>
      </div>

      <section aria-labelledby="services-heading">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="services-heading" className="text-xl font-bold text-ink">
            What do you need at home?
          </h2>
          <Link href="/services" className="text-sm font-semibold text-brand-700 hover:underline">
            Service details & prices →
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CARE_SERVICES.map((service) => (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => go({ service: service.id })}
                data-testid={`service-${service.id}`}
                className="group flex h-full w-full flex-col rounded-2xl border border-line bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <CareServiceIcon service={service.id} className="size-6" />
                </span>
                <span className="mt-3 flex items-center justify-between gap-1 font-bold text-ink">
                  {service.name}
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-muted transition group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 text-sm text-ink-muted">{service.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-4 text-xl font-bold text-ink">
          Or choose a type of professional
        </h2>
        <CategorySelector categories={categories} onSelect={(category) => go({ category })} />
      </section>
    </div>
  );
}
