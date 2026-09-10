"use client";

import { Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { MapViewProps } from "@/components/map-view";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <MapPlaceholder text="Loading map…" />,
});

function MapPlaceholder({ text }: { text: string }) {
  return (
    <div className="grid h-80 place-items-center rounded-xl border border-dashed border-line bg-slate-50 text-sm text-ink-muted">{text}</div>
  );
}

/** Lazily mounted map. `collapsible` hides it behind a toggle so the page stays fast on mobile. */
export function MapPanel({ collapsible = false, caption, ...props }: MapViewProps & { collapsible?: boolean; caption?: string }) {
  const [open, setOpen] = useState(!collapsible);

  return (
    <div>
      {collapsible && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
        >
          <MapIcon aria-hidden className="size-4" />
          {open ? "Hide map" : "Show map"}
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
