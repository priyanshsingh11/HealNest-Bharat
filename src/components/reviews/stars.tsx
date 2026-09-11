import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Read-only row of five stars for a 1–5 rating. */
export function Stars({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
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
