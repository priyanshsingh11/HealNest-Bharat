"use client";

import { Siren } from "lucide-react";
import type { ReactNode } from "react";
import { Marquee } from "@/components/marquee";
import { useMessages } from "@/lib/i18n/client";
import { systemMessages } from "@/lib/i18n/messages/system";

/** Shown on every care-seeking screen. HealNest Bharat is not an emergency or diagnostic service. */
export function EmergencyBanner({ emergencyNumber = "112", compact = false }: { emergencyNumber?: string; compact?: boolean }) {
  const t = useMessages(systemMessages).emergency;
  // `hidden` copies only exist for the scrolling loop, so their call link stays out of the tab order.
  const message = (hidden: boolean): ReactNode => (
    <>
      <strong>{t.lead}</strong>
      {t.dialBefore}
      <a href={`tel:${emergencyNumber}`} tabIndex={hidden ? -1 : undefined} className="font-bold underline underline-offset-2">
        {emergencyNumber}
      </a>
      {t.dialAfter}
    </>
  );

  if (compact) {
    return (
      <aside
        aria-label={t.aria}
        className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
      >
        <Siren aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p>{message(false)}</p>
      </aside>
    );
  }

  // Scrolls like a ticker; pauses on hover or focus, and stands still (wrapped, centred) for reduced motion.
  return (
    <aside aria-label={t.aria} className="border-b border-rose-200 bg-rose-50 py-2.5 text-sm text-rose-900">
      <Marquee>
        {(hidden) => (
          <li className="flex shrink-0 items-center gap-2 px-6 whitespace-nowrap motion-reduce:shrink motion-reduce:items-start motion-reduce:px-0 motion-reduce:whitespace-normal">
            <Siren aria-hidden className="size-4 shrink-0 motion-reduce:mt-0.5" />
            <span>{message(hidden)}</span>
          </li>
        )}
      </Marquee>
    </aside>
  );
}
