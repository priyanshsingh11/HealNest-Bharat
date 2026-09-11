import {
  Baby,
  BadgeCheck,
  Bandage,
  BedDouble,
  HandHeart,
  HeartHandshake,
  Hourglass,
  HouseHeart,
  Pipette,
  PersonStanding,
  ShieldAlert,
  ShieldQuestion,
  Syringe,
  TestTubeDiagonal,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoryKind, KIND_LABELS } from "@/lib/categories";
import { cn } from "@/lib/cn";
import type { CareServiceId, CategoryId, CategoryKind, VerificationStatus } from "@/types";

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  nurse: Syringe,
  physiotherapist: PersonStanding,
  phlebotomist: TestTubeDiagonal,
  babysitter: Baby,
  caregiver: HandHeart,
};

export const CARE_SERVICE_ICONS: Record<CareServiceId, LucideIcon> = {
  "home-nursing": HouseHeart,
  "injection-iv": Syringe,
  "wound-dressing": Bandage,
  "catheter-care": Pipette,
  "elderly-care": HeartHandshake,
  "post-operative-care": BedDouble,
  physiotherapy: PersonStanding,
  "home-lab-collection": TestTubeDiagonal,
};

export function CareServiceIcon({ service, className }: { service: CareServiceId; className?: string }) {
  const Icon = CARE_SERVICE_ICONS[service];
  return <Icon aria-hidden className={className} />;
}

/** Tailwind classes for the avatar/icon tile of each category kind. */
export const KIND_TILE: Record<CategoryKind, string> = {
  medical: "bg-sky-100 text-sky-800",
  childcare: "bg-leaf-100 text-leaf-800",
  non_medical: "bg-leaf-100 text-leaf-800",
};

const KIND_TONE = { medical: "medical", childcare: "childcare", non_medical: "care" } as const;

/** Always shown next to a provider so medical and non-medical services can't be confused. */
export function KindBadge({ category }: { category: CategoryId }) {
  const kind = categoryKind(category);
  return <Badge tone={KIND_TONE[kind]}>{KIND_LABELS[kind]}</Badge>;
}

const VERIFICATION: Record<VerificationStatus, { label: string; tone: "success" | "warning" | "neutral" | "danger"; icon: LucideIcon }> = {
  verified: { label: "Verified", tone: "success", icon: BadgeCheck },
  pending: { label: "Verification pending", tone: "warning", icon: Hourglass },
  unverified: { label: "Not verified", tone: "neutral", icon: ShieldQuestion },
  rejected: { label: "Verification rejected", tone: "danger", icon: ShieldAlert },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { label, tone, icon: Icon } = VERIFICATION[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden className="size-3.5" />
      {label}
    </Badge>
  );
}

/** Blue tick next to a verified provider's name — earned by passing HealNest Bharat verification. */
export function VerifiedTick({ className }: { className?: string }) {
  return (
    <span title="Verified by HealNest Bharat" className={cn("inline-flex size-5 shrink-0", className)}>
      <BadgeCheck aria-hidden className="size-full fill-brand-600 text-white" />
      <span className="sr-only">Verified</span>
    </span>
  );
}

export function CategoryIcon({ category, className }: { category: CategoryId; className?: string }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon aria-hidden className={className} />;
}
