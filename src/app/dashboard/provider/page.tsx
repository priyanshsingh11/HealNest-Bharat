import { CalendarDays, ClipboardList, IndianRupee, MapPin, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/booking-status";
import { KindBadge, VerificationBadge } from "@/components/category-meta";
import { AvailabilityManager, RadiusEditor, RequestActions } from "@/components/dashboard/provider-controls";
import { SwitchRole } from "@/components/dashboard/switch-role";
import { MapPanel } from "@/components/map-panel";
import { Card, SectionHeading } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { categoryName } from "@/lib/categories";
import { getRepository } from "@/lib/db";
import { formatDate, formatMoney, formatTimeRange } from "@/lib/formatters";
import type { Booking } from "@/types";

export const metadata: Metadata = { title: "Provider dashboard" };

const ACTIVE = new Set(["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"]);

function PayoutLine({ booking }: { booking: Booking }) {
  const { quote } = booking;
  return (
    <p className="text-xs text-ink-muted">
      Customer pays {formatMoney(quote.totalMinor)} · <span className="font-semibold text-emerald-800">your payout {formatMoney(quote.providerPayoutMinor)}</span> ·
      platform fee & margin {formatMoney(quote.platformEarningsMinor)}
      {quote.taxMinor > 0 && ` · tax ${formatMoney(quote.taxMinor)}`}
      {quote.hasEstimates && " · includes estimates"}
    </p>
  );
}

function BookingRow({ booking, actions = true }: { booking: Booking; actions?: boolean }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/booking/${booking.id}`} className="font-bold text-ink hover:underline">
            {booking.serviceName}
          </Link>
          <StatusBadge status={booking.status} />
        </div>
        <p className="text-sm text-ink-muted">{formatTimeRange(booking.scheduledStart, booking.scheduledEnd)} IST</p>
        <p className="text-sm text-ink-muted">
          {booking.address.addressText} · {booking.distanceKm} km
        </p>
        {booking.notes && <p className="text-sm text-ink">“{booking.notes}”</p>}
        <PayoutLine booking={booking} />
      </div>
      {actions && <RequestActions bookingId={booking.id} status={booking.status} />}
    </li>
  );
}

export default async function ProviderDashboardPage() {
  const session = await getSession();
  const repo = getRepository();
  const providers = await repo.listProviders();
  const pickerOptions = providers.map((p) => ({ id: p.id, name: p.name, category: categoryName(p.category) }));

  if (session.role !== "provider" || !session.providerId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-extrabold">Provider dashboard</h1>
        <p className="mt-2 text-ink-muted">
          This is a demo with mock login. Choose a provider profile to see their incoming requests, availability and payouts.
        </p>
        <Card className="mt-6 p-6">
          <SwitchRole role="provider" providers={pickerOptions} label="Open provider dashboard" />
        </Card>
      </div>
    );
  }

  const provider = await repo.getProvider(session.providerId);
  if (!provider) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p>Provider profile not found.</p>
        <SwitchRole role="provider" providers={pickerOptions} label="Choose another provider" />
      </div>
    );
  }

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const [bookings, slots, services] = await Promise.all([
    repo.listBookings({ providerId: provider.id }),
    repo.listSlots({ providerId: provider.id, from: now.toISOString() }),
    repo.listServices({ providerId: provider.id }),
  ]);
  const upcomingSlots = slots.filter((s) => Date.parse(s.startAt) < weekAhead.getTime() + 24 * 3600 * 1000);
  const requested = bookings.filter((b) => b.status === "REQUESTED");
  const active = bookings.filter((b) => ACTIVE.has(b.status));
  const past = bookings.filter((b) => ["COMPLETED", "DECLINED", "CANCELLED"].includes(b.status));
  const earning = bookings.filter((b) => b.status === "COMPLETED" || ACTIVE.has(b.status));
  const expectedPayout = earning.reduce((sum, b) => sum + b.quote.providerPayoutMinor, 0);
  const platformShare = earning.reduce((sum, b) => sum + b.quote.platformEarningsMinor, 0);

  const dayOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() + i * 24 * 3600 * 1000);
    const value = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
    return { value, label: formatDate(d.toISOString()) };
  });

  const stats = [
    { label: "New requests", value: String(requested.length), icon: ClipboardList },
    { label: "Active visits", value: String(active.length), icon: CalendarDays },
    { label: "Expected payout", value: formatMoney(expectedPayout), icon: Wallet },
    { label: "Platform fee & margin", value: formatMoney(platformShare), icon: IndianRupee },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Provider dashboard</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{provider.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <VerificationBadge status={provider.verificationStatus} />
            <KindBadge category={provider.category} />
          </div>
        </div>
        <SwitchRole role="provider" providers={pickerOptions} currentProviderId={provider.id} label="Switch" />
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <li key={label} className="rounded-2xl border border-line bg-white p-4">
            <Icon aria-hidden className="size-5 text-brand-700" />
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
            <p className="text-sm text-ink-muted">{label}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">Payout and platform share cover active and completed visits, from each booking&apos;s price snapshot.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <SectionHeading title={`Incoming requests (${requested.length})`} description="Accept or decline. Customers are notified immediately." />
            {requested.length === 0 ? (
              <p className="text-sm text-ink-muted">No new requests.</p>
            ) : (
              <ul className="space-y-3">{requested.map((b) => <BookingRow key={b.id} booking={b} />)}</ul>
            )}
          </Card>

          <Card className="p-6">
            <SectionHeading title={`Active visits (${active.length})`} />
            {active.length === 0 ? (
              <p className="text-sm text-ink-muted">No active visits.</p>
            ) : (
              <ul className="space-y-3">{active.map((b) => <BookingRow key={b.id} booking={b} />)}</ul>
            )}
          </Card>

          <Card className="p-6">
            <SectionHeading title="Availability — next 7 days" description="Click a slot to open or block it. Booked slots are managed through their booking." />
            <AvailabilityManager providerId={provider.id} slots={upcomingSlots} dayOptions={dayOptions} />
          </Card>

          {past.length > 0 && (
            <Card className="p-6">
              <SectionHeading title="Past & closed" />
              <ul className="space-y-3">{past.map((b) => <BookingRow key={b.id} booking={b} actions={false} />)}</ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <MapPin aria-hidden className="size-4" /> Service area
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Based in {provider.baseLocation.locality}, {provider.baseLocation.city}. You receive requests within this radius.
            </p>
            <div className="mt-3">
              <MapPanel
                height={220}
                radius={{ latitude: provider.baseLocation.latitude, longitude: provider.baseLocation.longitude, km: provider.serviceRadiusKm }}
                markers={[{ id: provider.id, latitude: provider.baseLocation.latitude, longitude: provider.baseLocation.longitude, label: "Your base", kind: "provider" }]}
              />
            </div>
            <div className="mt-4">
              <RadiusEditor providerId={provider.id} radiusKm={provider.serviceRadiusKm} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-bold">Your services</h2>
            <p className="mt-1 text-xs text-ink-muted">Prices are set with HealNest Bharat admin. Travel fee {formatMoney(provider.travelFeeMinor)}.</p>
            <ul className="mt-3 divide-y divide-line text-sm">
              {services.map((s) => (
                <li key={s.id} className="flex justify-between gap-3 py-2">
                  <span className={s.active ? "" : "text-ink-muted line-through"}>{s.name}</span>
                  <span className="font-semibold">{formatMoney(s.basePriceMinor)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
