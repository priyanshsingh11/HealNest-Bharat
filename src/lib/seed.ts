import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { DEFAULT_PLATFORM_CONFIG, DEFAULT_PRICING_RULES } from "@/lib/platform-defaults";
import type {
  AvailabilitySlot,
  Booking,
  Category,
  PlatformConfig,
  PricingRule,
  ProviderProfile,
  Review,
  Service,
  User,
  VerificationApplication,
} from "@/types";

// What a fresh data store starts with: categories, pricing rules, platform settings and the demo customer and admin
// accounts the mock login uses. No providers, bookings or reviews — those come from sign-ups.
// Used by the in-memory repository and by `npm run db:seed` for Supabase.

export const DEMO_USER_ID = "user_demo";
export const DEMO_ADMIN_ID = "admin_demo";

export type SeedData = {
  categories: Category[];
  users: User[];
  providers: ProviderProfile[];
  services: Service[];
  slots: AvailabilitySlot[];
  reviews: Review[];
  verificationApplications: VerificationApplication[];
  pricingRules: PricingRule[];
  config: PlatformConfig;
  bookings: Booking[];
};

export function createSeedData(now: Date = new Date()): SeedData {
  const createdAt = now.toISOString();
  return {
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    users: [
      { id: DEMO_USER_ID, name: "Aarav Sharma", email: "aarav.demo@example.com", phone: "+91 90000 00001", role: "user", createdAt },
      { id: DEMO_ADMIN_ID, name: "HealNest Admin", email: "admin.demo@example.com", phone: "+91 90000 00002", role: "admin", createdAt },
    ],
    providers: [],
    services: [],
    slots: [],
    reviews: [],
    verificationApplications: [],
    pricingRules: DEFAULT_PRICING_RULES.map((rule) => ({ ...rule })),
    config: { ...DEFAULT_PLATFORM_CONFIG, taxAppliesTo: [...DEFAULT_PLATFORM_CONFIG.taxAppliesTo] },
    bookings: [],
  };
}
