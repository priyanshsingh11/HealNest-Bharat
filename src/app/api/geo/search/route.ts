import { NextResponse } from "next/server";
import { searchLocalities } from "@/lib/localities";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const query = q.trim();

  // 1. Fetch exact addresses and landmarks from Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=in&limit=8&addressdetails=1`,
      {
        headers: {
          "User-Agent": "HealNestBharat/1.0 (healthcare-service@healnest.in)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(4500),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const results = data.map((item) => {
          const addr = item.address || {};
          const locality =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.road ||
            addr.commercial ||
            addr.village ||
            item.name ||
            "Area";

          const city =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.city_district ||
            addr.state_district ||
            "India";

          return {
            id: `osm-${item.place_id}`,
            latitude: Number(item.lat),
            longitude: Number(item.lon),
            name: item.name || locality,
            locality,
            city,
            state: addr.state || "",
            postcode: addr.postcode || "",
            formattedAddress: item.display_name,
            source: "exact",
          };
        });
        return NextResponse.json({ results });
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Fallback to local locality index
  const localMatches = searchLocalities(query, 6).map((loc) => ({
    id: loc.id,
    latitude: loc.latitude,
    longitude: loc.longitude,
    name: loc.name,
    locality: loc.name,
    city: loc.city,
    state: loc.state,
    postcode: "",
    formattedAddress: `${loc.name}, ${loc.city}, ${loc.state}, India`,
    source: "local",
  }));

  return NextResponse.json({ results: localMatches });
}
