"use client";

import { BadgeCheck, Hourglass, Rocket, ShieldAlert, ShieldQuestion, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoryKind } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { useMessages } from "@/lib/i18n/client";
import { domainMessages } from "@/lib/i18n/messages/domain";
import type { CategoryId, VerificationStatus } from "@/types";

const KIND_TONE = { medical: "medical", childcare: "childcare", non_medical: "care" } as const;

/** Marks a profession or service that is announced but not open for bookings yet. */
export function ComingSoonBadge({ className }: { className?: string }) {
  const t = useMessages(domainMessages);
  return (
    <Badge tone="warning" className={className}>
      <Rocket aria-hidden className="size-3.5" />
      {t.comingSoon}
    </Badge>
  );
}

/** Always shown next to a provider so medical and non-medical services can't be confused. */
export function KindBadge({ category }: { category: CategoryId }) {
  const t = useMessages(domainMessages);
  const kind = categoryKind(category);
  return <Badge tone={KIND_TONE[kind]}>{t.kinds[kind]}</Badge>;
}

const VERIFICATION: Record<VerificationStatus, { tone: "success" | "warning" | "neutral" | "danger"; icon: LucideIcon }> = {
  verified: { tone: "success", icon: BadgeCheck },
  pending: { tone: "warning", icon: Hourglass },
  unverified: { tone: "neutral", icon: ShieldQuestion },
  rejected: { tone: "danger", icon: ShieldAlert },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const t = useMessages(domainMessages);
  const { tone, icon: Icon } = VERIFICATION[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden className="size-3.5" />
      {t.verification[status]}
    </Badge>
  );
}

/** Blue tick next to a verified provider's name — earned by passing HealNest Bharat verification. */
export function VerifiedTick({ className }: { className?: string }) {
  const t = useMessages(domainMessages);
  return (
    <span title={t.verifiedBy} className={cn("inline-flex size-5 shrink-0", className)}>
      <BadgeCheck aria-hidden className="size-full fill-brand-600 text-white" />
      <span className="sr-only">{t.verified}</span>
    </span>
  );
}
