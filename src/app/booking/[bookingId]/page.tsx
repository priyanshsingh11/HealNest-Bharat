import { CalendarDays, CircleCheck, MapPin, NotebookText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingActions } from "@/components/booking-actions";
import { BookingStatusTimeline, StatusBadge } from "@/components/booking-status";
import { KindBadge } from "@/components/category-meta";
import { EmergencyBanner } from "@/components/emergency-banner";
import { QuoteBreakdown } from "@/components/quote-breakdown";
import { ReviewForm } from "@/components/reviews/review-form";
import { Stars } from "@/components/reviews/stars";
import { Card } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { isCancellable } from "@/lib/booking-status";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { formatDistance, formatTimeRange } from "@/lib/formatters";
import { bookingMessages } from "@/lib/i18n/messages/booking";
import { domainMessages } from "@/lib/i18n/messages/domain";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { canViewBooking } from "@/lib/services/bookings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(bookingMessages);
  return { title: t.detailPage.title };
}

type PageProps = {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingPage({ params, searchParams }: PageProps) {
  const { bookingId } = await params;
  const created = (await searchParams).created === "1";
  const repo = getRepository();
  const [booking, session, config, locale] = await Promise.all([
    repo.getBooking(bookingId),
    getSession(),
    repo.getPlatformConfig(),
    getLocale(),
  ]);
  const t = bookingMessages[locale].detailPage;
  if (!booking || !canViewBooking(session, booking)) notFound();
  const [provider, review] = await Promise.all([
    repo.getProvider(booking.providerId),
    booking.status === "COMPLETED" ? repo.getReviewForBooking(booking.id) : Promise.resolve(null),
  ]);
  const canReview = session.role === "user" && booking.userId === session.userId && booking.status === "COMPLETED";

  return (
    <>
      <EmergencyBanner emergencyNumber={config.emergencyNumber} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {created && (
          <div role="status" className="mb-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950" data-testid="booking-confirmation">
            <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-bold">{t.requestSent(booking.providerName)}</p>
              <p className="text-sm">{t.requestSentBody}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{booking.serviceName}</h1>
          <span data-testid="booking-status">
            <StatusBadge status={booking.status} />
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{t.bookingId(booking.id)}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
          <div className="min-w-0 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-bold">{t.visitDetails}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-muted">
                {t.withBefore && <span>{t.withBefore}</span>}
                <Link href={`/providers/${booking.providerId}`} className="font-semibold text-brand-700 hover:underline">
                  {booking.providerName}
                </Link>
                {t.withAfter && <span>{t.withAfter}</span>}
                <span aria-hidden>·</span>
                <span>{domainMessages[locale].categories[booking.category].name}</span>
                <KindBadge category={booking.category} />
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div className="flex gap-2">
                  <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                  <div>
                    <dt className="font-semibold">{t.arrivalWindow}</dt>
                    <dd className="text-ink-muted">{formatTimeRange(booking.scheduledStart, booking.scheduledEnd, locale)} IST</dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                  <div>
                    <dt className="font-semibold">{t.visitAddress(booking.address.label)}</dt>
                    <dd className="text-ink-muted">
                      {booking.address.addressText} · {t.fromProvider(formatDistance(booking.distanceKm))}
                    </dd>
                    <dd className="text-xs text-ink-muted">
                      {booking.address.consentToShare ? t.shared : t.notShared}
                    </dd>
                  </div>
                </div>
                {booking.notes && (
                  <div className="flex gap-2 sm:col-span-2">
                    <NotebookText aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                    <div>
                      <dt className="font-semibold">{t.yourNote}</dt>
                      <dd className="text-ink-muted">{booking.notes}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-lg font-bold">{t.status}</h2>
              <BookingStatusTimeline status={booking.status} history={booking.statusHistory} />
              <div className="mt-2 border-t border-line pt-4">
                <BookingActions
                  bookingId={booking.id}
                  status={booking.status}
                  role={session.role}
                  providerName={booking.providerName}
                  cancellable={isCancellable(booking.status)}
                  demoTools={demoToolsEnabled()}
                />
              </div>
            </Card>

            {canReview && (
              <Card className="scroll-mt-24 p-6" id="review">
                {review ? (
                  <>
                    <h2 className="text-lg font-bold">{t.yourReview}</h2>
                    <div className="mt-2 flex items-center gap-2">
                      <Stars value={review.rating} />
                      <span className="text-sm font-semibold">{review.rating}/5</span>
                    </div>
                    {review.comment && <p className="mt-2 text-sm text-ink">{review.comment}</p>}
                    <p className="mt-2 text-xs text-ink-muted">
                      {t.thanksBefore}{" "}
                      <Link href={`/providers/${booking.providerId}#reviews`} className="font-semibold text-brand-700 hover:underline">
                        {t.providerProfile(booking.providerName)}
                      </Link>{" "}
                      {t.thanksAfter}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold">{t.rateVisit}</h2>
                    <p className="mb-4 text-sm text-ink-muted">{t.rateVisitBody(booking.providerName)}</p>
                    <ReviewForm bookingId={booking.id} providerName={booking.providerName} />
                  </>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <h2 className="mb-2 text-base font-bold">{t.priceSnapshot}</h2>
              <QuoteBreakdown quote={booking.quote} variant="snapshot" />
            </Card>
            <Card className="p-5 text-sm">
              <h2 className="font-bold">{t.cancellation}</h2>
              {provider && <p className="mt-1 text-ink-muted">{provider.cancellationPolicy}</p>}
              <p className="mt-2 text-ink-muted">{config.refundPolicy}</p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
