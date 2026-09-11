import { STATUS_LABELS } from "@/lib/booking-status";
import type { Booking } from "@/types";

// iCalendar (RFC 5545) export so providers get appointment reminders in their phone or desktop calendar.
// Patient addresses are deliberately left out: calendars often sync to third-party services.

const pad = (n: number) => String(n).padStart(2, "0");

/** 2026-09-11T09:30:00.000Z → 20260911T093000Z */
function icsTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Folds content lines longer than 75 octets; continuation lines start with a space. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function appointmentsCalendar(
  bookings: Booking[],
  options: { calendarName: string; baseUrl: string; now?: Date; reminderMinutes?: number },
): string {
  const now = options.now ?? new Date();
  const reminder = options.reminderMinutes ?? 30;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HealNest Bharat//Appointments//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(options.calendarName)}`,
  ];
  for (const booking of bookings) {
    const url = `${options.baseUrl}/booking/${booking.id}`;
    const summary = `Home visit: ${booking.serviceName}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${booking.id}@healnest-bharat`,
      `DTSTAMP:${icsTime(now.toISOString())}`,
      `DTSTART:${icsTime(booking.scheduledStart)}`,
      `DTEND:${icsTime(booking.scheduledEnd)}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(`Booking ${booking.id} (${STATUS_LABELS[booking.status]}). Details: ${url}`)}`,
      `URL:${url}`,
      `STATUS:${booking.status === "REQUESTED" ? "TENTATIVE" : "CONFIRMED"}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(`Upcoming: ${summary}`)}`,
      `TRIGGER:-PT${reminder}M`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
