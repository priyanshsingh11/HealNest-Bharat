import type { Metadata } from "next";
import { SlotBuilder, SlotList, type DayOption } from "@/components/dashboard/provider-controls";
import { ProviderDashboardHeader, ProviderGate } from "@/components/dashboard/provider-header";
import { istDayKey } from "@/components/dashboard/week-calendar";
import { Card, SectionHeading } from "@/components/ui/card";
import { APP_TIME_ZONE, formatDate, formatMoney } from "@/lib/formatters";
import { getProviderDashboard } from "@/lib/provider-dashboard";

export const metadata: Metadata = { title: "Slots" };

const DAY_MS = 24 * 3600 * 1000;
const SCHEDULE_DAYS = 14;
const weekday = new Intl.DateTimeFormat("en-IN", { timeZone: APP_TIME_ZONE, weekday: "short" });

export default async function ProviderSchedulePage() {
  const { session, repo, provider, pickerOptions } = await getProviderDashboard();
  if (!provider) return <ProviderGate pickerOptions={pickerOptions} missing={session.role === "provider"} />;

  const now = new Date();
  const [slots, services] = await Promise.all([
    repo.listSlots({ providerId: provider.id, from: now.toISOString() }),
    repo.listServices({ providerId: provider.id }),
  ]);
  const horizon = now.getTime() + SCHEDULE_DAYS * DAY_MS;
  const upcoming = slots.filter((s) => Date.parse(s.startAt) < horizon);
  const dayOptions: DayOption[] = Array.from({ length: SCHEDULE_DAYS }, (_, i) => {
    const date = new Date(now.getTime() + i * DAY_MS);
    return { value: istDayKey(date.toISOString()), label: formatDate(date.toISOString()), weekend: ["Sat", "Sun"].includes(weekday.format(date)) };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProviderDashboardHeader provider={provider} pickerOptions={pickerOptions} eyebrow="Slots" />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <SectionHeading
              title="Add availability"
              description="Choose the days and a time window. Customers book one visit per slot. Times are IST."
            />
            <SlotBuilder providerId={provider.id} dayOptions={dayOptions} />
          </Card>

          <Card className="p-6">
            <SectionHeading
              title={`Your slots — next ${SCHEDULE_DAYS} days`}
              description="Click a slot to block or reopen it. Booked slots are managed through their bookings."
            />
            <SlotList slots={upcoming} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold">Your services</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Prices are set with HealNest Bharat admin. Travel fee {formatMoney(provider.travelFeeMinor)}.
            </p>
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
