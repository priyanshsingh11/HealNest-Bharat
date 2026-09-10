"use client";

import { LoaderCircle, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useId, useTransition, type ReactNode } from "react";
import { Input, Label, Select } from "@/components/ui/field";
import { CARE_SERVICES } from "@/lib/care-services";

type Current = Record<string, string | undefined>;

/** Location/category/service params survive "clear filters". */
const KEEP_ON_RESET = ["lat", "lng", "label", "category", "service"];

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/** Filters and sorting are URL-driven so results are shareable and server-rendered. */
export function ProviderFilters({ current, languages }: { current: Current; languages: string[] }) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function navigate(next: URLSearchParams) {
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  function update(key: string, value: string | null) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) if (v) next.set(k, v);
    if (value) next.set(key, value);
    else next.delete(key);
    navigate(next);
  }

  function reset() {
    const next = new URLSearchParams();
    for (const key of KEEP_ON_RESET) if (current[key]) next.set(key, current[key]!);
    navigate(next);
  }

  const f = (name: string) => `${id}-${name}`;

  const body = (
    <div className="space-y-4">
      <Field label="Service needed" htmlFor={f("service")}>
        <Select id={f("service")} value={current.service ?? ""} onChange={(e) => update("service", e.target.value || null)}>
          <option value="">Any service</option>
          {CARE_SERVICES.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>
      </Field>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q");
          update("q", typeof q === "string" && q.trim() ? q.trim() : null);
        }}
      >
        <Field label="Search by name or service" htmlFor={f("q")}>
          <Input id={f("q")} name="q" defaultValue={current.q ?? ""} placeholder="e.g. wound dressing" />
        </Field>
      </form>

      <Field label="Sort by" htmlFor={f("sort")}>
        <Select id={f("sort")} value={current.sort ?? "distance"} onChange={(e) => update("sort", e.target.value === "distance" ? null : e.target.value)}>
          <option value="distance">Nearest first</option>
          <option value="availability">Soonest available</option>
          <option value="rating">Highest rated</option>
          <option value="price">Lowest price</option>
        </Select>
      </Field>

      <div className="flex items-center gap-2">
        <input
          id={f("verified")}
          type="checkbox"
          className="size-4 accent-brand-700"
          checked={current.verifiedOnly === "1"}
          onChange={(e) => update("verifiedOnly", e.target.checked ? "1" : null)}
        />
        <label htmlFor={f("verified")} className="text-sm font-semibold text-ink">
          Verified providers only
        </label>
      </div>

      <Field label="Availability" htmlFor={f("availability")}>
        <Select id={f("availability")} value={current.availability ?? ""} onChange={(e) => update("availability", e.target.value || null)}>
          <option value="">Any time this week</option>
          <option value="today">Available today</option>
          <option value="tomorrow">By tomorrow</option>
          <option value="week">Within 7 days</option>
        </Select>
      </Field>

      <Field label="Maximum distance" htmlFor={f("distance")}>
        <Select id={f("distance")} value={current.maxDistanceKm ?? ""} onChange={(e) => update("maxDistanceKm", e.target.value || null)}>
          <option value="">Up to 25 km</option>
          <option value="3">Within 3 km</option>
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
          <option value="15">Within 15 km</option>
        </Select>
      </Field>

      <Field label="Starting price" htmlFor={f("price")}>
        <Select id={f("price")} value={current.maxPrice ?? ""} onChange={(e) => update("maxPrice", e.target.value || null)}>
          <option value="">Any price</option>
          <option value="500">Up to ₹500</option>
          <option value="800">Up to ₹800</option>
          <option value="1000">Up to ₹1,000</option>
          <option value="1500">Up to ₹1,500</option>
        </Select>
      </Field>

      <Field label="Rating" htmlFor={f("rating")}>
        <Select id={f("rating")} value={current.minRating ?? ""} onChange={(e) => update("minRating", e.target.value || null)}>
          <option value="">Any rating</option>
          <option value="4.5">4.5 and above</option>
          <option value="4">4.0 and above</option>
        </Select>
      </Field>

      <Field label="Language" htmlFor={f("language")}>
        <Select id={f("language")} value={current.language ?? ""} onChange={(e) => update("language", e.target.value || null)}>
          <option value="">Any language</option>
          {languages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Provider gender preference" htmlFor={f("gender")}>
        <Select id={f("gender")} value={current.gender ?? ""} onChange={(e) => update("gender", e.target.value || null)}>
          <option value="">No preference</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </Select>
      </Field>

      <button type="button" onClick={reset} className="text-sm font-semibold text-brand-700 underline underline-offset-2">
        Clear all filters
      </button>
    </div>
  );

  return (
    <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
      <p aria-live="polite" className="sr-only">
        {pending ? "Updating results" : ""}
      </p>
      {/* Mobile: collapsible. Desktop: always open. */}
      <details className="group rounded-2xl border border-line bg-white lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden className="size-4" /> Filters & sorting
          </span>
          {pending && <LoaderCircle aria-hidden className="size-4 animate-spin text-brand-700" />}
        </summary>
        <div className="border-t border-line p-4">{body}</div>
      </details>
      <div className="hidden rounded-2xl border border-line bg-white p-5 lg:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <SlidersHorizontal aria-hidden className="size-4" /> Filters
          </h2>
          {pending && <LoaderCircle aria-hidden className="size-4 animate-spin text-brand-700" />}
        </div>
        {body}
      </div>
    </aside>
  );
}
