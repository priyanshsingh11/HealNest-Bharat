import { Ban, Check, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HAPPY_PATH, STATUS_LABELS } from "@/lib/booking-status";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/formatters";
import type { BookingStatus, StatusEvent } from "@/types";

const STATUS_TONE: Record<BookingStatus, "brand" | "success" | "warning" | "danger" | "neutral"> = {
  REQUESTED: "warning",
  ACCEPTED: "brand",
  ON_THE_WAY: "brand",
  ARRIVED: "brand",
  IN_PROGRESS: "brand",
  COMPLETED: "success",
  DECLINED: "danger",
  CANCELLED: "neutral",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>;
}

const STEP_HINT: Partial<Record<BookingStatus, string>> = {
  REQUESTED: "Waiting for the provider to accept",
  ACCEPTED: "Provider confirmed your visit",
  ON_THE_WAY: "Provider is travelling to you",
  ARRIVED: "Provider has arrived",
  IN_PROGRESS: "Visit in progress",
  COMPLETED: "Visit completed",
};

/** Vertical status timeline driven by the booking's status history. */
export function BookingStatusTimeline({ status, history }: { status: BookingStatus; history: StatusEvent[] }) {
  const path = HAPPY_PATH;
  const hints = STEP_HINT;
  const reached = new Map(history.map((event) => [event.status, event]));
  const terminal = status === "CANCELLED" || status === "DECLINED" ? reached.get(status) : undefined;
  const steps = terminal ? path.filter((s) => reached.has(s)) : path;
  const currentIndex = path.indexOf(status);

  return (
    <ol className="relative space-y-0" aria-label="Booking progress">
      {steps.map((step, index) => {
        const event = reached.get(step);
        const done = Boolean(event) && (terminal || path.indexOf(step) <= currentIndex);
        const current = !terminal && step === status;
        const last = index === steps.length - 1 && !terminal;
        return (
          <li key={step} className="relative flex gap-3 pb-5" aria-current={current ? "step" : undefined}>
            {!last && <span aria-hidden className={cn("absolute top-7 left-[13px] h-[calc(100%-1.5rem)] w-0.5", done ? "bg-brand-500" : "bg-line")} />}
            <span
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2",
                done ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink-muted",
                current && "ring-4 ring-brand-100",
              )}
            >
              {done ? <Check aria-hidden className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
            </span>
            <div className="pt-0.5">
              <p className={cn("text-sm font-semibold", done ? "text-ink" : "text-ink-muted")}>
                {STATUS_LABELS[step]}
                <span className="sr-only">{done ? " (done)" : " (upcoming)"}</span>
              </p>
              <p className="text-xs text-ink-muted">
                {event ? formatDateTime(event.at) : hints[step]}
                {event?.note ? ` · ${event.note}` : ""}
              </p>
            </div>
          </li>
        );
      })}
      {terminal && (
        <li className="relative flex gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-rose-300 bg-rose-50 text-rose-700">
            {status === "CANCELLED" ? <Ban aria-hidden className="size-4" /> : <CircleAlert aria-hidden className="size-4" />}
          </span>
          <div className="pt-0.5">
            <p className="text-sm font-semibold text-ink">{STATUS_LABELS[status]}</p>
            <p className="text-xs text-ink-muted">
              {formatDateTime(terminal.at)} · by {terminal.by === "user" ? "customer" : terminal.by}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}
