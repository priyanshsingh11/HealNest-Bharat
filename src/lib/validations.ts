import { z } from "zod";
import { BOOKING_STATUSES, CARE_SERVICE_IDS, CATEGORY_IDS } from "@/types";
import { MAX_MEDICINE_QUANTITY } from "@/lib/pricing";

// Shared Zod schemas used by forms (client) and API routes (server).

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

export const categorySchema = z.enum(CATEGORY_IDS);

export const SORT_OPTIONS = ["distance", "availability", "rating", "price"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** Query params for provider discovery. Everything optional so partial URLs still work. */
export const providerSearchSchema = z.object({
  lat: latitude.optional(),
  lng: longitude.optional(),
  label: z.string().max(120).optional(),
  category: categorySchema.optional(),
  service: z.enum(CARE_SERVICE_IDS).optional(),
  q: z.string().max(80).optional(),
  maxDistanceKm: z.coerce.number().min(1).max(100).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  language: z.string().max(40).optional(),
  gender: z.enum(["female", "male", "other"]).optional(),
  availability: z.enum(["today", "tomorrow", "week"]).optional(),
  verifiedOnly: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .transform((value) => value === "1" || value === "true")
    .optional(),
  sort: z.enum(SORT_OPTIONS).optional(),
});
export type ProviderSearchParams = z.infer<typeof providerSearchSchema>;

// Notes are deliberately short and non-diagnostic.
export const NOTES_MAX = 300;

export const quoteRequestSchema = z.object({
  providerId: z.string().min(1).max(40),
  serviceId: z.string().min(1).max(40),
  includeMedicine: z.boolean().default(false),
  medicineQuantity: z.number().int().min(1).max(MAX_MEDICINE_QUANTITY).default(1),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

/** Home visit request: needs the visit address and consent to share it. */
export const bookingFormSchema = z.object({
  providerId: z.string().min(1, "Choose a provider").max(40),
  serviceId: z.string().min(1, "Choose a service").max(40),
  slotId: z.string().min(1, "Choose a date and time window").max(60),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX, `Keep the description under ${NOTES_MAX} characters`)
    .default(""),
  includeMedicine: z.boolean().default(false),
  medicineQuantity: z.number().int().min(1).max(MAX_MEDICINE_QUANTITY).default(1),
  acceptPriceBreakdown: z.boolean().refine((v) => v, {
    message: "Please review and accept the price breakdown",
  }),
  addressLabel: z.string().trim().min(1, "Give this address a label").max(40),
  addressText: z
    .string()
    .trim()
    .min(10, "Enter the full visit address (house/flat, street, locality)")
    .max(200, "Address is too long"),
  latitude: z.number({ error: "Choose the visit area above" }).min(-90).max(90),
  longitude: z.number({ error: "Choose the visit area above" }).min(-180).max(180),
  // Explicit consent is required; a plain boolean keeps form defaults (false) type-safe.
  consentToShareLocation: z.boolean().refine((v) => v, {
    message: "You must agree to share the visit address with this provider",
  }),
});
export type BookingFormValues = z.input<typeof bookingFormSchema>;
export type BookingRequest = z.output<typeof bookingFormSchema>;

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  note: z.string().max(200).optional(),
});

export const providerUpdateSchema = z.object({
  verificationStatus: z.enum(["verified", "pending", "unverified", "rejected"]).optional(),
  serviceRadiusKm: z.number().int().min(1).max(50).optional(),
  active: z.boolean().optional(),
});

export const slotUpdateSchema = z.object({
  status: z.enum(["open", "blocked"]),
});

/** The same time window on one or more days. */
export const slotCreateSchema = z.object({
  dates: z.array(z.iso.date()).min(1, "Choose at least one day").max(14, "Choose up to 14 days at a time"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a start time"),
  durationMinutes: z.number().int().min(15).max(600).default(120),
});
export type SlotCreateInput = z.output<typeof slotCreateSchema>;

export const REVIEW_COMMENT_MAX = 500;
const stars = z.number().int().min(1).max(5);

export const reviewSchema = z.object({
  rating: z.number({ error: "Choose a star rating" }).int().min(1, "Choose a star rating").max(5),
  aspects: z
    .object({
      punctuality: stars.optional(),
      communication: stars.optional(),
      courtesy: stars.optional(),
      value: stars.optional(),
    })
    .default({}),
  wouldRecommend: z.boolean().nullable().default(null),
  comment: z
    .string()
    .trim()
    .max(REVIEW_COMMENT_MAX, `Keep your review under ${REVIEW_COMMENT_MAX} characters`)
    .default(""),
});
export type ReviewInput = z.output<typeof reviewSchema>;

export const verificationReviewSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
    note: z.string().trim().max(400).default(""),
  })
  .refine((v) => v.decision === "approve" || v.note.length >= 5, {
    message: "Tell the caretaker why their application was rejected",
    path: ["note"],
  });

export const pricingRuleUpdateSchema = z
  .object({
    mode: z.enum(["fixed", "percent"]),
    value: z.number().int().min(0),
    active: z.boolean(),
    label: z.string().trim().min(1).max(60).optional(),
  })
  .refine((rule) => rule.mode !== "percent" || rule.value <= 10000, {
    message: "Percentage margin cannot exceed 100%",
    path: ["value"],
  });

export const platformConfigUpdateSchema = z.object({
  taxLabel: z.string().trim().min(1).max(20).optional(),
  taxRateBps: z.number().int().min(0).max(5000).optional(),
  taxAppliesTo: z.array(z.enum(["visit", "medicine", "procedure", "travel", "platform_fee"])).optional(),
  quoteValidityMinutes: z.number().int().min(5).max(1440).optional(),
  refundPolicy: z.string().trim().min(1).max(600).optional(),
  prescriptionRequiredForMedicine: z.boolean().optional(),
  prescriptionNote: z.string().trim().max(400).optional(),
  licensingNote: z.string().trim().max(400).optional(),
  emergencyNumber: z.string().trim().min(2).max(10).optional(),
});

export const categoryUpdateSchema = z.object({
  active: z.boolean().optional(),
  description: z.string().trim().min(10).max(300).optional(),
});

export const serviceUpdateSchema = z.object({
  basePriceMinor: z.number().int().min(0).max(10_000_000).optional(),
  active: z.boolean().optional(),
});

export const sessionSchema = z.object({
  role: z.enum(["user", "provider", "admin"]),
  providerId: z.string().max(40).optional(),
  /** Customer account to log into. Omitted = the demo customer. */
  userId: z.string().max(60).optional(),
});

const accountFields = {
  name: z.string().trim().min(2, "Enter your full name").max(60, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Email is too long")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/, "Enter a 10-digit Indian mobile number"),
};

/** Demo sign-up. Caretakers also say what they do, where they are based and which languages they speak. */
export const accountCreateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("customer"), ...accountFields }),
  z.object({
    type: z.literal("caretaker"),
    ...accountFields,
    category: categorySchema,
    gender: z.enum(["female", "male", "other"], { error: "Choose a gender" }),
    localityId: z.string().min(1, "Choose where you are based").max(40),
    languages: z
      .array(z.string().trim().min(2, "Language names need at least 2 letters").max(30))
      .min(1, "Add at least one language")
      .max(8, "Add up to 8 languages"),
    yearsExperience: z
      .number({ error: "Enter your years of experience" })
      .int("Use whole years")
      .min(0, "Years of experience can't be negative")
      .max(60, "Enter 60 years or fewer"),
  }),
]);
export type AccountCreateInput = z.output<typeof accountCreateSchema>;
