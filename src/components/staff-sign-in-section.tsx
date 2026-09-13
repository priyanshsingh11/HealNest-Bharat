"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { StaffLoginForm } from "@/components/staff-login-form";
import { useMessages } from "@/lib/i18n/client";
import { staffMessages } from "@/lib/i18n/messages/staff";

/**
 * Staff sign-in on the login page: a quiet line under the account card that opens the two-step form.
 * Kept small on purpose — customers and caretakers have no use for it.
 */
export function StaffSignInSection({ configured }: { configured: boolean }) {
  const t = useMessages(staffMessages);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <p className="mt-6 text-center text-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 font-semibold text-ink-muted transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-600/40"
          data-testid="staff-sign-in-toggle"
        >
          <ShieldCheck aria-hidden className="size-4" />
          {t.toggle}
        </button>
      </p>
    );
  }

  return (
    <section aria-labelledby="staff-heading" className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="staff-heading" className="flex items-center gap-2 font-bold text-ink">
            <ShieldCheck aria-hidden className="size-4 text-brand-700" />
            {t.heading}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t.sectionIntro}
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="shrink-0 text-sm font-semibold text-ink-muted hover:underline">
          {t.close}
        </button>
      </div>
      <div className="mt-4">
        <StaffLoginForm configured={configured} />
      </div>
    </section>
  );
}
