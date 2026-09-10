// Formatting helpers. A fixed time zone keeps server and client renders identical.

export const APP_TIME_ZONE = "Asia/Kolkata";
const LOCALE = "en-IN";

export function formatMoney(minor: number, currency = "INR"): string {
  const major = minor / 100;
  const hasFraction = minor % 100 !== 0;
  return new Intl.NumberFormat(LOCALE, {
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

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: APP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

const istDayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(date);

/** "Today, 2:00 pm" / "Tomorrow, 9:00 am" / "Sat, 12 Sept, 9:00 am". */
export function formatSlotLabel(iso: string, now: Date = new Date()): string {
  const day = istDayKey(new Date(iso));
  if (day === istDayKey(now)) return `Today, ${formatTime(iso)}`;
  if (day === istDayKey(new Date(now.getTime() + 24 * 3600 * 1000))) return `Tomorrow, ${formatTime(iso)}`;
  return formatDateTime(iso);
}

/** Groups ISO instants by IST calendar day, preserving order. */
export function groupByDay<T extends { startAt: string }>(items: T[]): Array<{ day: string; label: string; items: T[] }> {
  const groups = new Map<string, { day: string; label: string; items: T[] }>();
  for (const item of items) {
    const day = istDayKey(new Date(item.startAt));
    if (!groups.has(day)) groups.set(day, { day, label: formatDate(item.startAt), items: [] });
    groups.get(day)!.items.push(item);
  }
  return [...groups.values()];
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatDate(startIso)}, ${formatTime(startIso)} – ${formatTime(endIso)}`;
}

export function formatPercentBps(bps: number): string {
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2)}%`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
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
