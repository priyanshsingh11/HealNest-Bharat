// Shared domain types for HealNest Bharat.
// All money values are integer minor units (paise for INR) to avoid floating-point errors.

export const CATEGORY_IDS = ["nurse", "physiotherapist", "phlebotomist", "babysitter", "caregiver"] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

/** Customer-facing home-care services. Each provider service is tagged with at most one. */
export const CARE_SERVICE_IDS = [
  "home-nursing",
  "injection-iv",
  "wound-dressing",
  "catheter-care",
  "elderly-care",
  "post-operative-care",
  "physiotherapy",
  "home-lab-collection",
] as const;
export type CareServiceId = (typeof CARE_SERVICE_IDS)[number];

/** Keeps medical, childcare and non-medical care visually and logically separate. */
export type CategoryKind = "medical" | "childcare" | "non_medical";

export type Category = {
  id: CategoryId;
  name: string;
  shortName: string;
  kind: CategoryKind;
  description: string;
  active: boolean;
};

export type Role = "user" | "provider" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
};

/**
 * A browser an account may be used from. Sign-up issues a secret to that browser and keeps only its hash
 * here, so an account can only be logged into from a device it was registered on.
 */
export type AccountDevice = {
  /** SHA-256 (hex) of the secret the browser holds. The secret itself is never stored. */
  tokenHash: string;
  userId: string;
  /** Where it was registered, e.g. "Mac · Chrome". Shown back to the account owner, never used for auth. */
  label: string;
  createdAt: string;
};

export type VerificationStatus = "verified" | "pending" | "unverified" | "rejected";
export type Gender = "female" | "male" | "other";

export type Credential = {
  label: string;
  issuer: string;
  /** Registration / licence number, masked for display. */
  reference?: string;
  verified: boolean;
};

export type GeoPoint = { latitude: number; longitude: number };

export type Qualification = { degree: string; institution: string; year: number };

/** One job a caretaker has held. Admins ring the organisation to cross-verify these. */
export type Employment = {
  organisation: string;
  role: string;
  city: string;
  /** True for the job held right now; `endYear` is null then. */
  current: boolean;
  startYear: number;
  endYear: number | null;
  /** Supervisor or HR contact who can confirm the role. Optional. */
  contactName: string;
  contactPhone: string;
};

export type ProviderProfile = {
  id: string;
  userId: string;
  name: string;
  /** Verified profile photo (a small data URL in this demo), or null to show initials. */
  photoUrl: string | null;
  category: CategoryId;
  gender: Gender;
  languages: string[];
  bio: string;
  yearsExperience: number;
  credentials: Credential[];
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  serviceRadiusKm: number;
  baseLocation: GeoPoint & { locality: string; city: string };
  travelFeeMinor: number;
  cancellationPolicy: string;
  active: boolean;
};

export type Service = {
  id: string;
  providerId: string;
  category: CategoryId;
  /** Which customer-facing care service this falls under, if any (e.g. babysitting has none). */
  careService: CareServiceId | null;
  name: string;
  description: string;
  /** Home visit fee. */
  basePriceMinor: number;
  durationMinutes: number;
  /** Provider must confirm final medicine/procedure cost before the quote is final. */
  requiresConfirmation: boolean;
  /** Estimated medicine / consumables cost the provider typically brings. */
  medicineEstimateMinor: number;
  /** Additional procedure fee (e.g. dressing, injection administration). */
  procedureFeeMinor: number;
  active: boolean;
};

/** "booked" means every place in the slot is taken. */
export type SlotStatus = "open" | "booked" | "blocked";

export type AvailabilitySlot = {
  id: string;
  providerId: string;
  startAt: string;
  endAt: string;
  status: SlotStatus;
  /** How many bookings this window can take. */
  capacity: number;
  bookedCount: number;
};

export type Address = {
  id?: string;
  userId?: string;
  label: string;
  addressText: string;
  latitude: number;
  longitude: number;
  consentToShare: boolean;
};

export const BOOKING_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "ON_THE_WAY",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type StatusEvent = {
  status: BookingStatus;
  at: string;
  by: Role;
  note?: string;
};

export type LineItemType = "visit" | "medicine" | "procedure" | "travel" | "platform_fee" | "tax";

export type QuoteLineItem = {
  id: string;
  type: LineItemType;
  label: string;
  /** Per-unit amount that goes to the provider (or the tax authority for tax rows). */
  baseAmountMinor: number;
  /** Per-unit platform margin. Always disclosed to the customer. */
  marginAmountMinor: number;
  /** Per-unit customer price: baseAmountMinor + marginAmountMinor. */
  customerAmountMinor: number;
  quantity: number;
  /** customerAmountMinor × quantity. */
  lineTotalMinor: number;
  disclosed: boolean;
  /** True when the provider must confirm the actual amount. */
  estimated: boolean;
};

export type QuoteStatus = "preview" | "estimated" | "confirmed";

export type Quote = {
  id: string;
  bookingId: string | null;
  status: QuoteStatus;
  currency: string;
  lineItems: QuoteLineItem[];
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  providerPayoutMinor: number;
  platformEarningsMinor: number;
  hasEstimates: boolean;
  createdAt: string;
  expiresAt: string;
};

export type Booking = {
  id: string;
  userId: string;
  providerId: string;
  serviceId: string;
  /** Snapshot of names so the booking stays readable if the catalogue changes. */
  providerName: string;
  serviceName: string;
  category: CategoryId;
  address: Address;
  scheduledStart: string;
  scheduledEnd: string;
  slotId: string | null;
  status: BookingStatus;
  notes: string;
  distanceKm: number;
  /** Immutable price snapshot taken at booking time. */
  quote: Quote;
  totalAmountMinor: number;
  statusHistory: StatusEvent[];
  createdAt: string;
  updatedAt: string;
};

/** Sub-ratings a customer can give alongside the overall stars. */
export const REVIEW_ASPECTS = ["punctuality", "communication", "courtesy", "value"] as const;
export type ReviewAspect = (typeof REVIEW_ASPECTS)[number];

export type Review = {
  id: string;
  /** Set when the review came from a completed booking ("verified visit"). */
  bookingId: string | null;
  userId: string;
  providerId: string;
  authorName: string;
  rating: number;
  aspects: Partial<Record<ReviewAspect, number>>;
  wouldRecommend: boolean | null;
  comment: string;
  createdAt: string;
};

export const GOVT_ID_TYPES = ["aadhaar", "pan", "voter_id", "passport", "driving_licence"] as const;
export type GovtIdType = (typeof GOVT_ID_TYPES)[number];

export const DOCUMENT_KINDS = ["photo_id", "degree", "registration", "police", "training", "other"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

/** Metadata for an uploaded document. File contents are not stored in this demo. */
export type VerificationDocument = { kind: DocumentKind; fileName: string; sizeBytes: number; contentType: string };

/** What a caretaker submits for verification. Fields that don't apply to their profession are empty. */
export type VerificationDetails = {
  fullName: string;
  phone: string;
  email: string;
  addressText: string;
  city: string;
  languages: string[];
  yearsExperience: number;
  govtIdType: GovtIdType;
  /** Only the last four characters of the government ID are kept. */
  govtIdLast4: string;
  photoUrl: string | null;
  registrationNumber: string;
  registrationCouncil: string;
  qualifications: Qualification[];
  /** Current and previous workplaces, newest first. */
  employments: Employment[];
  policeVerificationRef: string;
};

export type ApplicationStatus = "submitted" | "approved" | "rejected" | "superseded";

export type VerificationApplication = {
  id: string;
  providerId: string;
  category: CategoryId;
  status: ApplicationStatus;
  details: VerificationDetails;
  documents: VerificationDocument[];
  submittedAt: string;
  reviewedAt: string | null;
  reviewerNote: string;
};

export type PricingRuleItemType = Exclude<LineItemType, "tax">;
export type PricingMode = "fixed" | "percent";

export type PricingRule = {
  id: string;
  itemType: PricingRuleItemType;
  label: string;
  mode: PricingMode;
  /** Fixed: minor units. Percent: basis points (1500 = 15%). */
  value: number;
  active: boolean;
};

/** Country-configurable settings. Nothing about tax or regulation is hardcoded. */
export type PlatformConfig = {
  country: string;
  currency: string;
  taxLabel: string;
  /** Basis points, e.g. 1800 = 18%. */
  taxRateBps: number;
  taxAppliesTo: LineItemType[];
  quoteValidityMinutes: number;
  refundPolicy: string;
  prescriptionRequiredForMedicine: boolean;
  prescriptionNote: string;
  licensingNote: string;
  emergencyNumber: string;
};

export type AuditLogEntry = {
  id: string;
  at: string;
  actorRole: Role;
  actorId: string;
  action: string;
  entityType:
    | "booking"
    | "quote"
    | "provider"
    | "pricing_rule"
    | "config"
    | "service"
    | "category"
    | "slot"
    | "review"
    | "verification";
  entityId: string;
  details: Record<string, unknown>;
};

export type ProviderSearchResult = {
  provider: ProviderProfile;
  /** Null when the user has not shared a location yet. */
  distanceKm: number | null;
  withinRadius: boolean;
  startingPriceMinor: number;
  earliestSlot: AvailabilitySlot | null;
  services: Service[];
};
