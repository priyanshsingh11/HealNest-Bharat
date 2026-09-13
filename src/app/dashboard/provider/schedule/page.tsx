import type { Metadata } from "next";
import { SlotBuilder, SlotList, type DayOption } from "@/components/dashboard/provider-controls";
import { ProviderDashboardHeader, ProviderGate } from "@/components/dashboard/provider-header";
import { istDayKey } from "@/components/dashboard/week-calendar";
import { Card, SectionHeading } from "@/components/ui/card";
import { APP_TIME_ZONE, formatDate, formatMoney } from "@/lib/formatters";
import { providerDashboardMessages } from "@/lib/i18n/messages/provider-dashboard";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { getProviderDashboard } from "@/lib/provider-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(providerDashboardMessages);
  return { title: t.schedule.title };
}

const DAY_MS = 24 * 3600 * 1000;
const SCHEDULE_DAYS = 14;
const weekday = new Intl.DateTimeFormat("en-IN", { timeZone: APP_TIME_ZONE, weekday: "short" });

export default async function ProviderSchedulePage() {
  const { session, repo, provider } = await getProviderDashboard();
  if (!provider) return <ProviderGate missing={session.role === "provider"} />;

  const locale = await getLocale();
  const t = providerDashboardMessages[locale].schedule;
  const now = new Date();
  const [slots, services] = await Promise.all([
    repo.listSlots({ providerId: provider.id, from: now.toISOString() }),
    repo.listServices({ providerId: provider.id }),
  ]);
  const horizon = now.getTime() + SCHEDULE_DAYS * DAY_MS;
  const upcoming = slots.filter((s) => Date.parse(s.startAt) < horizon);
  const dayOptions: DayOption[] = Array.from({ length: SCHEDULE_DAYS }, (_, i) => {
    const date = new Date(now.getTime() + i * DAY_MS);
    return { value: istDayKey(date.toISOString()), label: formatDate(date.toISOString(), locale), weekend: ["Sat", "Sun"].includes(weekday.format(date)) };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProviderDashboardHeader provider={provider} eyebrow={t.title} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <SectionHeading
              title={t.addTitle}
              description={t.addDescription}
            />
            <SlotBuilder providerId={provider.id} dayOptions={dayOptions} />
          </Card>

          <Card className="p-6">
            <SectionHeading
              title={t.slotsTitle(SCHEDULE_DAYS)}
              description={t.slotsDescription}
            />
            <SlotList slots={upcoming} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold">{t.yourServices}</h2>
            <p className="mt-1 text-xs text-ink-muted">
              {t.pricesNote(formatMoney(provider.travelFeeMinor))}
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
