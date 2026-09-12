"use client";

import { CheckCircle2, LoaderCircle, LocateFixed, MapPin, X } from "lucide-react";
import { useId, useState, type KeyboardEvent, type Ref } from "react";
import { cn } from "@/lib/cn";
import { localityLabel, searchLocalities } from "@/lib/localities";
import type { ChosenLocation } from "@/lib/location";

type Props = {
  value: ChosenLocation | null;
  onChange: (location: ChosenLocation | null) => void;
  size?: "md" | "lg";
  label?: string;
  errorMessage?: string;
  inputRef?: Ref<HTMLInputElement>;
};

/** Rounded to ~100 m so precise coordinates are never kept in URLs or shared before booking. */
const coarse = (n: number) => Math.round(n * 1000) / 1000;

/** The real-world address behind the GPS fix, from /api/geo/reverse. */
type ResolvedAddress = {
  formattedAddress: string;
  shortAddress: string;
  postcode?: string;
  latitude: number;
  longitude: number;
  accuracyM?: number;
};

/**
 * Address search (offline locality list for the MVP) plus optional browser geolocation.
 * Accessible combobox: arrow keys move through suggestions, Enter selects, Escape closes.
 */
export function LocationPicker({ value, onChange, size = "md", label = "Where do you need care?", errorMessage, inputRef }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [query, setQuery] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedAddress | null>(null);

  const suggestions = searchLocalities(query);

  function choose(location: ChosenLocation) {
    onChange(location);
    setQuery(location.label);
    setOpen(false);
    setGeoError(null);
  }

  function chooseSuggestion(index: number) {
    setResolved(null);
    const locality = suggestions[index];
    if (locality) choose({ label: localityLabel(locality), latitude: locality.latitude, longitude: locality.longitude });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open && suggestions.length) {
      event.preventDefault();
      chooseSuggestion(active);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  /**
   * Turns the raw GPS fix into the user's actual address so the field shows
   * "Saket, New Delhi" rather than a bare "Current location".
   * Coordinates are still stored coarse (~100 m) — only the lookup uses the precise fix.
   */
  async function resolveAddress(latitude: number, longitude: number, accuracyM?: number) {
    try {
      const res = await fetch(`/api/geo/reverse?lat=${latitude}&lng=${longitude}`, { signal: AbortSignal.timeout(8_000) });
      const data = res.ok ? await res.json() : null;
      if (data?.ok) {
        const shortAddress: string = data.shortAddress || [data.locality, data.city].filter(Boolean).join(", ");
        if (shortAddress) {
          setResolved({
            formattedAddress: data.formattedAddress || shortAddress,
            shortAddress,
            postcode: data.postcode || undefined,
            latitude,
            longitude,
            accuracyM,
          });
          choose({ label: shortAddress, latitude: coarse(latitude), longitude: coarse(longitude) });
          return;
        }
      }
    } catch {
      // Address lookup failed — the coordinates alone are still usable for search.
    }
    setResolved(null);
    choose({ label: "Current location", latitude: coarse(latitude), longitude: coarse(longitude) });
  }

  function useMyLocation() {
    setGeoError(null);
    setResolved(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Your browser doesn't support location access. Please type your area instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        void resolveAddress(latitude, longitude, Number.isFinite(accuracy) ? Math.round(accuracy) : undefined).finally(() =>
          setLocating(false),
        );
      },
      (error) => {
        setLocating(false);
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Type your area instead."
            : "We couldn't get your location. Type your area instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  }

  const shownError = errorMessage ?? geoError ?? undefined;
  const large = size === "lg";

  return (
    <div>
      <label htmlFor={id} className={cn("mb-2 block font-semibold text-ink", large ? "text-base" : "text-sm")}>
        {label}
      </label>
      <div className={cn("flex flex-col gap-2", large ? "sm:flex-row" : "")}>
        <div className="relative flex-1">
          <MapPin aria-hidden className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-700", large ? "size-5" : "size-4")} />
          <input
            id={id}
            ref={inputRef}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && suggestions[active] ? `${listId}-${suggestions[active].id}` : undefined}
            aria-describedby={cn(hintId, shownError && errorId) || undefined}
            aria-invalid={Boolean(shownError)}
            placeholder="Your area or city, e.g. Saket"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
              setResolved(null);
              if (value) onChange(null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            className={cn(
              "block w-full rounded-xl border border-line bg-white pl-10 pr-10 text-ink shadow-sm placeholder:text-ink-muted",
              "focus:border-sea-600 focus:outline-none focus:ring-2 focus:ring-sea-600/30 aria-[invalid=true]:border-rose-500",
              large ? "h-14 text-base" : "h-11 text-sm",
            )}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear location"
              onClick={() => {
                setQuery("");
                setResolved(null);
                onChange(null);
              }}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-muted hover:bg-brand-50"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
          {open && (
            <ul
              id={listId}
              role="listbox"
              aria-label="Matching areas"
              className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg"
            >
              {suggestions.length === 0 && (
                <li className="px-4 py-3 text-sm text-ink-muted">
                  No matching area. Try your city name instead, e.g. Lucknow or Coimbatore.
                </li>
              )}
              {suggestions.map((locality, index) => (
                <li
                  key={locality.id}
                  id={`${listId}-${locality.id}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => chooseSuggestion(index)}
                  onMouseEnter={() => setActive(index)}
                  className={cn("flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm", index === active && "bg-brand-50")}
                >
                  <MapPin aria-hidden className="size-4 text-ink-muted" />
                  <span className="font-medium">{locality.name}</span>
                  <span className="text-ink-muted">{locality.city}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 font-semibold text-brand-800 hover:bg-brand-50",
            large ? "h-14 text-base" : "h-11 text-sm",
          )}
        >
          {locating ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <LocateFixed aria-hidden className="size-4" />}
          {locating ? "Finding your address…" : "Use my location"}
        </button>
      </div>
      <p id={hintId} className="mt-2 text-xs text-ink-muted">
        Your location is only used to find providers nearby. It is shared with a provider only after you confirm a booking.
      </p>
      {shownError && (
        <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-rose-700">
          {shownError}
        </p>
      )}
      {resolved && !shownError && (
        <div role="status" className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-700" />
          <div className="min-w-0">
            <p className="font-semibold text-emerald-950">{resolved.shortAddress}</p>
            <p className="mt-0.5 leading-relaxed text-emerald-900/90">{resolved.formattedAddress}</p>
            <p className="mt-1 text-emerald-800/80">
              <span className="font-mono">
                {resolved.latitude.toFixed(5)}, {resolved.longitude.toFixed(5)}
              </span>
              {resolved.postcode ? ` · PIN ${resolved.postcode}` : ""}
              {resolved.accuracyM ? ` · ±${resolved.accuracyM} m` : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
