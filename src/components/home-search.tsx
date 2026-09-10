"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CategorySelector } from "@/components/category-selector";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { locationToParams, type ChosenLocation } from "@/lib/location";
import type { Category, CategoryId } from "@/types";

/** Homepage flow: choose a location, then a category → discovery results. */
export function HomeSearch({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useState<ChosenLocation | null>(null);
  const [error, setError] = useState<string | undefined>();

  function go(category?: CategoryId) {
    if (!location) {
      setError("Choose your area or use your current location first.");
      inputRef.current?.focus();
      return;
    }
    const params = locationToParams(location);
    if (category) params.set("category", category);
    router.push(`/discover?${params.toString()}`);
  }

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
        <LocationPicker
          size="lg"
          value={location}
          inputRef={inputRef}
          errorMessage={error}
          onChange={(next) => {
            setLocation(next);
            if (next) setError(undefined);
          }}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={() => go()} data-testid="find-care">
            Find care nearby <ArrowRight aria-hidden className="size-4" />
          </Button>
          <span className="text-sm text-ink-muted">or pick the kind of help you need below</span>
        </div>
      </div>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-4 text-xl font-bold text-ink">
          What kind of help do you need?
        </h2>
        <CategorySelector categories={categories} onSelect={go} />
      </section>
    </div>
  );
}
