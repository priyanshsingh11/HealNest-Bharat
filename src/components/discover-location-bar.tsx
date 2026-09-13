"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocationPicker } from "@/components/location-picker";
import { useMessages } from "@/lib/i18n/client";
import { locationMessages } from "@/lib/i18n/messages/location";
import { locationToParams, type ChosenLocation } from "@/lib/location";

/** Lets the user change location on the discovery page while keeping the chosen category and service. */
export function DiscoverLocationBar({
  location,
  category,
  service,
}: {
  location: ChosenLocation | null;
  category?: string;
  service?: string;
}) {
  const router = useRouter();
  const t = useMessages(locationMessages).picker;
  const [value, setValue] = useState<ChosenLocation | null>(location);

  return (
    <LocationPicker
      label={location ? t.changeLocation : t.label}
      value={value}
      onChange={(next) => {
        setValue(next);
        if (!next) return;
        const params = locationToParams(next);
        if (category) params.set("category", category);
        if (service) params.set("service", service);
        router.push(`/discover?${params.toString()}`);
      }}
    />
  );
}
