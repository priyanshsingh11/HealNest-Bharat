"use client";

import { useId, useState, useEffect, useRef, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import {
  CheckCircle2,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { findLocality, localityLabel, type Locality } from "@/lib/localities";

const InteractiveLocationMap = dynamic(
  () => import("@/components/interactive-location-map"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed border-line bg-canvas text-sm text-ink-muted">
        Loading interactive map…
      </div>
    ),
  },
);

type SearchResultItem = {
  id: string;
  name: string;
  locality: string;
  city: string;
  state: string;
  postcode?: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

export type ExactLocationPayload = {
  latitude: number;
  longitude: number;
  locality: string;
  city: string;
  formattedAddress?: string;
  flatOrHouse?: string;
  postcode?: string;
};

const POPULAR_AREAS = [
  { label: "Connaught Place, Delhi", lat: 28.6315, lng: 77.2167 },
  { label: "Saket, South Delhi", lat: 28.5245, lng: 77.2066 },
  { label: "Cyber City, Gurugram", lat: 28.4951, lng: 77.0885 },
  { label: "Noida Sector 18", lat: 28.5708, lng: 77.3261 },
  { label: "Indiranagar, Bengaluru", lat: 12.9719, lng: 77.6412 },
  { label: "Bandra West, Mumbai", lat: 19.0596, lng: 72.8295 },
  { label: "HSR Layout, Bengaluru", lat: 12.9121, lng: 77.6446 },
  { label: "Salt Lake, Kolkata", lat: 22.5868, lng: 88.4178 },
];

type Props = {
  defaultValue?: string;
  error?: string;
  name?: string;
  id?: string;
};

export function CaretakerLocationPicker({ defaultValue, error, name = "localityId", id: propId }: Props) {
  const autoId = useId();
  const id = propId ?? autoId;

  // Initial locality fallback
  const initialLocality = (defaultValue ? findLocality(defaultValue) : null) ?? findLocality("del-saket") ?? null;

  const [localityId, setLocalityId] = useState<string>(initialLocality?.id ?? "del-saket");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() =>
    initialLocality ? { lat: initialLocality.latitude, lng: initialLocality.longitude } : { lat: 28.5245, lng: 77.2066 },
  );
  const [zoom, setZoom] = useState<number>(14);

  // Exact location state
  const [exactLocation, setExactLocation] = useState<ExactLocationPayload | null>(() =>
    initialLocality
      ? {
          latitude: initialLocality.latitude,
          longitude: initialLocality.longitude,
          locality: initialLocality.name,
          city: initialLocality.city,
          formattedAddress: `${initialLocality.name}, ${initialLocality.city}, ${initialLocality.state}, India`,
        }
      : null,
  );

  const [flatOrHouse, setFlatOrHouse] = useState("");
  const [query, setQuery] = useState(initialLocality ? localityLabel(initialLocality) : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search API call with debounce
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        // keep old results or empty
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query]);

  // Reverse geocode a lat/lng to get the exact real-world address
  async function reverseGeocode(lat: number, lng: number, source: "gps" | "map" | "search" = "map") {
    setResolvingAddress(true);
    try {
      const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          const payload: ExactLocationPayload = {
            latitude: data.latitude,
            longitude: data.longitude,
            locality: data.locality,
            city: data.city,
            formattedAddress: data.formattedAddress,
            postcode: data.postcode,
            flatOrHouse,
          };

          setExactLocation(payload);
          setLocalityId(data.nearestLocalityId || "del-saket");
          setCoords({ lat: data.latitude, lng: data.longitude });
          setQuery(data.formattedAddress || `${data.locality}, ${data.city}`);

          if (source === "gps") {
            setGeoNotice(`Exact GPS location found: ${data.formattedAddress}`);
            setZoom(16);
          } else if (source === "map") {
            setGeoNotice(`Pin placed at: ${data.formattedAddress}`);
          }
        }
      }
    } catch {
      setGeoNotice("Location pinned. Could not fetch complete street address, using approximate area.");
    } finally {
      setResolvingAddress(false);
    }
  }

  // Handle clicking on the map
  function handleMapClick(lat: number, lng: number) {
    setCoords({ lat, lng });
    reverseGeocode(lat, lng, "map");
  }

  // Handle browser Geolocation
  function handleUseMyLocation() {
    setGeoNotice(null);
    if (!("geolocation" in navigator)) {
      setGeoNotice("Browser GPS is not supported on this device. Search below instead.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude, "gps");
      },
      (err) => {
        setLocating(false);
        setGeoNotice(
          err.code === err.PERMISSION_DENIED
            ? "GPS permission was denied. Please search your colony/street in the box."
            : "Could not retrieve GPS location. Please type your area or landmark.",
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  }

  // Select a suggestion from search
  function selectSearchResult(item: SearchResultItem) {
    const payload: ExactLocationPayload = {
      latitude: item.latitude,
      longitude: item.longitude,
      locality: item.locality || item.name,
      city: item.city,
      formattedAddress: item.formattedAddress,
      postcode: item.postcode,
      flatOrHouse,
    };

    setExactLocation(payload);
    setCoords({ lat: item.latitude, lng: item.longitude });
    setZoom(15);
    setQuery(item.formattedAddress || `${item.name}, ${item.city}`);
    setOpen(false);
    setGeoNotice(`Selected exact address: ${item.name}`);

    // Update nearest locality ID
    reverseGeocode(item.latitude, item.longitude, "search");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open && searchResults.length) {
      event.preventDefault();
      const chosen = searchResults[active];
      if (chosen) selectSearchResult(chosen);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // Sync flat/house details into exactLocation JSON
  const finalExactPayload: ExactLocationPayload | null = exactLocation
    ? {
        ...exactLocation,
        flatOrHouse: flatOrHouse.trim() || undefined,
      }
    : null;

  return (
    <div className="space-y-3">
      {/* Hidden inputs submitted with the form */}
      <input type="hidden" name={name} value={localityId} id={`${id}-hidden`} />
      <input
        type="hidden"
        name="exactLocation"
        value={finalExactPayload ? JSON.stringify(finalExactPayload) : ""}
        id={`${id}-exact-hidden`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label htmlFor={`${id}-search`} className="text-sm font-semibold text-ink">
            Exact Service Base Address <span className="text-rose-600">*</span>
          </label>
          <p className="text-xs text-ink-muted">
            Search any street, landmark, or colony — or use GPS / map to pinpoint your exact home/clinic.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-300 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-900 shadow-sm transition hover:bg-brand-100 disabled:opacity-50"
        >
          {locating ? (
            <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
          ) : (
            <LocateFixed aria-hidden className="size-3.5 text-brand-700" />
          )}
          {locating ? "Acquiring GPS precision…" : "Use my exact location"}
        </button>
      </div>

      {/* Real-time Address Search Box */}
      <div className="relative">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            id={`${id}-search`}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-expanded={open}
            aria-autocomplete="list"
            placeholder="Search street, society, building, metro, or colony (e.g. DLF Phase 2, Saket Block J…)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => {
              if (searchResults.length > 0) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            className={cn(
              "block w-full rounded-xl border border-line bg-white pl-10 pr-10 py-2.5 text-sm text-ink shadow-sm placeholder:text-ink-muted",
              "focus:border-sea-600 focus:outline-none focus:ring-2 focus:ring-sea-600/30",
              error && "border-rose-500",
            )}
          />
          {searching ? (
            <LoaderCircle
              aria-hidden
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-muted"
            />
          ) : query ? (
            <button
              type="button"
              aria-label="Clear address"
              onClick={() => {
                setQuery("");
                setSearchResults([]);
              }}
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-ink-muted hover:bg-canvas"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Live Address Suggestions Dropdown */}
        {open && searchResults.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-white py-1 shadow-xl"
          >
            {searchResults.map((item, index) => (
              <li
                key={item.id}
                role="option"
                aria-selected={active === index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSearchResult(item);
                }}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 px-3.5 py-2.5 text-sm transition border-b border-line/40 last:border-0",
                  active === index ? "bg-brand-50 text-brand-900" : "hover:bg-canvas text-ink",
                )}
              >
                <MapPin aria-hidden className="size-4 shrink-0 text-brand-600 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink leading-tight">{item.name}</p>
                  <p className="truncate text-xs text-ink-muted mt-0.5">{item.formattedAddress}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Popular Area Quick Jump Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-ink-muted">
        <span className="font-medium text-ink">Popular areas:</span>
        {POPULAR_AREAS.map((area) => (
          <button
            key={area.label}
            type="button"
            onClick={() => {
              setCoords({ lat: area.lat, lng: area.lng });
              setZoom(15);
              reverseGeocode(area.lat, area.lng, "search");
            }}
            className="rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-medium text-ink hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 transition"
          >
            {area.label}
          </button>
        ))}
      </div>

      {/* Interactive Map with Exact Pin Placement */}
      <div className="relative overflow-hidden rounded-xl border border-line bg-canvas shadow-inner">
        <InteractiveLocationMap
          center={[coords.lat, coords.lng]}
          zoom={zoom}
          marker={
            exactLocation
              ? {
                  lat: coords.lat,
                  lng: coords.lng,
                  label: exactLocation.locality || exactLocation.city,
                }
              : undefined
          }
          radiusKm={10}
          onMapClick={handleMapClick}
          height={260}
        />

        {resolvingAddress && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand-800 shadow-md backdrop-blur ring-1 ring-line">
            <LoaderCircle aria-hidden className="size-3 animate-spin text-brand-600" />
            Resolving exact address…
          </div>
        )}

        <div className="flex items-center justify-between border-t border-line bg-white px-3 py-1.5 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1 font-medium text-brand-700">
            <Navigation aria-hidden="true" className="size-3" />
            Click anywhere on the map to pinpoint your exact building/street
          </span>
          <span className="font-medium">10 km service radius</span>
        </div>
      </div>

      {/* Exact Address Confirmation Card */}
      {exactLocation && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-emerald-950 text-sm">
                {exactLocation.locality} · {exactLocation.city}
              </p>
              <p className="text-emerald-900/90 leading-relaxed mt-0.5 font-medium">
                {exactLocation.formattedAddress}
              </p>
              <p className="text-emerald-800/80 mt-1">
                📍 Coordinates: <span className="font-mono">{coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E</span>
                {exactLocation.postcode ? ` · PIN: ${exactLocation.postcode}` : ""}
              </p>
            </div>
          </div>

          {/* Optional Flat / House / Landmark field to ensure 100% address accuracy */}
          <div className="pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor={`${id}-flat`} className="font-semibold text-emerald-950 whitespace-nowrap">
              Flat / House No. / Landmark (optional):
            </label>
            <input
              id={`${id}-flat`}
              type="text"
              placeholder="e.g. Flat 304, Tower B, Green Valley"
              value={flatOrHouse}
              onChange={(e) => setFlatOrHouse(e.target.value)}
              className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs text-ink shadow-sm placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>
      )}

      {geoNotice && (
        <p role="status" className="text-xs font-semibold text-brand-800 flex items-center gap-1.5">
          <Sparkles aria-hidden className="size-3.5 text-brand-600" />
          {geoNotice}
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
