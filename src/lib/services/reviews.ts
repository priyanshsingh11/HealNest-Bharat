import { forbidden, notFound, unprocessable } from "@/lib/errors";
import type { CareRepository } from "@/lib/repository/types";
import { addToAverage, publicReviewerName } from "@/lib/reviews";
import { audit } from "@/lib/services/admin";
import type { Session } from "@/lib/session";
import type { ReviewInput } from "@/lib/validations";
import type { Review } from "@/types";

/** A customer reviews their own completed visit, once. The provider's average rating updates straight away. */
export async function submitReview(
  repo: CareRepository,
  session: Session,
  bookingId: string,
  input: ReviewInput,
  now = new Date(),
): Promise<Review> {
  if (session.role !== "user") throw forbidden("Only the customer who booked this visit can review it.");
  const booking = await repo.getBooking(bookingId);
  if (!booking || booking.userId !== session.userId) throw notFound("Booking");
  if (booking.status !== "COMPLETED") throw unprocessable("You can review a visit once it has been completed.");

  const [provider, user] = await Promise.all([repo.getProvider(booking.providerId), repo.getUser(session.userId)]);
  if (!provider) throw notFound("Provider");

  // createReview rejects a second review for the same booking.
  const review = await repo.createReview({
    id: `rev_${booking.id}`,
    bookingId: booking.id,
    userId: session.userId,
    providerId: provider.id,
    authorName: publicReviewerName(user?.name),
    rating: input.rating,
    aspects: input.aspects,
    wouldRecommend: input.wouldRecommend,
    comment: input.comment,
    createdAt: now.toISOString(),
  });

  await repo.updateProvider(provider.id, {
    rating: addToAverage(provider.rating, provider.reviewCount, input.rating),
    reviewCount: provider.reviewCount + 1,
  });
  await audit(repo, session, "review.created", "review", review.id, { bookingId: booking.id, providerId: provider.id, rating: input.rating });
  return review;
}
