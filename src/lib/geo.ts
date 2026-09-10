import type { GeoPoint } from "@/types";

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two points using the Haversine formula. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rounded to one decimal place for display and storage. */
export function roundedDistanceKm(a: GeoPoint, b: GeoPoint): number {
  return Math.round(haversineKm(a, b) * 10) / 10;
}

export function isWithinRadius(from: GeoPoint, to: GeoPoint, radiusKm: number): boolean {
  return haversineKm(from, to) <= radiusKm;
}

export function isValidPoint(point: Partial<GeoPoint> | null | undefined): point is GeoPoint {
  if (!point) return false;
  const { latitude, longitude } = point;
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
