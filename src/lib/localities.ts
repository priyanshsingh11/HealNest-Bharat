// Offline locality lookup used instead of a paid geocoding API in the MVP.
// Replace `searchLocalities` with a real geocoder later; keep the return shape.

export type Locality = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
};

export const LOCALITIES: Locality[] = [
  { id: "del-cp", name: "Connaught Place", city: "New Delhi", latitude: 28.6315, longitude: 77.2167 },
  { id: "del-saket", name: "Saket", city: "New Delhi", latitude: 28.5245, longitude: 77.2066 },
  { id: "del-lajpat", name: "Lajpat Nagar", city: "New Delhi", latitude: 28.5677, longitude: 77.2433 },
  { id: "del-dwarka", name: "Dwarka Sector 10", city: "New Delhi", latitude: 28.5823, longitude: 77.05 },
  { id: "del-rohini", name: "Rohini", city: "New Delhi", latitude: 28.7383, longitude: 77.0822 },
  { id: "ncr-noida18", name: "Noida Sector 18", city: "Noida", latitude: 28.5708, longitude: 77.3261 },
  { id: "ncr-dlf3", name: "DLF Phase 3", city: "Gurugram", latitude: 28.4906, longitude: 77.0936 },
  { id: "mum-andheri", name: "Andheri West", city: "Mumbai", latitude: 19.1364, longitude: 72.8296 },
  { id: "mum-bandra", name: "Bandra West", city: "Mumbai", latitude: 19.0596, longitude: 72.8295 },
  { id: "mum-powai", name: "Powai", city: "Mumbai", latitude: 19.1176, longitude: 72.906 },
  { id: "mum-dadar", name: "Dadar", city: "Mumbai", latitude: 19.0178, longitude: 72.8478 },
  { id: "mum-thane", name: "Thane West", city: "Thane", latitude: 19.1972, longitude: 72.9722 },
  { id: "blr-koramangala", name: "Koramangala", city: "Bengaluru", latitude: 12.9352, longitude: 77.6245 },
  { id: "blr-indiranagar", name: "Indiranagar", city: "Bengaluru", latitude: 12.9719, longitude: 77.6412 },
  { id: "blr-whitefield", name: "Whitefield", city: "Bengaluru", latitude: 12.9698, longitude: 77.75 },
  { id: "blr-jayanagar", name: "Jayanagar", city: "Bengaluru", latitude: 12.9308, longitude: 77.5838 },
  { id: "blr-hsr", name: "HSR Layout", city: "Bengaluru", latitude: 12.9121, longitude: 77.6446 },
  { id: "blr-malleshwaram", name: "Malleshwaram", city: "Bengaluru", latitude: 13.0031, longitude: 77.5643 },
];

export function localityLabel(locality: Locality): string {
  return `${locality.name}, ${locality.city}`;
}

export function searchLocalities(query: string, limit = 6): Locality[] {
  const q = query.trim().toLowerCase();
  if (!q) return LOCALITIES.slice(0, limit);
  return LOCALITIES.filter((locality) => localityLabel(locality).toLowerCase().includes(q)).slice(0, limit);
}

export function findLocality(id: string): Locality | undefined {
  return LOCALITIES.find((locality) => locality.id === id);
}
