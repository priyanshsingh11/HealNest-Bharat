import Link from "next/link";
import { STATUS_LABELS } from "@/lib/booking-status";
import { cn } from "@/lib/cn";
import { APP_TIME_ZONE, formatTime } from "@/lib/formatters";
import type { AvailabilitySlot, Booking } from "@/types";

// Timetable view of a provider's week: one column per day, slots and appointments placed by IST time.

export const CALENDAR_START_HOUR = 6;
export const CALENDAR_END_HOUR = 22;
const HOUR_PX = 56;

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE });
const clockFormat = new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** IST calendar date, e.g. "2026-09-11". */
export const istDayKey = (iso: string) => dayKeyFormat.format(new Date(iso));

function istMinutes(iso: string): number {
  const [hours, minutes] = clockFormat.format(new Date(iso)).split(":").map(Number);
  return hours * 60 + minutes;
}

/** Vertical position of a time range in the grid, clipped to the visible hours. */
function place(startIso: string, endIso: string): { top: number; height: number } | null {
  const start = istMinutes(startIso);
  const end = start + (Date.parse(endIso) - Date.parse(startIso)) / 60_000;
  const from = Math.max(start, CALENDAR_START_HOUR * 60);
  const to = Math.min(end, CALENDAR_END_HOUR * 60);
  if (to <= from) return null;
  return { top: ((from - CALENDAR_START_HOUR * 60) / 60) * HOUR_PX, height: Math.max(((to - from) / 60) * HOUR_PX, 40) };
}

const SLOT_TONE = {
  open: "border-emerald-300 bg-emerald-50 text-emerald-950",
  partly: "border-amber-300 bg-amber-50 text-amber-950",
  full: "border-sky-300 bg-sky-100 text-sky-950",
  blocked: "border-line bg-canvas text-ink/70",
};

function slotTone(slot: AvailabilitySlot): keyof typeof SLOT_TONE {
  if (slot.status === "blocked") return "blocked";
  if (slot.status === "booked") return "full";
  return slot.bookedCount > 0 ? "partly" : "open";
}

export type CalendarDay = { key: string; label: string; isToday: boolean };

export function WeekCalendar({
  days,
  slots,
  bookings,
  nowIso,
}: {
  days: CalendarDay[];
  slots: AvailabilitySlot[];
  bookings: Booking[];
  nowIso: string;
}) {
  const hours = Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 }, (_, i) => CALENDAR_START_HOUR + i);
  const height = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_PX;
  const nowMinutes = istMinutes(nowIso);
  const nowTop =
    nowMinutes >= CALENDAR_START_HOUR * 60 && nowMinutes <= CALENDAR_END_HOUR * 60
      ? ((nowMinutes - CALENDAR_START_HOUR * 60) / 60) * HOUR_PX
      : null;
  const hourLines = { backgroundImage: `repeating-linear-gradient(to bottom, var(--color-line) 0 1px, transparent 1px ${HOUR_PX}px)` };

  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-3">
      <div className="grid min-w-[40rem] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] sm:min-w-[52rem]">
        {/* Corner and hour labels stay pinned while the days scroll sideways on phones. */}
        <div aria-hidden className="sticky left-0 z-30 bg-surface" />
        {days.map((day) => (
          <div
            key={day.key}
            className={cn("border-b border-line px-1 pb-2 text-center text-xs font-bold uppercase tracking-wide", day.isToday ? "text-brand-700" : "text-ink-muted")}
          >
            {day.label}
            {day.isToday && <span className="block text-[11px] font-semibold normal-case">Today</span>}
          </div>
        ))}

        <div aria-hidden className="sticky left-0 z-30 bg-surface" style={{ height }}>
          {hours.map((hour) => (
            <span key={hour} className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-muted" style={{ top: (hour - CALENDAR_START_HOUR) * HOUR_PX }}>
              {hour % 12 || 12} {hour < 12 ? "am" : "pm"}
            </span>
          ))}
        </div>

        {days.map((day) => {
          const daySlots = slots.filter((s) => istDayKey(s.startAt) === day.key);
          const dayBookings = bookings.filter((b) => istDayKey(b.scheduledStart) === day.key);
          const slotIds = new Set(daySlots.map((s) => s.id));
          const linked = (b: Booking) => Boolean(b.slotId && slotIds.has(b.slotId));
          const overlaps = (b: Booking, s: AvailabilitySlot) =>
            Date.parse(b.scheduledStart) >= Date.parse(s.startAt) && Date.parse(b.scheduledStart) < Date.parse(s.endAt);
          // Appointments listed inside the slot they fall in; only those outside every slot are drawn on their own.
          const standalone = dayBookings.filter((b) => !linked(b) && !daySlots.some((s) => overlaps(b, s)));
          return (
            <ul key={day.key} aria-label={day.label} className="relative border-l border-line" style={{ height, ...hourLines }}>
              {daySlots.map((slot) => {
                const position = place(slot.startAt, slot.endAt);
                if (!position) return null;
                const inSlot = dayBookings.filter((b) => b.slotId === slot.id || (!linked(b) && overlaps(b, slot)));
                return (
                  <li
                    key={slot.id}
                    className={cn("absolute inset-x-1 overflow-hidden rounded-lg border p-1.5 text-[11px] leading-tight", SLOT_TONE[slotTone(slot)])}
                    style={position}
                  >
                    <p className="font-bold">
                      <span className="whitespace-nowrap">{formatTime(slot.startAt)}</span> –{" "}
                      <span className="whitespace-nowrap">{formatTime(slot.endAt)}</span>
                    </p>
                    <p>{slot.status === "blocked" ? "Blocked" : `${slot.bookedCount}/${slot.capacity} booked`}</p>
                    {inSlot.map((b) => (
                      <Link key={b.id} href={`/booking/${b.id}`} className="mt-1 block truncate rounded bg-white/70 px-1 font-semibold hover:underline">
                        {b.serviceName}
                      </Link>
                    ))}
                  </li>
                );
              })}
              {standalone.map((b) => {
                const position = place(b.scheduledStart, b.scheduledEnd);
                if (!position) return null;
                return (
                  <li
                    key={b.id}
                    className="absolute right-1 left-1/3 z-10 overflow-hidden rounded-lg border border-brand-800 bg-brand-700 p-1.5 text-[11px] leading-tight text-white shadow-sm"
                    style={position}
                  >
                    <Link href={`/booking/${b.id}`} className="block truncate font-bold hover:underline">
                      {formatTime(b.scheduledStart)} {b.serviceName}
                    </Link>
                    <p className="opacity-90">{STATUS_LABELS[b.status]}</p>
                  </li>
                );
              })}
              {day.isToday && nowTop !== null && (
                <li
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-rose-500 before:absolute before:-top-[3px] before:-left-1 before:size-2 before:rounded-full before:bg-rose-500"
                  style={{ top: nowTop }}
                />
              )}
            </ul>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarLegend() {
  const items = [
    { label: "Open", className: SLOT_TONE.open },
    { label: "Partly booked", className: SLOT_TONE.partly },
    { label: "Full", className: SLOT_TONE.full },
    { label: "Blocked", className: SLOT_TONE.blocked },
    { label: "Appointment", className: "border-brand-800 bg-brand-700" },
  ];
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-muted" aria-label="Legend">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className={cn("size-3 rounded border", item.className)} />
          {item.label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="h-0 w-4 border-t-2 border-rose-500" />
        Now
      </li>
    </ul>
  );
}
