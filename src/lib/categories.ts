import type { CareRepository } from "@/lib/repository/types";
import type { Category, CategoryId, CategoryKind } from "@/types";

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "nurse",
    name: "Home Nurse",
    shortName: "Nurse",
    kind: "medical",
    description: "Registered nurses for injections, wound dressing, vitals monitoring and post-operative care at home.",
    active: true,
  },
  {
    id: "physiotherapist",
    name: "Physiotherapist",
    shortName: "Physio",
    kind: "medical",
    description: "Qualified physiotherapists for pain relief, rehabilitation and mobility sessions at home.",
    active: true,
  },
  {
    id: "phlebotomist",
    name: "Home Lab Collection",
    shortName: "Lab tests",
    kind: "medical",
    description: "Trained phlebotomists who collect blood and other samples at home for tests at a partner lab.",
    active: true,
  },
  {
    id: "babysitter",
    name: "Babysitter / Nanny",
    shortName: "Babysitter",
    kind: "childcare",
    description: "Background-checked babysitters and nannies for childcare at home. Not a medical service.",
    active: true,
  },
  {
    id: "caregiver",
    name: "Caregiver",
    shortName: "Caregiver",
    kind: "non_medical",
    description: "Trained caregivers for companionship, mobility and daily-living support for elders. Not a medical service.",
    active: true,
  },
];

/**
 * Professions shown on the site as "Coming soon": announced, but not open for
 * bookings or caretaker sign-ups yet. Remove an id from here to launch it.
 * This is separate from a category's `active` flag, which admins toggle to pause a live category.
 */
export const COMING_SOON_CATEGORIES: readonly CategoryId[] = ["phlebotomist"];

export function isComingSoon(id: CategoryId): boolean {
  return COMING_SOON_CATEGORIES.includes(id);
}

/** Categories that can be browsed and booked now: switched on by an admin and past "coming soon". */
export function bookableCategories<T extends { id: CategoryId; active: boolean }>(categories: readonly T[]): T[] {
  return categories.filter((category) => category.active && !isComingSoon(category.id));
}

/** How care professionals describe themselves, e.g. when logging in as a caretaker. */
export const PROFESSION_LABELS: Record<CategoryId, string> = {
  nurse: "Nurse",
  physiotherapist: "Physiotherapist",
  phlebotomist: "Lab technician",
  babysitter: "Nanny / Babysitter",
  caregiver: "Caregiver",
};

export const KIND_LABELS: Record<CategoryKind, string> = {
  medical: "Medical service",
  childcare: "Childcare — non-medical",
  non_medical: "Personal care — non-medical",
};

export function categoryKind(id: CategoryId): CategoryKind {
  return DEFAULT_CATEGORIES.find((category) => category.id === id)?.kind ?? "non_medical";
}

export function categoryName(id: CategoryId): string {
  return DEFAULT_CATEGORIES.find((category) => category.id === id)?.name ?? id;
}

export function isMedical(id: CategoryId): boolean {
  return categoryKind(id) === "medical";
}

/** False for switched-off and not-yet-launched categories, whose providers are hidden and can't be booked. */
export async function isCategoryActive(repo: Pick<CareRepository, "listCategories">, id: CategoryId): Promise<boolean> {
  if (isComingSoon(id)) return false;
  return (await repo.listCategories()).some((category) => category.id === id && category.active);
}
