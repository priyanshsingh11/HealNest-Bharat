"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { nextHappyStatus, STATUS_LABELS } from "@/lib/booking-status";
import { apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { formatTime, groupByDay } from "@/lib/formatters";
import type { AvailabilitySlot, BookingStatus } from "@/types";

function useMutation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  async function mutate(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      startTransition(() => router.refresh());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    }
  }
  return { pending, error, mutate };
}

const NEXT_ACTION_LABEL: Partial<Record<BookingStatus, string>> = {
  ACCEPTED: "Mark on the way",
  ON_THE_WAY: "Mark arrived",
  ARRIVED: "Start visit",
  IN_PROGRESS: "Complete visit",
};

/** Accept / decline incoming requests and advance active visits. */
export function RequestActions({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  const { pending, error, mutate } = useMutation();
  const setStatus = (next: BookingStatus) => mutate(() => apiRequest(`/api/bookings/${bookingId}`, "PATCH", { status: next }));
  const next = nextHappyStatus(status);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "REQUESTED" ? (
          <>
            <Button variant="success" size="sm" disabled={pending} onClick={() => setStatus("ACCEPTED")}>
              Accept
            </Button>
            <Button variant="danger" size="sm" disabled={pending} onClick={() => setStatus("DECLINED")}>
              Decline
            </Button>
          </>
        ) : (
          next &&
          NEXT_ACTION_LABEL[status] && (
            <Button size="sm" disabled={pending} onClick={() => setStatus(next)}>
              {NEXT_ACTION_LABEL[status]}
            </Button>
          )
        )}
        {status === "ACCEPTED" && (
          <Button variant="danger" size="sm" disabled={pending} onClick={() => setStatus("CANCELLED")}>
            Cancel visit
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <span className="sr-only" aria-live="polite">
        {pending ? `Updating to ${next ? STATUS_LABELS[next] : ""}` : ""}
      </span>
    </div>
  );
}

/** Toggle slots between open and blocked, and add new availability windows. */
export function AvailabilityManager({ providerId, slots, dayOptions }: { providerId: string; slots: AvailabilitySlot[]; dayOptions: { value: string; label: string }[] }) {
  const { pending, error, mutate } = useMutation();
  const [day, setDay] = useState(dayOptions[0]?.value ?? "");
  const [hour, setHour] = useState("10");
  const [duration, setDuration] = useState("120");
  const days = groupByDay(slots);

  return (
    <div className="space-y-5">
      {days.length === 0 && <p className="text-sm text-ink-muted">No availability in the next 7 days.</p>}
      {days.map((group) => (
        <div key={group.day}>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{group.label}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {group.items.map((slot) => (
              <li key={slot.id}>
                <button
                  type="button"
                  disabled={pending || slot.status === "booked"}
                  aria-pressed={slot.status === "open"}
                  onClick={() => mutate(() => apiRequest(`/api/slots/${slot.id}`, "PATCH", { status: slot.status === "open" ? "blocked" : "open" }))}
                  title={slot.status === "booked" ? "Booked — manage via the booking" : slot.status === "open" ? "Click to block" : "Click to open"}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                    slot.status === "open" && "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
                    slot.status === "blocked" && "border-line bg-slate-100 text-ink-muted line-through hover:bg-slate-200",
                    slot.status === "booked" && "cursor-not-allowed border-sky-200 bg-sky-50 text-sky-900",
                  )}
                >
                  {formatTime(slot.startAt)} · {slot.status}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <form
        className="flex flex-wrap items-end gap-3 border-t border-line pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          const startAt = `${day}T${hour.padStart(2, "0")}:00:00+05:30`;
          mutate(() => apiRequest(`/api/providers/${providerId}/slots`, "POST", { startAt, durationMinutes: Number(duration) }));
        }}
      >
        <div>
          <Label htmlFor="slot-day">Day</Label>
          <Select id="slot-day" value={day} onChange={(e) => setDay(e.target.value)}>
            {dayOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="slot-hour">Start (IST)</Label>
          <Select id="slot-hour" value={hour} onChange={(e) => setHour(e.target.value)}>
            {Array.from({ length: 15 }, (_, i) => i + 7).map((h) => (
              <option key={h} value={String(h)}>
                {h}:00
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="slot-duration">Window</Label>
          <Select id="slot-duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="240">4 hours</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          <Plus aria-hidden className="size-4" /> Add slot
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function RadiusEditor({ providerId, radiusKm }: { providerId: string; radiusKm: number }) {
  const { pending, error, mutate } = useMutation();
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
        <Label htmlFor="radius">Service radius (km)</Label>
        <Input id="radius" type="number" min={1} max={50} value={value} onChange={(e) => setValue(e.target.value)} className="w-28" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        Save radius
      </Button>
      <p aria-live="polite" className="text-sm text-emerald-800">
        {saved ? "Saved." : ""}
      </p>
      {error && (
        <p role="alert" className="w-full text-sm text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
