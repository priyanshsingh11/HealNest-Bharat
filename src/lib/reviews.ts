import { REVIEW_ASPECTS, type Review, type ReviewAspect } from "@/types";

export const ASPECT_LABELS: Record<ReviewAspect, string> = {
  punctuality: "Punctuality",
  communication: "Explains clearly",
  courtesy: "Care & courtesy",
  value: "Value for money",
};

/** Word shown next to an average score, e.g. 4.8 → "Excellent". */
export function ratingWord(rating: number): string {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 4) return "Very good";
  if (rating >= 3.5) return "Good";
  if (rating >= 3) return "Average";
  return "Below average";
}

export type StarCount = 1 | 2 | 3 | 4 | 5;

export type ReviewSummary = {
  count: number;
  distribution: Record<StarCount, number>;
  aspects: { aspect: ReviewAspect; average: number; count: number }[];
  /** Share of reviewers who answered "would recommend" with yes, or null if nobody answered. */
  recommendPercent: number | null;
};

export function summarizeReviews(reviews: Review[]): ReviewSummary {
  const distribution: Record<StarCount, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const stars = Math.min(5, Math.max(1, Math.round(review.rating))) as StarCount;
    distribution[stars] += 1;
  }

  const aspects = REVIEW_ASPECTS.flatMap((aspect) => {
    const scores = reviews.map((r) => r.aspects[aspect]).filter((s): s is number => typeof s === "number");
    if (!scores.length) return [];
    const average = Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
    return [{ aspect, average, count: scores.length }];
  });

  const answered = reviews.filter((r) => r.wouldRecommend !== null);
  const recommendPercent = answered.length
    ? Math.round((answered.filter((r) => r.wouldRecommend).length / answered.length) * 100)
    : null;

  return { count: reviews.length, distribution, aspects, recommendPercent };
}

/** "Aarav Sharma" → "Aarav S." so reviewers' full names are not shown publicly. */
export function publicReviewerName(name: string | undefined | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "HealNest customer";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** New average after adding one rating, rounded to one decimal like the stored value. */
export function addToAverage(average: number, count: number, rating: number): number {
  return Math.round(((average * count + rating) / (count + 1)) * 10) / 10;
}
