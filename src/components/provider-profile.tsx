import { BadgeCheck, CalendarDays, Clock, Info, Languages, MapPin, ShieldQuestion, Star } from "lucide-react";
import Link from "next/link";
import { CategoryIcon, KIND_TILE, KindBadge, VerificationBadge } from "@/components/category-meta";
import { MapPanel } from "@/components/map-panel";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/card";
import { categoryKind, categoryName } from "@/lib/categories";
import { cn } from "@/lib/cn";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatMoney,
  formatTime,
  groupByDay,
  initials,
  maskReference,
} from "@/lib/formatters";
import type { ChosenLocation } from "@/lib/location";
import type { AvailabilitySlot, PlatformConfig, ProviderProfile, Review, Service } from "@/types";

const KIND_NOTICE = {
  medical: {
    className: "border-sky-200 bg-sky-50 text-sky-950",
    text: "Medical service by a registered professional. Home visits are for non-emergency needs only and follow your doctor's written advice where applicable.",
  },
  childcare: {
    className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-950",
    text: "Childcare service — this provider is not a medical professional and cannot give medicines or medical care.",
  },
  non_medical: {
    className: "border-violet-200 bg-violet-50 text-violet-950",
    text: "Non-medical personal care — companionship, mobility and daily-living support. This provider cannot give medicines or medical treatment.",
  },
} as const;

type Props = {
  provider: ProviderProfile;
  services: Service[];
  slots: AvailabilitySlot[];
  reviews: Review[];
  config: PlatformConfig;
  location: ChosenLocation | null;
  distanceKm: number | null;
  bookingHref: (extra?: { serviceId?: string; slotId?: string }) => string;
};

export function ProviderProfileView({ provider, services, slots, reviews, config, location, distanceKm, bookingHref }: Props) {
  const kind = categoryKind(provider.category);
  const bookable = provider.verificationStatus === "verified";
  const outsideArea = distanceKm !== null && distanceKm > provider.serviceRadiusKm;
  const days = groupByDay(slots).slice(0, 7);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className={cn("relative grid size-24 shrink-0 place-items-center rounded-3xl text-3xl font-bold", KIND_TILE[kind])} aria-hidden>
              {initials(provider.name)}
              <span className="absolute -right-2 -bottom-2 grid size-10 place-items-center rounded-full border-4 border-white bg-white">
                <CategoryIcon category={provider.category} className="size-5" />
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{provider.name}</h1>
              <p className="mt-1 font-medium text-ink-muted">
                {categoryName(provider.category)} · {provider.yearsExperience} years experience
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <VerificationBadge status={provider.verificationStatus} />
                <KindBadge category={provider.category} />
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <li className="flex items-center gap-1.5">
                  <Star aria-hidden className="size-4 fill-amber-400 text-amber-500" />
                  <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                  <span className="text-ink-muted">({provider.reviewCount} reviews)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin aria-hidden className="size-4 text-ink-muted" />
                  Based in {provider.baseLocation.locality}, {provider.baseLocation.city}
                  {distanceKm !== null && <span className="text-ink-muted">· {formatDistance(distanceKm)} from you</span>}
                </li>
                <li className="flex items-center gap-1.5">
                  <Languages aria-hidden className="size-4 text-ink-muted" />
                  {provider.languages.join(", ")}
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-5 text-ink">{provider.bio}</p>
          <p className={cn("mt-4 flex gap-2 rounded-lg border p-3 text-sm", KIND_NOTICE[kind].className)}>
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {KIND_NOTICE[kind].text}
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading id="services" title="Services & prices" description="Visit fees shown. Travel, platform fee and any estimated items appear in the full quote before you confirm." />
          <ul className="divide-y divide-line">
            {services.map((service) => (
              <li key={service.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-bold text-ink">{service.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-muted">{service.description}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Clock aria-hidden className="size-3.5" /> {formatDuration(service.durationMinutes)}
                    </span>
                    {service.procedureFeeMinor > 0 && <span>+ procedure fee {formatMoney(service.procedureFeeMinor)}</span>}
                    {service.medicineEstimateMinor > 0 && <span>+ optional medicines ~{formatMoney(service.medicineEstimateMinor)} (estimate)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <p className="text-lg font-extrabold text-ink">{formatMoney(service.basePriceMinor)}</p>
                  {bookable && (
                    <ButtonLink size="sm" variant="secondary" href={bookingHref({ serviceId: service.id })}>
                      Request this
                    </ButtonLink>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <SectionHeading id="credentials" title="Credentials & verification" description={config.licensingNote} />
          <ul className="space-y-3">
            {provider.credentials.map((credential) => (
              <li key={credential.label} className="flex items-start gap-3">
                {credential.verified ? (
                  <BadgeCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                ) : (
                  <ShieldQuestion aria-hidden className="mt-0.5 size-5 shrink-0 text-ink-muted" />
                )}
                <div>
                  <p className="font-semibold text-ink">
                    {credential.label}{" "}
                    <span className="text-xs font-medium text-ink-muted">({credential.verified ? "verified" : "not yet verified"})</span>
                  </p>
                  <p className="text-sm text-ink-muted">
                    {credential.issuer}
                    {credential.reference && <> · Reg. no. {maskReference(credential.reference)}</>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <SectionHeading id="reviews" title="Reviews" description={`${provider.rating.toFixed(1)} average from ${provider.reviewCount} reviews`} />
          {reviews.length === 0 ? (
            <p className="text-sm text-ink-muted">No reviews yet.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{review.authorName}</p>
                    <p className="flex items-center gap-1 text-sm" aria-label={`${review.rating} out of 5 stars`}>
                      <Star aria-hidden className="size-4 fill-amber-400 text-amber-500" /> {review.rating}/5
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-ink">{review.comment}</p>
                  <p className="mt-1 text-xs text-ink-muted">{formatDate(review.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          {bookable ? (
            <>
              <ButtonLink href={bookingHref()} size="lg" className="w-full" data-testid="request-visit">
                Request home visit
              </ButtonLink>
              <p className="mt-2 text-center text-xs text-ink-muted">You&apos;ll see the full price before confirming.</p>
            </>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
              This provider hasn&apos;t completed verification yet, so bookings are not available.
            </p>
          )}
          {outsideArea && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
              Your location is {formatDistance(distanceKm!)} away — outside this provider&apos;s {provider.serviceRadiusKm} km service
              area.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <CalendarDays aria-hidden className="size-4" /> Availability
          </h2>
          {days.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">No open time windows this week.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {days.map((day) => (
                <li key={day.day}>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{day.label}</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {day.items.map((slot) => (
                      <li key={slot.id}>
                        {bookable ? (
                          <Link
                            href={bookingHref({ slotId: slot.id })}
                            className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900 hover:border-emerald-400"
                          >
                            {formatTime(slot.startAt)}
                          </Link>
                        ) : (
                          <span className="inline-flex rounded-md border border-line px-2 py-1 text-xs text-ink-muted">{formatTime(slot.startAt)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-muted">Times are arrival windows (IST).</p>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold">Service area</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Visits within {provider.serviceRadiusKm} km of {provider.baseLocation.locality}. Travel fee {formatMoney(provider.travelFeeMinor)}.
          </p>
          <div className="mt-3">
            <MapPanel
              height={220}
              radius={{ latitude: provider.baseLocation.latitude, longitude: provider.baseLocation.longitude, km: provider.serviceRadiusKm }}
              markers={[
                {
                  id: provider.id,
                  latitude: provider.baseLocation.latitude,
                  longitude: provider.baseLocation.longitude,
                  label: `${provider.name} (approximate base)`,
                  kind: "provider",
                },
                ...(location ? [{ id: "you", latitude: location.latitude, longitude: location.longitude, label: "You", kind: "user" as const }] : []),
              ]}
              caption="Approximate area. Map data © OpenStreetMap contributors."
            />
          </div>
        </Card>

        <Card className="p-5 text-sm">
          <h2 className="font-bold">Cancellation & refunds</h2>
          <p className="mt-1 text-ink-muted">{provider.cancellationPolicy}</p>
          <p className="mt-2 text-ink-muted">{config.refundPolicy}</p>
        </Card>
      </div>
    </div>
  );
}
