import { BellRing, CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/booking-status";
import { ProviderDashboardHeader, ProviderGate } from "@/components/dashboard/provider-header";
import { CalendarLegend, istDayKey, WeekCalendar, type CalendarDay } from "@/components/dashboard/week-calendar";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatDate, formatSlotLabel } from "@/lib/formatters";
import { flattenParams } from "@/lib/location";
import { getProviderDashboard } from "@/lib/provider-dashboard";
import type { BookingStatus } from "@/types";

export const metadata: Metadata = { title: "Calendar" };

const DAY_MS = 24 * 3600 * 1000;
const MAX_WEEKS_AHEAD = 3;
const CLOSED = new Set<BookingStatus>(["CANCELLED", "DECLINED"]);
const CALENDAR_PATH = "/dashboard/provider/calendar";

function startsIn(iso: string, now: Date): string {
  const minutes = Math.round((Date.parse(iso) - now.getTime()) / 60_000);
  if (minutes <= 0) return "Now";
  if (minutes < 60) return `In ${minutes} min`;
  return formatSlotLabel(iso, now);
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProviderCalendarPage({ searchParams }: PageProps) {
  const { session, repo, provider } = await getProviderDashboard();
  if (!provider) return <ProviderGate missing={session.role === "provider"} />;

  const week = Math.min(MAX_WEEKS_AHEAD, Math.max(0, Math.trunc(Number(flattenParams(await searchParams).week)) || 0));
  const now = new Date();
  const todayKey = istDayKey(now.toISOString());
  const days: CalendarDay[] = Array.from({ length: 7 }, (_, i) => {
    const iso = new Date(now.getTime() + (week * 7 + i) * DAY_MS).toISOString();
    return { key: istDayKey(iso), label: formatDate(iso), isToday: istDayKey(iso) === todayKey };
  });
  const keys = new Set(days.map((d) => d.key));

  const [slots, bookings] = await Promise.all([repo.listSlots({ providerId: provider.id }), repo.listBookings({ providerId: provider.id })]);
  const weekSlots = slots.filter((s) => keys.has(istDayKey(s.startAt)));
  const weekBookings = bookings.filter((b) => !CLOSED.has(b.status) && keys.has(istDayKey(b.scheduledStart)));
  const upNext = bookings
    .filter((b) => !CLOSED.has(b.status) && b.status !== "COMPLETED" && Date.parse(b.scheduledEnd) > now.getTime())
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))
    .slice(0, 6);
  const openPlaces = weekSlots.filter((s) => s.status === "open").reduce((n, s) => n + s.capacity - s.bookedCount, 0);
  const weekHref = (n: number) => (n === 0 ? CALENDAR_PATH : `${CALENDAR_PATH}?week=${n}`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProviderDashboardHeader provider={provider} eyebrow="Calendar" />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Card className="min-w-0 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{week === 0 ? "Next 7 days" : `Week from ${days[0].label}`}</h2>
              <p className="text-sm text-ink-muted">
                {weekBookings.length} {weekBookings.length === 1 ? "appointment" : "appointments"} · {openPlaces} open{" "}
                {openPlaces === 1 ? "place" : "places"}
              </p>
            </div>
            <nav aria-label="Weeks" className="flex flex-wrap gap-2">
              {week > 0 && (
                <>
                  <Link href={weekHref(week - 1)} className={buttonClass({ variant: "secondary", size: "sm" })}>
                    <ChevronLeft aria-hidden className="size-4" /> Previous
                  </Link>
                  <Link href={CALENDAR_PATH} className={buttonClass({ variant: "secondary", size: "sm" })}>
                    Today
                  </Link>
                </>
              )}
              {week < MAX_WEEKS_AHEAD && (
                <Link href={weekHref(week + 1)} className={buttonClass({ variant: "secondary", size: "sm" })}>
                  Next <ChevronRight aria-hidden className="size-4" />
                </Link>
              )}
            </nav>
          </div>
          <p className="mb-2 text-xs text-ink-muted sm:hidden">Swipe sideways to see all 7 days.</p>
          <WeekCalendar days={days} slots={weekSlots} bookings={weekBookings} nowIso={now.toISOString()} />
          <CalendarLegend />
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <BellRing aria-hidden className="size-4" /> Up next
            </h2>
            {upNext.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">No upcoming appointments.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {upNext.map((b) => (
                  <li key={b.id} className="rounded-xl border border-line p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{startsIn(b.scheduledStart, now)}</p>
                    <Link href={`/booking/${b.id}`} className="font-semibold text-ink hover:underline">
                      {b.serviceName}
                    </Link>
                    <div className="mt-1.5">
                      <StatusBadge status={b.status} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <CalendarPlus aria-hidden className="size-4" /> Reminders on your phone
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Add your appointments to Google Calendar, Apple Calendar or Outlook, with a reminder 30 minutes before each one. Download
              again after new bookings.
            </p>
            <a href={`/api/providers/${provider.id}/calendar`} download className={cn(buttonClass({ variant: "secondary" }), "mt-3 w-full")}>
              <CalendarPlus aria-hidden className="size-4" /> Download calendar (.ics)
            </a>
            <p className="mt-2 text-xs text-ink-muted">Patient addresses are left out of the file.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
