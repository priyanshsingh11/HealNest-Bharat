"use client";

import { LoaderCircle, LocateFixed, MapPin, X } from "lucide-react";
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

  const suggestions = searchLocalities(query);

  function choose(location: ChosenLocation) {
    onChange(location);
    setQuery(location.label);
    setOpen(false);
    setGeoError(null);
  }

  function chooseSuggestion(index: number) {
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

  function useMyLocation() {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Your browser doesn't support location access. Please type your area instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        choose({ label: "Current location", latitude: coarse(position.coords.latitude), longitude: coarse(position.coords.longitude) });
      },
      (error) => {
        setLocating(false);
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Type your area instead."
            : "We couldn't get your location. Type your area instead.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
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
            placeholder="Search your area, e.g. Saket, Andheri West, Koramangala"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
              if (value) onChange(null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            className={cn(
              "block w-full rounded-xl border border-line bg-white pl-10 pr-10 text-ink shadow-sm placeholder:text-slate-500",
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
                onChange(null);
              }}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-muted hover:bg-slate-100"
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
                  No matching area. The demo covers Delhi-NCR, Mumbai and Bengaluru.
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
          {locating ? "Locating…" : "Use my location"}
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
    </div>
  );
}
