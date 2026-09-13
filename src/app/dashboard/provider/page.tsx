import { CalendarClock, ClipboardList, MapPin, ShieldCheck, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/booking-status";
import { RadiusEditor, RequestActions } from "@/components/dashboard/provider-controls";
import { ProviderDashboardHeader, ProviderGate } from "@/components/dashboard/provider-header";
import { istDayKey } from "@/components/dashboard/week-calendar";
import { MapPanel } from "@/components/map-panel";
import { Stars } from "@/components/reviews/stars";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeading } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatMoney, formatTime, formatTimeRange } from "@/lib/formatters";
import type { Locale } from "@/lib/i18n/config";
import { providerDashboardMessages } from "@/lib/i18n/messages/provider-dashboard";
import { reviewsMessages } from "@/lib/i18n/messages/reviews";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { getProviderDashboard } from "@/lib/provider-dashboard";
import type { Booking, BookingStatus, VerificationStatus } from "@/types";

type OverviewMessages = (typeof providerDashboardMessages)["en"]["overview"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(providerDashboardMessages);
  return { title: t.overview.title };
}

const ACTIVE = new Set<BookingStatus>(["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"]);
const WAITING = new Set<BookingStatus>(["ACCEPTED", "ON_THE_WAY", "ARRIVED"]);
const CLOSED = new Set<BookingStatus>(["COMPLETED", "DECLINED", "CANCELLED"]);

function PayoutLine({ booking, t }: { booking: Booking; t: OverviewMessages }) {
  const { quote } = booking;
  return (
    <p className="text-xs text-ink-muted">
      {t.customerPays(formatMoney(quote.totalMinor))} · <span className="font-semibold text-emerald-800">{t.yourPayout(formatMoney(quote.providerPayoutMinor))}</span> ·{" "}
      {t.platformFee(formatMoney(quote.platformEarningsMinor))}
      {quote.taxMinor > 0 && t.tax(formatMoney(quote.taxMinor))}
      {quote.hasEstimates && t.includesEstimates}
    </p>
  );
}

function BookingRow({ booking, locale, t, actions = true }: { booking: Booking; locale: Locale; t: OverviewMessages; actions?: boolean }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/booking/${booking.id}`} className="font-bold text-ink hover:underline">
            {booking.serviceName}
          </Link>
          <StatusBadge status={booking.status} />
        </div>
        <p className="text-sm text-ink-muted">{formatTimeRange(booking.scheduledStart, booking.scheduledEnd, locale)} IST</p>
        <p className="text-sm text-ink-muted">
          {booking.address.addressText} · {booking.distanceKm} km
        </p>
        {booking.notes && <p className="text-sm text-ink">“{booking.notes}”</p>}
        <PayoutLine booking={booking} t={t} />
      </div>
      {actions && <RequestActions bookingId={booking.id} status={booking.status} />}
    </li>
  );
}

const QUEUE_TONE = { waiting: "warning", with: "brand", attended: "success" } as const;

function queueState(status: BookingStatus): keyof typeof QUEUE_TONE {
  if (status === "IN_PROGRESS") return "with";
  if (status === "COMPLETED") return "attended";
  return "waiting";
}

function VerificationCallout({ status, underReview, t }: { status: VerificationStatus; underReview: boolean; t: OverviewMessages["callout"] }) {
  const [title, body] = underReview
    ? [t.reviewTitle, t.reviewBody]
    : status === "rejected"
      ? [t.rejectedTitle, t.rejectedBody]
      : [t.startTitle, t.startBody];
  return (
    <Link
      href="/dashboard/provider/verification"
      className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 hover:border-amber-300"
    >
      <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm">{body}</span>
      </span>
    </Link>
  );
}

export default async function ProviderDashboardPage() {
  const { session, repo, provider } = await getProviderDashboard();
  if (!provider) return <ProviderGate missing={session.role === "provider"} />;

  const locale = await getLocale();
  const t = providerDashboardMessages[locale].overview;
  const now = new Date();
  const today = istDayKey(now.toISOString());
  const [bookings, services, applications] = await Promise.all([
    repo.listBookings({ providerId: provider.id }),
    repo.listServices({ providerId: provider.id }),
    repo.listVerificationApplications({ providerId: provider.id, status: "submitted" }),
  ]);

  // Today's queue: confirmed patients in time order, with the ones already seen kept at the bottom of their slot.
  const queue = bookings
    .filter((b) => istDayKey(b.scheduledStart) === today && (ACTIVE.has(b.status) || b.status === "COMPLETED"))
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const inQueue = new Set(queue.map((b) => b.id));
  const waiting = queue.filter((b) => WAITING.has(b.status));
  const withYou = queue.filter((b) => b.status === "IN_PROGRESS");
  const attended = queue.filter((b) => b.status === "COMPLETED");
  const requested = bookings.filter((b) => b.status === "REQUESTED");
  const upcoming = bookings
    .filter((b) => ACTIVE.has(b.status) && !inQueue.has(b.id))
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const past = bookings.filter((b) => CLOSED.has(b.status) && !inQueue.has(b.id));
  const earning = bookings.filter((b) => b.status === "COMPLETED" || ACTIVE.has(b.status));
  const expectedPayout = earning.reduce((sum, b) => sum + b.quote.providerPayoutMinor, 0);
  const platformShare = earning.reduce((sum, b) => sum + b.quote.platformEarningsMinor, 0);
  const patientNames = new Map(
    await Promise.all(
      [...new Set(queue.map((b) => b.userId))].map(async (id) => [id, (await repo.getUser(id))?.name ?? t.patient] as const),
    ),
  );

  const stats = [
    { label: t.stats.newRequests, value: String(requested.length), icon: ClipboardList },
    { label: t.stats.waiting, value: String(waiting.length), icon: Users },
    { label: t.stats.attendedToday, value: String(attended.length), icon: CalendarClock },
    { label: t.stats.expectedPayout, value: formatMoney(expectedPayout), icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProviderDashboardHeader provider={provider} eyebrow={t.title} />

      {provider.verificationStatus !== "verified" && (
        <VerificationCallout status={provider.verificationStatus} underReview={applications.length > 0} t={t.callout} />
      )}

      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <li key={label} className="rounded-2xl border border-line bg-white p-4">
            <Icon aria-hidden className="size-5 text-brand-700" />
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
            <p className="text-sm text-ink-muted">{label}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">
        {t.payoutNote(formatMoney(platformShare))}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <SectionHeading
              title={t.queueTitle}
              description={t.queueDescription}
            />
            {queue.length > 0 && (
              <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
                {[
                  [t.queueState.waiting, waiting.length],
                  [t.queueState.with, withYou.length],
                  [t.queueState.attended, attended.length],
                ].map(([label, count]) => (
                  <div key={label} className="rounded-xl bg-canvas p-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-ink-muted">{label}</dt>
                    <dd className="text-2xl font-extrabold">{count}</dd>
                  </div>
                ))}
              </dl>
            )}
            {queue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-6 text-center text-sm text-ink-muted">
                <Users aria-hidden className="mx-auto mb-2 size-6 text-brand-400" />
                {t.queueEmpty}
              </div>
            ) : (
              <ol className="space-y-3" data-testid="patient-queue">
                {queue.map((booking, index) => {
                  const state = queueState(booking.status);
                  return (
                    <li
                      key={booking.id}
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                        booking.status === "IN_PROGRESS" ? "border-brand-300 bg-brand-50" : "border-line",
                        booking.status === "COMPLETED" && "bg-canvas opacity-75",
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-sm font-extrabold ring-1 ring-line">
                          <span className="sr-only">{t.token}</span>#{index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-ink">
                            {patientNames.get(booking.userId)}{" "}
                            <Link href={`/booking/${booking.id}`} className="font-medium text-ink-muted hover:underline">
                              · {booking.serviceName}
                            </Link>
                          </p>
                          <p className="mt-1 text-sm text-ink-muted">{formatTime(booking.scheduledStart, locale)}</p>
                          {booking.notes && <p className="mt-1 text-sm text-ink">“{booking.notes}”</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <Badge tone={QUEUE_TONE[state]}>{t.queueState[state]}</Badge>
                        {booking.status !== "COMPLETED" && (
                          <RequestActions bookingId={booking.id} status={booking.status} queue />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card className="p-6">
            <SectionHeading
              title={t.requestsTitle(requested.length)}
              description={t.requestsDescription}
            />
            {requested.length === 0 ? (
              <p className="text-sm text-ink-muted">{t.requestsEmpty}</p>
            ) : (
              <ul className="space-y-3">{requested.map((b) => <BookingRow key={b.id} booking={b} locale={locale} t={t} />)}</ul>
            )}
          </Card>

          <Card className="p-6">
            <SectionHeading
              title={t.upcomingTitle(upcoming.length)}
              description={t.upcomingDescription}
            />
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink-muted">{t.upcomingEmpty}</p>
            ) : (
              <ul className="space-y-3">{upcoming.map((b) => <BookingRow key={b.id} booking={b} locale={locale} t={t} />)}</ul>
            )}
          </Card>

          {past.length > 0 && (
            <Card className="p-6">
              <SectionHeading title={t.past} />
              <ul className="space-y-3">{past.map((b) => <BookingRow key={b.id} booking={b} locale={locale} t={t} actions={false} />)}</ul>
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold">{t.yourRating}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-extrabold">{provider.rating.toFixed(1)}</span>
              <Stars value={provider.rating} />
            </div>
            <p className="text-sm text-ink-muted">
              {reviewsMessages[locale].ratingWord(provider.rating)} · {t.ratingsCount(provider.reviewCount)}
            </p>
            <Link href="/dashboard/provider/reviews" className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline">
              {t.readReviews}
            </Link>
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MapPin aria-hidden className="size-4" /> {t.serviceArea}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {t.basedIn(`${provider.baseLocation.locality}, ${provider.baseLocation.city}`)}
            </p>
            <div className="mt-3">
              <MapPanel
                height={220}
                radius={{ latitude: provider.baseLocation.latitude, longitude: provider.baseLocation.longitude, km: provider.serviceRadiusKm }}
                markers={[{ id: provider.id, latitude: provider.baseLocation.latitude, longitude: provider.baseLocation.longitude, label: t.yourBase, kind: "provider" }]}
              />
            </div>
            <div className="mt-4">
              <RadiusEditor providerId={provider.id} radiusKm={provider.serviceRadiusKm} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold">{t.yourServices}</h2>
            <p className="mt-1 text-xs text-ink-muted">
              {t.pricesNote(formatMoney(provider.travelFeeMinor))}
            </p>
            <ul className="mt-3 divide-y divide-line text-sm">
              {services.map((s) => (
                <li key={s.id} className="flex justify-between gap-3 py-2">
                  <span className={s.active ? "" : "text-ink-muted line-through"}>{s.name}</span>
                  <span className="text-right font-semibold">{formatMoney(s.basePriceMinor)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
