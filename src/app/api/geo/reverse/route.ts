import { NextResponse } from "next/server";
import { nearestLocality, LOCALITIES } from "@/lib/localities";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    if (!latStr || !lngStr) {
      return NextResponse.json({ ok: false, error: "Missing lat or lng" }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ ok: false, error: "Invalid coordinates" }, { status: 400 });
    }

    let nearest = null;
    try {
      nearest = nearestLocality(lat, lng);
    } catch {
      nearest = LOCALITIES[0];
    }
    const nearestLocalityId = nearest?.id || "del-saket";

    // 1. Try Nominatim (OpenStreetMap)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "HealNestBharatApp/1.0 (contact@healnest.in)",
            Accept: "application/json",
          },
        }
      );

      if (res.ok) {
        const text = await res.text();
        let data: Record<string, any> = {};
        try {
          data = JSON.parse(text);
        } catch {
          // ignore
        }

        if (data && data.address) {
          const addr = data.address;
          const locality =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.road ||
            addr.commercial ||
            addr.village ||
            addr.hamlet ||
            addr.city_district ||
            addr.city ||
            nearest?.name ||
            "Local Area";

          const city =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.city_district ||
            addr.state_district ||
            nearest?.city ||
            "India";

          const state = addr.state || nearest?.state || "";
          const postcode = addr.postcode || "";
          const formattedAddress = data.display_name || `${locality}, ${city}, ${state}`;

          return NextResponse.json({
            ok: true,
            latitude: lat,
            longitude: lng,
            formattedAddress,
            shortAddress: `${locality}, ${city}`,
            locality,
            city,
            state,
            postcode,
            nearestLocalityId,
          });
        }
      }
    } catch {
      // Nominatim failed, try fallback
    }

    // 2. Try BigDataCloud
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const locality = data.locality || data.principalSubdivision || nearest?.name || "Local Area";
        const city = data.city || data.principalSubdivision || nearest?.city || "India";
        const state = data.principalSubdivision || nearest?.state || "";
        const formattedAddress = `${locality}, ${city}, ${state}, India`.replace(/^,\s*/, "");

        return NextResponse.json({
          ok: true,
          latitude: lat,
          longitude: lng,
          formattedAddress,
          shortAddress: `${locality}, ${city}`,
          locality,
          city,
          state,
          postcode: data.postcode || "",
          nearestLocalityId,
        });
      }
    } catch {
      // BigDataCloud failed
    }

    // 3. Fallback to nearest pre-registered locality
    return NextResponse.json({
      ok: true,
      latitude: lat,
      longitude: lng,
      formattedAddress: `${nearest?.name || "Saket"}, ${nearest?.city || "New Delhi"}, ${nearest?.state || "Delhi"}, India`,
      shortAddress: `${nearest?.name || "Saket"}, ${nearest?.city || "New Delhi"}`,
      locality: nearest?.name || "Saket",
      city: nearest?.city || "New Delhi",
      state: nearest?.state || "Delhi",
      postcode: "",
      nearestLocalityId,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 });
  }
}
