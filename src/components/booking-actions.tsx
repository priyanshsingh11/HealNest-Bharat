"use client";

import { MessageCircle, Phone, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { nextHappyStatus, STATUS_LABELS } from "@/lib/booking-status";
import { apiRequest } from "@/lib/client-api";
import type { BookingStatus, Role } from "@/types";

type Props = {
  bookingId: string;
  status: BookingStatus;
  role: Role;
  providerName: string;
  cancellable: boolean;
  demoTools: boolean;
};

/** Customer actions on a booking: cancel, mocked contact, and a demo control to simulate provider updates. */
export function BookingActions({ bookingId, status, role, providerName, cancellable, demoTools }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = nextHappyStatus(status);

  async function run(action: () => Promise<unknown>, success: string) {
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setContactOpen((o) => !o)} aria-expanded={contactOpen}>
          <MessageCircle aria-hidden className="size-4" /> Contact provider
        </Button>
        {role === "user" && cancellable && !confirmCancel && (
          <Button variant="danger" onClick={() => setConfirmCancel(true)} data-testid="cancel-booking">
            Cancel booking
          </Button>
        )}
        {demoTools && next && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => apiRequest(`/api/bookings/${bookingId}/simulate`, "POST"), `Simulated: ${STATUS_LABELS[next]}`)}
            data-testid="simulate-update"
          >
            <Wand2 aria-hidden className="size-4" /> Demo: simulate “{STATUS_LABELS[next]}”
          </Button>
        )}
      </div>

      {confirmCancel && (
        <div role="alertdialog" aria-labelledby="cancel-title" className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p id="cancel-title" className="font-semibold text-rose-950">
            Cancel this booking?
          </p>
          <p className="mt-1 text-sm text-rose-900">The time window will be released. Refunds follow the cancellation terms shown.</p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                run(() => apiRequest(`/api/bookings/${bookingId}`, "PATCH", { status: "CANCELLED" }), "Booking cancelled.").then(() =>
                  setConfirmCancel(false),
                )
              }
              data-testid="confirm-cancel"
            >
              Yes, cancel
            </Button>
            <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
              Keep booking
            </Button>
          </div>
        </div>
      )}

      {contactOpen && (
        <div className="rounded-xl border border-line bg-slate-50 p-4 text-sm">
          <p className="font-semibold">Contact {providerName}</p>
          <p className="mt-1 text-ink-muted">
            In the live app, calls and chats go through a masked number so neither side sees personal phone numbers. This demo does not
            place real calls or send messages.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setMessage("Demo: a masked call would be connected now.")}>
              <Phone aria-hidden className="size-4" /> Call (masked)
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setMessage("Demo: an in-app chat would open now.")}>
              <MessageCircle aria-hidden className="size-4" /> Message
            </Button>
          </div>
        </div>
      )}

      <p aria-live="polite" className="text-sm font-medium text-emerald-800">
        {message}
      </p>
      {error && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
