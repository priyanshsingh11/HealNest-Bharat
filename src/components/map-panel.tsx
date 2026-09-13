"use client";

import { Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { MapViewProps } from "@/components/map-view";
import { useMessages } from "@/lib/i18n/client";
import { locationMessages } from "@/lib/i18n/messages/location";

// Mappls when a key is configured; otherwise Leaflet + OpenStreetMap (also used in keyless CI).
const MapView = dynamic(() => (process.env.NEXT_PUBLIC_MAPPLS_KEY ? import("@/components/mappls-map-view") : import("@/components/map-view")), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

function MapPlaceholder() {
  const t = useMessages(locationMessages).map;
  return (
    <div className="grid h-80 place-items-center rounded-xl border border-dashed border-line bg-canvas text-sm text-ink-muted">{t.loading}</div>
  );
}

/** Lazily mounted map. `collapsible` hides it behind a toggle so the page stays fast on mobile. */
export function MapPanel({ collapsible = false, caption, ...props }: MapViewProps & { collapsible?: boolean; caption?: string }) {
  const [open, setOpen] = useState(!collapsible);
  const t = useMessages(locationMessages).map;

  return (
    <div>
      {collapsible && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-50"
        >
          <MapIcon aria-hidden className="size-4" />
          {open ? t.hide : t.show}
        </button>
      )}
      {open && (
        <figure className={collapsible ? "mt-3" : ""}>
          <MapView {...props} />
          {caption && <figcaption className="mt-2 text-xs text-ink-muted">{caption}</figcaption>}
        </figure>
      )}
    </div>
  );
}
