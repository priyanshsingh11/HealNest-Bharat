"use client";

import { MessageCircle, Phone, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { nextHappyStatus } from "@/lib/booking-status";
import { apiRequest } from "@/lib/client-api";
import { useLocale } from "@/lib/i18n/client";
import { bookingMessages } from "@/lib/i18n/messages/booking";
import { domainMessages } from "@/lib/i18n/messages/domain";
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
  const locale = useLocale();
  const t = bookingMessages[locale].actions;
  const statusLabels = domainMessages[locale].statuses;
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
      setError(e instanceof Error ? e.message : t.genericError);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:flex sm:flex-wrap">
        <Button variant="secondary" onClick={() => setContactOpen((o) => !o)} aria-expanded={contactOpen}>
          <MessageCircle aria-hidden className="size-4" /> {t.contactProvider}
        </Button>
        {role === "user" && cancellable && !confirmCancel && (
          <Button variant="danger" onClick={() => setConfirmCancel(true)} data-testid="cancel-booking">
            {t.cancelBooking}
          </Button>
        )}
        {demoTools && next && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => apiRequest(`/api/bookings/${bookingId}/simulate`, "POST"), t.simulated(statusLabels[next]))}
            data-testid="simulate-update"
          >
            <Wand2 aria-hidden className="size-4" /> {t.simulate(statusLabels[next])}
          </Button>
        )}
      </div>

      {confirmCancel && (
        <div role="alertdialog" aria-labelledby="cancel-title" className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p id="cancel-title" className="font-semibold text-rose-950">
            {t.cancelTitle}
          </p>
          <p className="mt-1 text-sm text-rose-900">{t.cancelBody}</p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                run(() => apiRequest(`/api/bookings/${bookingId}`, "PATCH", { status: "CANCELLED" }), t.cancelled).then(() =>
                  setConfirmCancel(false),
                )
              }
              data-testid="confirm-cancel"
            >
              {t.yesCancel}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
              {t.keepBooking}
            </Button>
          </div>
        </div>
      )}

      {contactOpen && (
        <div className="rounded-xl border border-line bg-canvas p-4 text-sm">
          <p className="font-semibold">{t.contactTitle(providerName)}</p>
          <p className="mt-1 text-ink-muted">{t.contactBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setMessage(t.callDemo)}>
              <Phone aria-hidden className="size-4" /> {t.call}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setMessage(t.chatDemo)}>
              <MessageCircle aria-hidden className="size-4" /> {t.message}
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
