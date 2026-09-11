"use client";

import { Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Hint, Label, Textarea } from "@/components/ui/field";
import { apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { ASPECT_LABELS } from "@/lib/reviews";
import { REVIEW_COMMENT_MAX, reviewSchema } from "@/lib/validations";
import { REVIEW_ASPECTS, type ReviewAspect } from "@/types";

const STAR_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Accessible star picker: a radio group styled as stars. */
function StarInput({
  legend,
  value,
  onChange,
  size = "sm",
}: {
  legend: string;
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "lg";
}) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset>
      <legend className={cn("font-semibold text-ink", size === "lg" ? "text-base" : "text-sm")}>{legend}</legend>
      <div className="mt-1 flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            className="cursor-pointer rounded-md p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600"
            onMouseEnter={() => setHover(star)}
          >
            <input type="radio" name={name} value={star} checked={value === star} onChange={() => onChange(star)} className="sr-only" />
            <Star
              aria-hidden
              className={cn(size === "lg" ? "size-8" : "size-6", star <= shown ? "fill-amber-400 text-amber-500" : "text-line")}
            />
            <span className="sr-only">
              {star} {star === 1 ? "star" : "stars"}
            </span>
          </label>
        ))}
        <span className="ml-2 text-sm text-ink-muted" aria-hidden>
          {STAR_WORDS[shown]}
        </span>
      </div>
    </fieldset>
  );
}

/** Rate a completed visit: overall stars (required), aspect stars, a recommendation and a short comment. */
export function ReviewForm({ bookingId, providerName }: { bookingId: string; providerName: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [aspects, setAspects] = useState<Partial<Record<ReviewAspect, number>>>({});
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = reviewSchema.safeParse({ rating: rating || undefined, aspects, wouldRecommend: recommend, comment });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your review");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest(`/api/bookings/${bookingId}/review`, "POST", parsed.data);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send your review");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" data-testid="review-form" noValidate>
      <StarInput legend={`How was your visit with ${providerName}?`} value={rating} onChange={setRating} size="lg" />

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Rate the details (optional)</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {REVIEW_ASPECTS.map((aspect) => (
            <StarInput
              key={aspect}
              legend={ASPECT_LABELS[aspect]}
              value={aspects[aspect] ?? 0}
              onChange={(value) => setAspects((current) => ({ ...current, [aspect]: value }))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Would you recommend them to family and friends?</legend>
        <div className="mt-2 flex gap-2">
          {[
            { value: true, label: "Yes", icon: ThumbsUp },
            { value: false, label: "No", icon: ThumbsDown },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              aria-pressed={recommend === value}
              onClick={() => setRecommend(recommend === value ? null : value)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
                recommend === value ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white hover:border-brand-300",
              )}
            >
              <Icon aria-hidden className="size-4" /> {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor={`review-${bookingId}`}>Your review (optional)</Label>
        <Textarea
          id={`review-${bookingId}`}
          value={comment}
          maxLength={REVIEW_COMMENT_MAX}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What went well? What could be better?"
          aria-describedby={`review-${bookingId}-hint`}
        />
        <Hint id={`review-${bookingId}-hint`}>
          Shown publicly with your first name. Please leave out medical details. {comment.length}/{REVIEW_COMMENT_MAX}
        </Hint>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting || pending} data-testid="submit-review">
        {submitting || pending ? "Sending…" : "Submit review"}
      </Button>
    </form>
  );
}
