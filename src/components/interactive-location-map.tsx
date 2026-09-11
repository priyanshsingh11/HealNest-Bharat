"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

export type InteractiveLocationMapProps = {
  center: [number, number];
  zoom?: number;
  marker?: { lat: number; lng: number; label: string };
  radiusKm?: number;
  onMapClick: (lat: number, lng: number) => void;
  height?: number;
};

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? Math.max(map.getZoom(), 13));
  }, [map, center, zoom]);
  return null;
}

export default function InteractiveLocationMap({
  center,
  zoom = 13,
  marker,
  radiusKm = 10,
  onMapClick,
  height = 260,
}: InteractiveLocationMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height, width: "100%" }}
      className="rounded-xl overflow-hidden z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      <RecenterMap center={center} zoom={zoom} />

      {marker && radiusKm > 0 && (
        <Circle
          center={[marker.lat, marker.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#0d52b8",
            fillColor: "#3b82f6",
            fillOpacity: 0.12,
            weight: 1.5,
          }}
        />
      )}

      {marker && (
        <CircleMarker
          center={[marker.lat, marker.lng]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#0d52b8",
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {marker.label}
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
