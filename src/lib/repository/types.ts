import type {
  ApplicationStatus,
  AuditLogEntry,
  AvailabilitySlot,
  Booking,
  BookingStatus,
  Category,
  CategoryId,
  PlatformConfig,
  PricingRule,
  ProviderProfile,
  Review,
  Role,
  Service,
  SlotStatus,
  User,
  VerificationApplication,
} from "@/types";

// Storage-agnostic data access. Pages, API routes and services depend only on this interface,
// so the backing store (in-memory or Supabase) can be swapped without UI changes.

export type ProviderPatch = Partial<
  Pick<
    ProviderProfile,
    | "verificationStatus"
    | "serviceRadiusKm"
    | "active"
    | "name"
    | "photoUrl"
    | "languages"
    | "yearsExperience"
    | "credentials"
    | "rating"
    | "reviewCount"
  >
>;
export type ServicePatch = Partial<Pick<Service, "basePriceMinor" | "active">>;
export type CategoryPatch = Partial<Pick<Category, "active" | "description">>;
export type PricingRulePatch = Partial<Pick<PricingRule, "mode" | "value" | "active" | "label">>;
export type BookingPatch = Pick<Booking, "status" | "statusHistory" | "updatedAt">;
export type VerificationPatch = Pick<VerificationApplication, "status" | "reviewedAt" | "reviewerNote">;
export type NewAuditLogEntry = Omit<AuditLogEntry, "id" | "at">;

export type UserFilter = {
  role?: Role;
  /** Exact match on the lower-cased email. */
  email?: string;
};

export type SlotFilter = {
  providerId?: string;
  providerIds?: string[];
  /** Only slots starting at or after this ISO instant. */
  from?: string;
  status?: SlotStatus;
};

export type BookingFilter = {
  userId?: string;
  providerId?: string;
  status?: BookingStatus;
};

export type VerificationFilter = {
  providerId?: string;
  status?: ApplicationStatus;
};

export interface CareRepository {
  readonly kind: "memory" | "supabase";

  getUser(id: string): Promise<User | null>;
  listUsers(filter?: UserFilter): Promise<User[]>;
  /** Throws a 409 if the id is taken. */
  createUser(user: User): Promise<User>;
  /** Links the app user to a login (Supabase Auth user id), moving the link off any other app user. */
  linkAuthUser(userId: string, authUserId: string): Promise<void>;
  /** The app user linked to a login, or null. */
  findUserByAuthId(authUserId: string): Promise<User | null>;
  /** Returns false (and keeps the row) if something still references the user. */
  deleteUser(id: string): Promise<boolean>;

  listCategories(): Promise<Category[]>;
  updateCategory(id: CategoryId, patch: CategoryPatch): Promise<Category>;

  listProviders(filter?: { category?: CategoryId }): Promise<ProviderProfile[]>;
  getProvider(id: string): Promise<ProviderProfile | null>;
  updateProvider(id: string, patch: ProviderPatch): Promise<ProviderProfile>;
  /** Creates a provider profile together with its services. Throws a 409 if the id is taken. */
  createProvider(provider: ProviderProfile, services: Service[]): Promise<ProviderProfile>;

  listServices(filter?: { providerId?: string; providerIds?: string[] }): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  updateService(id: string, patch: ServicePatch): Promise<Service>;

  listSlots(filter?: SlotFilter): Promise<AvailabilitySlot[]>;
  getSlot(id: string): Promise<AvailabilitySlot | null>;
  createSlot(slot: AvailabilitySlot): Promise<AvailabilitySlot>;
  updateSlotStatus(id: string, status: SlotStatus): Promise<AvailabilitySlot>;
  /** Atomically takes one place in an open slot, marking it booked once full. Returns false if no place was left. */
  reserveSlot(id: string): Promise<boolean>;
  /** Gives one place back (after cancellation or decline), reopening a full slot. */
  releaseSlot(id: string): Promise<void>;

  /** Newest first. */
  listReviews(providerId: string): Promise<Review[]>;
  /** Throws a 409 if the booking already has a review. */
  createReview(review: Review): Promise<Review>;
  getReviewForBooking(bookingId: string): Promise<Review | null>;

  /** Newest first. */
  listVerificationApplications(filter?: VerificationFilter): Promise<VerificationApplication[]>;
  getVerificationApplication(id: string): Promise<VerificationApplication | null>;
  createVerificationApplication(application: VerificationApplication): Promise<VerificationApplication>;
  updateVerificationApplication(id: string, patch: VerificationPatch): Promise<VerificationApplication>;

  listPricingRules(): Promise<PricingRule[]>;
  updatePricingRule(id: string, patch: PricingRulePatch): Promise<PricingRule>;

  getPlatformConfig(): Promise<PlatformConfig>;
  updatePlatformConfig(patch: Partial<PlatformConfig>): Promise<PlatformConfig>;

  createBooking(booking: Booking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | null>;
  listBookings(filter?: BookingFilter): Promise<Booking[]>;
  updateBooking(id: string, patch: BookingPatch): Promise<Booking>;

  addAuditLog(entry: NewAuditLogEntry): Promise<void>;
  listAuditLogs(limit?: number): Promise<AuditLogEntry[]>;
}
