// The user's chosen search / visit location, carried between pages in the URL.

export type ChosenLocation = { label: string; latitude: number; longitude: number };

export function locationToParams(location: ChosenLocation, params = new URLSearchParams()): URLSearchParams {
  params.set("lat", String(location.latitude));
  params.set("lng", String(location.longitude));
  params.set("label", location.label);
  return params;
}

export function locationFromParams(params: Record<string, string | undefined>): ChosenLocation | null {
  const latitude = Number(params.lat);
  const longitude = Number(params.lng);
  if (!params.lat || !params.lng || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { label: params.label?.slice(0, 120) || "Selected location", latitude, longitude };
}

/** Flattens Next.js searchParams (string | string[] | undefined) to single strings. */
export function flattenParams(raw: Record<string, string | string[] | undefined>): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
}

/** Builds a query string from defined values only. */
export function toQuery(values: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
