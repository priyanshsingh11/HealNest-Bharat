"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";

export type MapMarker = { id: string; latitude: number; longitude: number; label: string; kind: "user" | "provider" };
export type MapViewProps = {
  markers: MapMarker[];
  radius?: { latitude: number; longitude: number; km: number };
  height?: number;
};

function FitBounds({ markers, radius }: Pick<MapViewProps, "markers" | "radius">) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = markers.map((m) => [m.latitude, m.longitude]);
    if (radius) {
      const dLat = radius.km / 111;
      points.push([radius.latitude + dLat, radius.longitude], [radius.latitude - dLat, radius.longitude]);
    }
    if (points.length === 1) map.setView(points[0], 13);
    else if (points.length > 1) map.fitBounds(points, { padding: [32, 32], maxZoom: 14 });
  }, [map, markers, radius]);
  return null;
}

/** Leaflet + OpenStreetMap. All map code lives here so a different provider can be swapped in later. */
export default function MapView({ markers, radius, height = 320 }: MapViewProps) {
  const center: [number, number] = markers[0]
    ? [markers[0].latitude, markers[0].longitude]
    : radius
      ? [radius.latitude, radius.longitude]
      : [20.59, 78.96];

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height, width: "100%" }} className="rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {radius && (
        <Circle
          center={[radius.latitude, radius.longitude]}
          radius={radius.km * 1000}
          pathOptions={{ color: "#2f7519", fillColor: "#6cc02f", fillOpacity: 0.12, weight: 1.5 }}
        />
      )}
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude]}
          radius={marker.kind === "user" ? 9 : 7}
          pathOptions={
            marker.kind === "user"
              ? { color: "#ffffff", weight: 3, fillColor: "#1266d6", fillOpacity: 1 }
              : { color: "#ffffff", weight: 2, fillColor: "#2f7519", fillOpacity: 0.95 }
          }
        >
          <Tooltip>{marker.label}</Tooltip>
        </CircleMarker>
      ))}
      <FitBounds markers={markers} radius={radius} />
    </MapContainer>
  );
}
