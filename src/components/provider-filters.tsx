"use client";

import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { Input, Label, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type Current = Record<string, string | undefined>;

/** Location/category/service params survive "clear filters". */
const KEEP_ON_RESET = ["lat", "lng", "label", "category", "service"];

const AVAILABILITY_LABELS: Record<string, string> = { today: "Today", tomorrow: "By tomorrow", week: "Within 7 days" };
const GENDER_LABELS: Record<string, string> = { female: "Female", male: "Male" };

/**
 * Params shown as removable chips and counted in the badge, in the order they appear.
 * Service and category are the page's scope — set from the nav, kept by "clear all" — so they are
 * deliberately left out of both.
 */
const CHIPS: { key: string; label: (value: string) => string }[] = [
  { key: "q", label: (v) => `“${v}”` },
  { key: "verifiedOnly", label: () => "Verified only" },
  { key: "availability", label: (v) => AVAILABILITY_LABELS[v] ?? v },
  { key: "maxDistanceKm", label: (v) => `Within ${v} km` },
  { key: "maxPrice", label: (v) => `Up to ₹${Number(v).toLocaleString("en-IN")}` },
  { key: "minRating", label: (v) => `${v}★ and up` },
  { key: "language", label: (v) => v },
  { key: "gender", label: (v) => GENDER_LABELS[v] ?? v },
];

type Option = { value: string; label: string };

function Group({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/**
 * A row of single-select pills. Real radio inputs keep arrow-key navigation and screen-reader
 * semantics; the visible pill is the label, styled off `peer-checked`.
 */
function ChipGroup({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: string;
  options: Option[];
  onChange: (value: string | null) => void;
}) {
  const id = useId();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const optionId = `${id}-${option.value || "any"}`;
          return (
            <div key={option.value}>
              <input
                id={optionId}
                type="radio"
                name={`${id}-${name}`}
                className="peer sr-only"
                checked={value === option.value}
                onChange={() => onChange(option.value || null)}
              />
              <label
                htmlFor={optionId}
                className={cn(
                  "inline-flex cursor-pointer items-center rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink-muted transition",
                  "hover:border-brand-300 hover:text-brand-700",
                  "peer-checked:border-brand-700 peer-checked:bg-brand-700 peer-checked:text-white",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600/40 peer-focus-visible:ring-offset-1",
                )}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Filters and sorting are URL-driven so results are shareable and server-rendered. Everything lives
 * behind one button: the toolbar stays a single line, and the applied filters read back as chips.
 */
export function ProviderFilters({
  current,
  languages,
  resultCount,
}: {
  current: Current;
  languages: string[];
  resultCount: number;
}) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const active = CHIPS.filter((chip) => current[chip.key]);

  // showModal() can't be set declaratively, so the open state drives it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p aria-live="polite" className="sr-only">
        {pending ? "Updating results" : ""}
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="open-filters"
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition",
          active.length > 0
            ? "border-brand-700 bg-brand-50 text-brand-800"
            : "border-line bg-white text-ink hover:border-brand-300 hover:text-brand-700",
        )}
      >
        {pending ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin text-brand-700" />
        ) : (
          <SlidersHorizontal aria-hidden className="size-4 text-brand-700" />
        )}
        Filters & sorting
        {active.length > 0 && (
          <span className="grid min-w-5 place-items-center rounded-full bg-brand-700 px-1.5 py-0.5 text-xs font-bold text-white">
            {active.length}
          </span>
        )}
      </button>

      {/* Applied filters read back here so they stay visible with the drawer closed. */}
      {active.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => update(chip.key, null)}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white pr-2.5 pl-3.5 text-sm font-semibold text-ink transition hover:border-rose-300 hover:text-rose-800"
        >
          {chip.label(current[chip.key]!)}
          <X aria-hidden className="size-3.5" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}

      {active.length > 0 && (
        <button type="button" onClick={reset} className="px-1 text-sm font-semibold text-brand-700 hover:underline">
          Clear all
        </button>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        // Native dialog centres itself; these margins pin it to the right edge as a drawer.
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="drawer m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/40 sm:rounded-l-2xl"
        aria-labelledby={f("drawer-title")}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
            <h2 id={f("drawer-title")} className="flex items-center gap-2 text-lg font-bold">
              <SlidersHorizontal aria-hidden className="size-4 text-brand-700" /> Filters & sorting
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              className="grid size-9 place-items-center rounded-lg text-ink-muted transition hover:bg-canvas hover:text-ink"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <div className={cn("flex-1 overflow-y-auto px-5 py-5 transition-opacity", pending && "opacity-60")} aria-busy={pending}>
            <form
              role="search"
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q");
                update("q", typeof q === "string" && q.trim() ? q.trim() : null);
              }}
            >
              <Label htmlFor={f("q")}>Search by name or service</Label>
              <Search aria-hidden className="pointer-events-none absolute bottom-3 left-3 size-4 text-ink-muted" />
              <Input
                id={f("q")}
                name="q"
                key={current.q ?? ""}
                defaultValue={current.q ?? ""}
                placeholder="e.g. wound dressing"
                className={cn("pl-9", current.q && "pr-9")}
              />
              {current.q && (
                <button
                  type="button"
                  onClick={() => update("q", null)}
                  aria-label="Clear search"
                  className="absolute right-1.5 bottom-1.5 grid size-7 place-items-center rounded-md text-ink-muted transition hover:bg-canvas hover:text-ink"
                >
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </form>

            <div className="mt-5 border-t border-line pt-5">
              <ChipGroup
                legend="Sort by"
                name="sort"
                value={current.sort ?? "distance"}
                onChange={(value) => update("sort", value === "distance" ? null : value)}
                options={[
                  { value: "distance", label: "Nearest" },
                  { value: "availability", label: "Soonest" },
                  { value: "rating", label: "Top rated" },
                  { value: "price", label: "Lowest price" },
                ]}
              />
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <label
                htmlFor={f("verified")}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
                  current.verifiedOnly === "1" ? "border-brand-300 bg-brand-50" : "border-line bg-white hover:border-brand-300",
                )}
              >
                <input
                  id={f("verified")}
                  type="checkbox"
                  className="size-4 accent-brand-700"
                  checked={current.verifiedOnly === "1"}
                  onChange={(e) => update("verifiedOnly", e.target.checked ? "1" : null)}
                />
                <span className="text-sm font-semibold text-ink">Verified providers only</span>
              </label>
            </div>

            <div className="mt-5 space-y-5 border-t border-line pt-5">
              <ChipGroup
                legend="Availability"
                name="availability"
                value={current.availability ?? ""}
                onChange={(value) => update("availability", value)}
                options={[
                  { value: "", label: "Any time" },
                  { value: "today", label: "Today" },
                  { value: "tomorrow", label: "By tomorrow" },
                  { value: "week", label: "7 days" },
                ]}
              />

              <ChipGroup
                legend="Maximum distance"
                name="distance"
                value={current.maxDistanceKm ?? ""}
                onChange={(value) => update("maxDistanceKm", value)}
                options={[
                  { value: "", label: "Any" },
                  { value: "3", label: "3 km" },
                  { value: "5", label: "5 km" },
                  { value: "10", label: "10 km" },
                  { value: "15", label: "15 km" },
                ]}
              />

              <ChipGroup
                legend="Starting price"
                name="price"
                value={current.maxPrice ?? ""}
                onChange={(value) => update("maxPrice", value)}
                options={[
                  { value: "", label: "Any" },
                  { value: "500", label: "≤ ₹500" },
                  { value: "800", label: "≤ ₹800" },
                  { value: "1000", label: "≤ ₹1,000" },
                  { value: "1500", label: "≤ ₹1,500" },
                ]}
              />

              <ChipGroup
                legend="Minimum rating"
                name="rating"
                value={current.minRating ?? ""}
                onChange={(value) => update("minRating", value)}
                options={[
                  { value: "", label: "Any" },
                  { value: "4.5", label: "4.5★ and up" },
                  { value: "4", label: "4.0★ and up" },
                ]}
              />

              <ChipGroup
                legend="Provider gender preference"
                name="gender"
                value={current.gender ?? ""}
                onChange={(value) => update("gender", value)}
                options={[
                  { value: "", label: "No preference" },
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                ]}
              />

              <Group label="Language" htmlFor={f("language")}>
                <Select id={f("language")} value={current.language ?? ""} onChange={(e) => update("language", e.target.value || null)}>
                  <option value="">Any language</option>
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </Select>
              </Group>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
            <button
              type="button"
              onClick={reset}
              disabled={active.length === 0}
              className="text-sm font-semibold text-brand-700 hover:underline disabled:text-ink-muted disabled:no-underline disabled:opacity-50"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-brand-700 px-5 font-bold text-white transition hover:bg-brand-800"
            >
              Show {resultCount} {resultCount === 1 ? "provider" : "providers"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
