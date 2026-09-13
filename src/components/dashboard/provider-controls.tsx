"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { nextHappyStatus } from "@/lib/booking-status";
import { apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { formatDuration, formatTime, groupByDay } from "@/lib/formatters";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { domainMessages } from "@/lib/i18n/messages/domain";
import { providerDashboardMessages } from "@/lib/i18n/messages/provider-dashboard";
import type { AvailabilitySlot, BookingStatus } from "@/types";

function useMutation() {
  const router = useRouter();
  const { controls: t } = useMessages(providerDashboardMessages);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  async function mutate(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      startTransition(() => router.refresh());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.somethingWrong);
      return false;
    }
  }
  return { pending, error, mutate };
}

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-rose-700">
      {message}
    </p>
  );
}

/** Pill-shaped radio/checkbox label; the native input is visually hidden. */
const pill = (active: boolean) =>
  cn(
    "inline-flex h-9 cursor-pointer items-center rounded-full border px-3.5 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600",
    active ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink hover:border-brand-300",
  );

/** Accept / decline incoming requests and advance active visits. In the patient queue the last step reads "Mark attended". */
export function RequestActions({ bookingId, status, queue = false }: { bookingId: string; status: BookingStatus; queue?: boolean }) {
  const { pending, error, mutate } = useMutation();
  const locale = useLocale();
  const { controls: t } = useMessages(providerDashboardMessages);
  const setStatus = (next: BookingStatus) => mutate(() => apiRequest(`/api/bookings/${bookingId}`, "PATCH", { status: next }));
  const next = nextHappyStatus(status);
  const label = queue && status === "IN_PROGRESS" ? t.markAttended : t.nextAction[status];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "REQUESTED" ? (
          <>
            <Button variant="success" size="sm" disabled={pending} onClick={() => setStatus("ACCEPTED")}>
              {t.accept}
            </Button>
            <Button variant="danger" size="sm" disabled={pending} onClick={() => setStatus("DECLINED")}>
              {t.decline}
            </Button>
          </>
        ) : (
          next &&
          label && (
            <Button size="sm" disabled={pending} onClick={() => setStatus(next)}>
              {label}
            </Button>
          )
        )}
        {status === "ACCEPTED" && (
          <Button variant="danger" size="sm" disabled={pending} onClick={() => setStatus("CANCELLED")}>
            {t.cancelVisit}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <span className="sr-only" aria-live="polite">
        {pending ? t.updatingTo(next ? domainMessages[locale].statuses[next] : "") : ""}
      </span>
    </div>
  );
}

const SLOT_TONE = {
  open: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  partly: "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100",
  blocked: "border-line bg-canvas text-ink/70 hover:bg-line",
  full: "cursor-not-allowed border-sky-200 bg-sky-50 text-sky-900",
};

/** Open or block individual slots. Full slots are managed through their bookings. */
export function SlotList({ slots }: { slots: AvailabilitySlot[] }) {
  const { pending, error, mutate } = useMutation();
  const locale = useLocale();
  const { controls: t } = useMessages(providerDashboardMessages);
  const days = groupByDay(slots, locale);

  return (
    <div className="space-y-5">
      {days.length === 0 && <p className="text-sm text-ink-muted">{t.noSlots}</p>}
      {days.map((group) => (
        <div key={group.day}>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{group.label}</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {group.items.map((slot) => {
              const full = slot.status === "booked";
              const tone = full ? "full" : slot.status === "blocked" ? "blocked" : slot.bookedCount > 0 ? "partly" : "open";
              return (
                <li key={slot.id}>
                  <button
                    type="button"
                    disabled={pending || full}
                    aria-pressed={slot.status === "open"}
                    onClick={() => mutate(() => apiRequest(`/api/slots/${slot.id}`, "PATCH", { status: slot.status === "open" ? "blocked" : "open" }))}
                    title={full ? t.fullTitle : slot.status === "open" ? t.clickToBlock : t.clickToOpen}
                    className={cn("flex w-full flex-col items-start rounded-lg border px-3 py-1.5 text-left text-xs font-semibold", SLOT_TONE[tone])}
                  >
                    <span className={cn("whitespace-nowrap", slot.status === "blocked" && "line-through")}>
                      {formatTime(slot.startAt, locale)} – {formatTime(slot.endAt, locale)}
                    </span>
                    <span className="font-medium opacity-80">
                      {t.slotStatus[slot.status]}
                      {slot.capacity > 1 && ` · ${slot.bookedCount}/${slot.capacity}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <ErrorText message={error} />
    </div>
  );
}

/** 06:00 to 22:00 in 30-minute steps. */
const START_TIMES = Array.from({ length: 33 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
const DURATIONS = [30, 60, 90, 120, 180, 240];

function clockLabel(hhmm: string): string {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "pm" : "am"}`;
}

export type DayOption = { value: string; label: string; weekend: boolean };

/** Opens the same window on several days. */
export function SlotBuilder({ providerId, dayOptions }: { providerId: string; dayOptions: DayOption[] }) {
  const { pending, error, mutate } = useMutation();
  const locale = useLocale();
  const { controls: t } = useMessages(providerDashboardMessages);
  const [dates, setDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState("120");
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const toggle = (value: string) => setDates((d) => (d.includes(value) ? d.filter((x) => x !== value) : [...d, value]));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setLocalError(null);
    if (!dates.length) {
      setLocalError(t.chooseDay);
      return;
    }
    const count = dates.length;
    const ok = await mutate(() =>
      apiRequest(`/api/providers/${providerId}/slots`, "POST", {
        dates,
        startTime,
        durationMinutes: Number(duration),
      }),
    );
    if (ok) {
      setMessage(t.added(count));
      setDates([]);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">{t.days}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {dayOptions.map((day) => (
            <label key={day.value} className={pill(dates.includes(day.value))}>
              <input type="checkbox" className="sr-only" checked={dates.includes(day.value)} onChange={() => toggle(day.value)} />
              {day.label}
            </label>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <button type="button" className="font-semibold text-brand-700 underline underline-offset-2" onClick={() => setDates(dayOptions.filter((d) => !d.weekend).map((d) => d.value))}>
            {t.weekdays}
          </button>
          <button type="button" className="font-semibold text-brand-700 underline underline-offset-2" onClick={() => setDates(dayOptions.map((d) => d.value))}>
            {t.everyDay}
          </button>
          <button type="button" className="font-semibold text-ink-muted underline underline-offset-2" onClick={() => setDates([])}>
            {t.clear}
          </button>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="slot-start">{t.startIst}</Label>
          <Select id="slot-start" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
            {START_TIMES.map((time) => (
              <option key={time} value={time}>
                {clockLabel(time)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="slot-duration">{t.length}</Label>
          <Select id="slot-duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                {formatDuration(m, locale)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          <Plus aria-hidden className="size-4" /> {t.addSlots(dates.length)}
        </Button>
        <p aria-live="polite" className="text-sm text-emerald-800">
          {message}
        </p>
      </div>
      <ErrorText message={localError ?? error} />
    </form>
  );
}

export function RadiusEditor({ providerId, radiusKm }: { providerId: string; radiusKm: number }) {
  const { pending, error, mutate } = useMutation();
  const { controls: t } = useMessages(providerDashboardMessages);
  const [value, setValue] = useState(String(radiusKm));
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaved(false);
        const ok = await mutate(() => apiRequest(`/api/providers/${providerId}`, "PATCH", { serviceRadiusKm: Number(value) }));
        setSaved(ok);
      }}
    >
      <div>
        <Label htmlFor="radius">{t.radius}</Label>
        <Input id="radius" type="number" min={1} max={50} value={value} onChange={(e) => setValue(e.target.value)} className="w-28" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {t.saveRadius}
      </Button>
      <p aria-live="polite" className="text-sm text-emerald-800">
        {saved ? t.saved : ""}
      </p>
      {error && (
        <p role="alert" className="w-full text-sm text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
