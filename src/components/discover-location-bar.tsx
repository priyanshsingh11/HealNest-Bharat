"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocationPicker } from "@/components/location-picker";
import { locationToParams, type ChosenLocation } from "@/lib/location";

/** Lets the user change location on the discovery page while keeping the chosen category. */
export function DiscoverLocationBar({ location, category }: { location: ChosenLocation | null; category?: string }) {
  const router = useRouter();
  const [value, setValue] = useState<ChosenLocation | null>(location);

  return (
    <LocationPicker
      label={location ? "Change location" : "Where do you need care?"}
      value={value}
      onChange={(next) => {
        setValue(next);
        if (!next) return;
        const params = locationToParams(next);
        if (category) params.set("category", category);
        router.push(`/discover?${params.toString()}`);
      }}
    />
  );
}
