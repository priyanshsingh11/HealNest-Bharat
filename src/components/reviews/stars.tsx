"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMessages } from "@/lib/i18n/client";
import { reviewsMessages } from "@/lib/i18n/messages/reviews";

/** Read-only row of five stars for a 1–5 rating. */
export function Stars({ value, className }: { value: number; className?: string }) {
  const t = useMessages(reviewsMessages);
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={t.starsAria(value)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden
          className={cn("size-4", star <= filled ? "fill-amber-400 text-amber-500" : "fill-line text-line", className)}
        />
      ))}
    </span>
  );
}
