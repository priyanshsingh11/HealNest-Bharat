import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking-form";
import { KindBadge, VerificationBadge } from "@/components/category-meta";
import { EmergencyBanner } from "@/components/emergency-banner";
import { ButtonLink } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { categoryName, isCategoryActive } from "@/lib/categories";
import { getRepository } from "@/lib/db";
import { flattenParams, locationFromParams, toQuery } from "@/lib/location";
import { isGuest } from "@/lib/session";

export const metadata: Metadata = { title: "Request a home visit" };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewBookingPage({ searchParams }: PageProps) {
  const raw = flattenParams(await searchParams);
  const location = locationFromParams(raw);
  const repo = getRepository();
  const session = await getSession();

  const provider = raw.providerId ? await repo.getProvider(raw.providerId) : null;
  if (!provider || !provider.active || !(await isCategoryActive(repo, provider.category))) notFound();

  const [services, slots, rules, config] = await Promise.all([
    repo.listServices({ providerId: provider.id }),
    repo.listSlots({ providerId: provider.id, from: new Date().toISOString(), status: "open" }),
    repo.listPricingRules(),
    repo.getPlatformConfig(),
  ]);
  const activeServices = services.filter((s) => s.active);
  const locationQuery = location ? { lat: location.latitude, lng: location.longitude, label: location.label } : {};
  const profileHref = `/providers/${provider.id}${toQuery(locationQuery)}`;

  return (
    <>
      <EmergencyBanner emergencyNumber={config.emergencyNumber} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Link href={profileHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft aria-hidden className="size-4" /> Back to profile
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Request a home visit</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-muted">
          <span className="font-semibold text-ink">{provider.name}</span>
          <span aria-hidden>·</span>
          <span>{categoryName(provider.category)}</span>
          <VerificationBadge status={provider.verificationStatus} />
          <KindBadge category={provider.category} />
        </div>

        {isGuest(session) && (
          <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <Link href={`/login${toQuery({ next: `/booking/new${toQuery(raw)}` })}`} className="font-semibold underline underline-offset-2">
              Log in or create an account
            </Link>{" "}
            to send a booking request.
          </p>
        )}

        {session.role !== "user" && (
          <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            You&apos;re viewing as {session.role}. Switch to <strong>Customer</strong> in the header to send a booking request.
          </p>
        )}

        <div className="mt-6">
          {provider.verificationStatus !== "verified" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
              <h2 className="font-bold">This provider can&apos;t accept bookings yet</h2>
              <p className="mt-1 text-sm">Their verification is not complete. Please choose a verified provider.</p>
              <ButtonLink href={`/discover${toQuery({ ...locationQuery, category: provider.category, verifiedOnly: "1" })}`} className="mt-4">
                See verified providers
              </ButtonLink>
            </div>
          ) : activeServices.length === 0 ? (
            <p className="text-ink-muted">This provider has no services available right now.</p>
          ) : (
            <BookingForm
              provider={provider}
              services={activeServices}
              slots={slots}
              rules={rules}
              config={config}
              initialServiceId={raw.serviceId}
              initialSlotId={raw.slotId}
              initialLocation={location}
            />
          )}
        </div>
      </div>
    </>
  );
}
