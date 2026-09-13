"use client";

import { BadgeCheck, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Stars } from "@/components/reviews/stars";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/formatters";
import { useLocale } from "@/lib/i18n/client";
import { reviewsMessages } from "@/lib/i18n/messages/reviews";
import { summarizeReviews, type StarCount } from "@/lib/reviews";
import type { Review, ReviewAspect } from "@/types";

const FILTERS = ["all", "5", "4", "low", "verified", "comments"] as const;
type FilterId = (typeof FILTERS)[number];

const SORTS = ["recent", "high", "low"] as const;
type SortId = (typeof SORTS)[number];

function matches(review: Review, filter: FilterId): boolean {
  switch (filter) {
    case "5":
      return review.rating === 5;
    case "4":
      return review.rating === 4;
    case "low":
      return review.rating <= 3;
    case "verified":
      return review.bookingId !== null;
    case "comments":
      return review.comment.trim().length > 0;
    default:
      return true;
  }
}

function compare(sort: SortId) {
  return (a: Review, b: Review) =>
    sort === "high"
      ? b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
      : sort === "low"
        ? a.rating - b.rating || b.createdAt.localeCompare(a.createdAt)
        : b.createdAt.localeCompare(a.createdAt);
}

function Bar({ percent, tone }: { percent: number; tone: "amber" | "brand" }) {
  return (
    <span aria-hidden className="block h-2 flex-1 overflow-hidden rounded-full bg-line">
      <span className={cn("block h-full rounded-full", tone === "amber" ? "bg-amber-400" : "bg-brand-600")} style={{ width: `${percent}%` }} />
    </span>
  );
}

/** Rating summary (score, star distribution, aspect scores) plus a filterable, sortable review list. */
export function ReviewsPanel({ reviews, rating, reviewCount }: { reviews: Review[]; rating: number; reviewCount: number }) {
  const locale = useLocale();
  const t = reviewsMessages[locale];
  const [filter, setFilter] = useState<FilterId>("all");
  const [sort, setSort] = useState<SortId>("recent");
  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);
  const visible = useMemo(() => reviews.filter((r) => matches(r, filter)).sort(compare(sort)), [reviews, filter, sort]);

  if (reviewCount === 0 && reviews.length === 0) {
    return <p className="text-sm text-ink-muted">{t.panel.noRatings}</p>;
  }

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-[12.5rem_1fr]">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
          <p className="text-4xl font-extrabold">
            {rating.toFixed(1)}
            <span className="text-lg font-semibold text-white/80">/5</span>
          </p>
          <p className="font-bold">{t.ratingWord(rating)}</p>
          <p className="text-sm text-white/80">{t.panel.ratings(reviewCount)}</p>
          {summary.recommendPercent !== null && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap text-leaf-200">
              <ThumbsUp aria-hidden className="size-3.5" /> {t.panel.wouldRecommend(summary.recommendPercent)}
            </p>
          )}
        </div>
        <div>
          <ul className="space-y-1.5" aria-label={t.panel.distribution}>
            {([5, 4, 3, 2, 1] as StarCount[]).map((star) => {
              const count = summary.distribution[star];
              return (
                <li key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-12 shrink-0 text-ink-muted">{t.panel.starRow(star)}</span>
                  <Bar percent={summary.count ? (count / summary.count) * 100 : 0} tone="amber" />
                  <span className="w-6 shrink-0 text-right tabular-nums text-ink-muted">{count}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-ink-muted">{t.panel.distributionNote(summary.count)}</p>
        </div>
      </div>

      {summary.aspects.length > 0 && (
        <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {summary.aspects.map(({ aspect, average }) => (
            <div key={aspect}>
              <dt className="flex justify-between text-sm">
                <span>{t.aspects[aspect]}</span>
                <span className="font-semibold">{average.toFixed(1)}</span>
              </dt>
              <dd className="mt-1 flex">
                <Bar percent={(average / 5) * 100} tone="brand" />
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div
          role="group"
          aria-label={t.panel.filterAria}
          className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap",
                filter === f ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink hover:border-brand-300",
              )}
            >
              {t.panel.filters[f]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">{t.panel.sort}</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortId)} className="w-auto">
            {SORTS.map((id) => (
              <option key={id} value={id}>
                {t.panel.sorts[id]}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">{t.panel.noMatch}</p>
      ) : (
        <ul className="mt-4 space-y-4" aria-live="polite">
          {visible.map((review) => (
            <li key={review.id} className="rounded-xl border border-line bg-canvas p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{review.authorName}</p>
                  {review.bookingId && (
                    <Badge tone="success">
                      <BadgeCheck aria-hidden className="size-3.5" /> {t.panel.verifiedVisit}
                    </Badge>
                  )}
                </div>
                <Stars value={review.rating} />
              </div>
              {review.comment && <p className="mt-2 text-sm text-ink">{review.comment}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                {(Object.entries(review.aspects) as [ReviewAspect, number][]).map(([aspect, score]) => (
                  <span key={aspect}>
                    {t.aspects[aspect]} <span className="font-semibold text-ink">{score}/5</span>
                  </span>
                ))}
                {review.wouldRecommend && (
                  <span className="flex items-center gap-1 font-semibold text-emerald-800">
                    <ThumbsUp aria-hidden className="size-3" /> {t.panel.recommends}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted">{formatDate(review.createdAt, locale)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
