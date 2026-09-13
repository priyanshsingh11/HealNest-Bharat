// Formatting helpers. A fixed time zone keeps server and client renders identical.
// Functions that produce words take the visitor's language; API code and emails use the English default.

import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";

export const APP_TIME_ZONE = "Asia/Kolkata";

const WORDS: Record<Locale, { today: string; tomorrow: string; min: string; hr: string }> = {
  en: { today: "Today", tomorrow: "Tomorrow", min: "min", hr: "hr" },
  hi: { today: "आज", tomorrow: "कल", min: "मिनट", hr: "घंटा" },
};

export function formatMoney(minor: number, currency = "INR"): string {
  const major = minor / 100;
  const hasFraction = minor % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(major);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDateTime(iso: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: APP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

const istDayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(date);

/** "Today, 2:00 pm" / "Tomorrow, 9:00 am" / "Sat, 12 Sept, 9:00 am". */
export function formatSlotLabel(iso: string, now: Date = new Date(), locale: Locale = "en"): string {
  const day = istDayKey(new Date(iso));
  if (day === istDayKey(now)) return `${WORDS[locale].today}, ${formatTime(iso, locale)}`;
  if (day === istDayKey(new Date(now.getTime() + 24 * 3600 * 1000))) return `${WORDS[locale].tomorrow}, ${formatTime(iso, locale)}`;
  return formatDateTime(iso, locale);
}

/** Groups ISO instants by IST calendar day, preserving order. */
export function groupByDay<T extends { startAt: string }>(
  items: T[],
  locale: Locale = "en",
): Array<{ day: string; label: string; items: T[] }> {
  const groups = new Map<string, { day: string; label: string; items: T[] }>();
  for (const item of items) {
    const day = istDayKey(new Date(item.startAt));
    if (!groups.has(day)) groups.set(day, { day, label: formatDate(item.startAt, locale), items: [] });
    groups.get(day)!.items.push(item);
  }
  return [...groups.values()];
}

export function formatTimeRange(startIso: string, endIso: string, locale: Locale = "en"): string {
  return `${formatDate(startIso, locale)}, ${formatTime(startIso, locale)} – ${formatTime(endIso, locale)}`;
}

export function formatPercentBps(bps: number): string {
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2)}%`;
}

export function formatDuration(minutes: number, locale: Locale = "en"): string {
  const { min, hr } = WORDS[locale];
  if (minutes < 60) return `${minutes} ${min}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ${hr} ${rest} ${min}` : `${hours} ${hr}`;
}

export function initials(name: string): string {
  return name
    .replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function maskReference(reference: string): string {
  if (reference.length <= 4) return reference;
  return `${"•".repeat(Math.max(0, reference.length - 4))}${reference.slice(-4)}`;
}
