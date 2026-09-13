import {
  Baby,
  Bandage,
  BedDouble,
  HandHeart,
  HeartHandshake,
  HouseHeart,
  Pipette,
  PersonStanding,
  Syringe,
  TestTubeDiagonal,
  type LucideIcon,
} from "lucide-react";
import type { CareServiceId, CategoryId, CategoryKind } from "@/types";

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

// Badges carry words, so they live in a client module that follows the visitor's language.
export { ComingSoonBadge, KindBadge, VerificationBadge, VerifiedTick } from "@/components/category-badges";

export function CategoryIcon({ category, className }: { category: CategoryId; className?: string }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon aria-hidden className={className} />;
}
