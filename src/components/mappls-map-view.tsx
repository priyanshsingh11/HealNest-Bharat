"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MapViewProps } from "@/components/map-view";

type LatLng = { lat: number; lng: number };
type MapplsLayer = object;
type MapplsMap = {
  addListener(event: "load", handler: () => void): void;
  setCenter(center: LatLng): void;
  setZoom(zoom: number): void;
  fitBounds(bounds: [[number, number], [number, number]], options?: { padding?: number; maxZoom?: number }): void;
  remove(): void;
};
type MapplsSdk = {
  Map: new (containerId: string, options: Record<string, unknown>) => MapplsMap;
  Marker: new (options: Record<string, unknown>) => MapplsLayer;
  Circle: new (options: Record<string, unknown>) => MapplsLayer;
  remove(options: { map: MapplsMap; layer: MapplsLayer }): void;
};

declare global {
  interface Window {
    mappls?: MapplsSdk;
  }
}

const MAPPLS_KEY = process.env.NEXT_PUBLIC_MAPPLS_KEY;

let sdkPromise: Promise<MapplsSdk> | null = null;

/** Loads the Mappls Web SDK once per page. */
function loadMapplsSdk(): Promise<MapplsSdk> {
  if (window.mappls) return Promise.resolve(window.mappls);
  sdkPromise ??= new Promise<MapplsSdk>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${encodeURIComponent(MAPPLS_KEY ?? "")}`;
    script.async = true;
    script.onload = () => (window.mappls ? resolve(window.mappls) : reject(new Error("Mappls SDK did not initialise")));
    script.onerror = () => reject(new Error("Mappls SDK failed to load"));
    document.head.appendChild(script);
  }).catch((error) => {
    sdkPromise = null;
    throw error;
  });
  return sdkPromise;
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function markerHtml(kind: "user" | "provider") {
  const size = kind === "user" ? 18 : 14;
  const fill = kind === "user" ? "#1266d6" : "#2f7519";
  const border = kind === "user" ? 3 : 2;
  return `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:${border}px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35)"></div>`;
}

/** Mappls (MapmyIndia) map. Same props as the Leaflet MapView so MapPanel can use either. */
export default function MapplsMapView({ markers, radius, height = 320 }: MapViewProps) {
  const containerId = `mappls-${useId().replace(/:/g, "")}`;
  const mapRef = useRef<MapplsMap | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const first = markers[0] ?? (radius && { latitude: radius.latitude, longitude: radius.longitude });
    const center = first ? { lat: first.latitude, lng: first.longitude } : { lat: 20.59, lng: 78.96 };

    loadMapplsSdk()
      .then((mappls) => {
        if (cancelled) return;
        const map = new mappls.Map(containerId, {
          center,
          zoom: 12,
          zoomControl: true,
          scrollWheel: false,
          search: false,
          location: false,
          traffic: false,
        });
        mapRef.current = map;
        map.addListener("load", () => !cancelled && setReady(true));
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // The map is created once; markers and radius are drawn by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  useEffect(() => {
    const map = mapRef.current;
    const mappls = window.mappls;
    if (!ready || !map || !mappls) return;

    const layers: MapplsLayer[] = [];
    if (radius) {
      layers.push(
        new mappls.Circle({
          map,
          center: { lat: radius.latitude, lng: radius.longitude },
          radius: radius.km * 1000,
          strokeColor: "#2f7519",
          strokeWeight: 1.5,
          fillColor: "#6cc02f",
          fillOpacity: 0.12,
        }),
      );
    }
    for (const marker of markers) {
      layers.push(
        new mappls.Marker({
          map,
          position: { lat: marker.latitude, lng: marker.longitude },
          html: markerHtml(marker.kind),
          title: marker.label,
          popupHtml: `<div style="font:13px/1.4 system-ui,sans-serif">${escapeHtml(marker.label)}</div>`,
        }),
      );
    }

    const points: [number, number][] = markers.map((m) => [m.longitude, m.latitude]);
    if (radius) {
      const dLat = radius.km / 111;
      points.push([radius.longitude, radius.latitude + dLat], [radius.longitude, radius.latitude - dLat]);
    }
    if (points.length === 1) {
      map.setCenter({ lat: points[0][1], lng: points[0][0] });
      map.setZoom(13);
    } else if (points.length > 1) {
      const lngs = points.map((p) => p[0]);
      const lats = points.map((p) => p[1]);
      // Mappls ignores fitBounds padding, so widen the box by 15% per side to keep edge markers in view.
      const padLng = (Math.max(...lngs) - Math.min(...lngs)) * 0.15;
      const padLat = (Math.max(...lats) - Math.min(...lats)) * 0.15;
      map.fitBounds(
        [
          [Math.min(...lngs) - padLng, Math.min(...lats) - padLat],
          [Math.max(...lngs) + padLng, Math.max(...lats) + padLat],
        ],
        { padding: 32, maxZoom: 14 },
      );
    }

    return () => layers.forEach((layer) => mappls.remove({ map, layer }));
  }, [ready, markers, radius]);

  if (failed) {
    return (
      <div style={{ height }} className="grid place-items-center rounded-xl border border-dashed border-line bg-canvas text-sm text-ink-muted">
        Map unavailable right now.
      </div>
    );
  }

  return <div id={containerId} style={{ height, width: "100%" }} className="relative z-0 overflow-hidden rounded-xl" />;
}
