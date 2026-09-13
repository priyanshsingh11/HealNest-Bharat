import { BadgeCheck, CalendarDays, Clock, Info, Languages, MapPin, ShieldQuestion, Star } from "lucide-react";
import Link from "next/link";
import { KindBadge, VerificationBadge, VerifiedTick } from "@/components/category-meta";
import { MapPanel } from "@/components/map-panel";
import { ProviderAvatar } from "@/components/provider-avatar";
import { ReviewsPanel } from "@/components/reviews/reviews-panel";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/card";
import { categoryKind } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatDistance, formatDuration, formatMoney, formatTime, groupByDay, maskReference } from "@/lib/formatters";
import { domainMessages } from "@/lib/i18n/messages/domain";
import { providerMessages } from "@/lib/i18n/messages/provider";
import { getLocale } from "@/lib/i18n/server";
import type { ChosenLocation } from "@/lib/location";
import type { AvailabilitySlot, PlatformConfig, ProviderProfile, Review, Service } from "@/types";

/** Notice colours per category kind; the wording is in providerMessages.kindNotice. */
const KIND_NOTICE_CLASS = {
  medical: "border-sky-200 bg-sky-50 text-sky-950",
  childcare: "border-leaf-200 bg-leaf-50 text-leaf-950",
  non_medical: "border-leaf-200 bg-leaf-50 text-leaf-950",
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

export async function ProviderProfileView({ provider, services, slots, reviews, config, location, distanceKm, bookingHref }: Props) {
  const locale = await getLocale();
  const t = providerMessages[locale];
  const kind = categoryKind(provider.category);
  const bookable = provider.verificationStatus === "verified";
  const outsideArea = distanceKm !== null && distanceKm > provider.serviceRadiusKm;
  const days = groupByDay(slots, locale).slice(0, 7);

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_22rem]", bookable && "pb-24 lg:pb-0")}>
      <div className="min-w-0 space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row">
            <ProviderAvatar provider={provider} size="lg" />
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {provider.name}
                {bookable && <VerifiedTick className="size-7" />}
              </h1>
              <p className="mt-1 font-medium text-ink-muted">
                {domainMessages[locale].categories[provider.category].name} · {t.yearsExperience(provider.yearsExperience)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <VerificationBadge status={provider.verificationStatus} />
                <KindBadge category={provider.category} />
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <li className="flex items-center gap-1.5">
                  <Star aria-hidden className="size-4 fill-amber-400 text-amber-500" />
                  <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                  <a href="#reviews" className="text-ink-muted hover:underline">
                    {t.reviewCount(provider.reviewCount)}
                  </a>
                </li>
                <li className="flex items-start gap-1.5">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                  {/* One text run, so the distance wraps with the address instead of becoming its own column. */}
                  <span>
                    {t.basedIn(provider.baseLocation.locality, provider.baseLocation.city)}
                    {distanceKm !== null && <span className="text-ink-muted">{t.fromYou(formatDistance(distanceKm))}</span>}
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Languages aria-hidden className="size-4 text-ink-muted" />
                  {provider.languages.join(", ")}
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-5 text-ink">{provider.bio}</p>
          <p className={cn("mt-4 flex gap-2 rounded-lg border p-3 text-sm", KIND_NOTICE_CLASS[kind])}>
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t.kindNotice[kind]}
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading id="services" title={t.servicesTitle} description={t.servicesDescription} />
          <ul className="divide-y divide-line">
            {services.map((service) => (
              <li key={service.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-bold text-ink">{service.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-muted">{service.description}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Clock aria-hidden className="size-3.5" /> {formatDuration(service.durationMinutes, locale)}
                    </span>
                    {service.procedureFeeMinor > 0 && <span>{t.procedureFee(formatMoney(service.procedureFeeMinor))}</span>}
                    {service.medicineEstimateMinor > 0 && <span>{t.medicines(formatMoney(service.medicineEstimateMinor))}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <p className="text-lg font-extrabold text-ink">{formatMoney(service.basePriceMinor)}</p>
                  {bookable && (
                    <ButtonLink size="sm" variant="secondary" href={bookingHref({ serviceId: service.id })}>
                      {t.requestThis}
                    </ButtonLink>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <SectionHeading id="credentials" title={t.credentialsTitle} description={config.licensingNote} />
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
                    <span className="text-xs font-medium text-ink-muted">({credential.verified ? t.credentialVerified : t.credentialUnverified})</span>
                  </p>
                  <p className="text-sm text-ink-muted">
                    {credential.issuer}
                    {credential.reference && <span className="whitespace-nowrap">{t.regNo(maskReference(credential.reference))}</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">{t.areaTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t.areaText(provider.serviceRadiusKm, provider.baseLocation.locality, formatMoney(provider.travelFeeMinor))}
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
                  label: t.approximateBase(provider.name),
                  kind: "provider",
                },
                ...(location ? [{ id: "you", latitude: location.latitude, longitude: location.longitude, label: t.you, kind: "user" as const }] : []),
              ]}
              caption={t.approximateArea}
            />
          </div>
        </Card>

        <Card className="p-6 text-sm">
          <h2 className="text-lg font-bold text-ink">{t.cancellationTitle}</h2>
          <p className="mt-1 text-ink-muted">{provider.cancellationPolicy}</p>
          <p className="mt-2 text-ink-muted">{config.refundPolicy}</p>
        </Card>

        <Card className="scroll-mt-24 p-6" id="reviews">
          <SectionHeading title={t.reviewsTitle} description={t.reviewsDescription} />
          <ReviewsPanel reviews={reviews} rating={provider.rating} reviewCount={provider.reviewCount} />
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          {bookable ? (
            <>
              <ButtonLink href={bookingHref()} size="lg" className="w-full" data-testid="request-visit">
                {t.requestVisit}
              </ButtonLink>
              <p className="mt-2 text-center text-xs text-ink-muted">{t.fullPriceNote}</p>
            </>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
              {t.notVerified}
            </p>
          )}
          {outsideArea && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
              {t.outsideArea(formatDistance(distanceKm!), provider.serviceRadiusKm)}
            </p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <CalendarDays aria-hidden className="size-4" /> {t.availability}
          </h2>
          {days.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">{t.noWindows}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {days.map((day) => (
                <li key={day.day}>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{day.label}</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {day.items.map((slot) => {
                      const label = (
                        <>
                          {formatTime(slot.startAt, locale)}
                          {slot.capacity > 1 && <span className="font-medium opacity-80">{t.left(slot.capacity - slot.bookedCount)}</span>}
                        </>
                      );
                      return (
                        <li key={slot.id}>
                          {bookable ? (
                            <Link
                              href={bookingHref({ slotId: slot.id })}
                              className="inline-flex min-h-10 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900 hover:border-emerald-400"
                            >
                              {label}
                            </Link>
                          ) : (
                            <span className="inline-flex min-h-10 items-center gap-1 rounded-md border border-line px-3 text-sm text-ink-muted">{label}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-muted">{t.timesIst}</p>
        </Card>
      </div>

      {/* Phone: the sidebar stacks below the reviews, so keep booking reachable in a bottom bar. */}
      {bookable && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgb(13_82_184/0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-2">
            <ButtonLink href={bookingHref()} size="lg" className="flex-1 px-4">
              {t.requestVisit}
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
