import type {
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
  Service,
  SlotStatus,
  User,
} from "@/types";

// Storage-agnostic data access. Pages, API routes and services depend only on this interface,
// so the backing store (in-memory mock data or Supabase) can be swapped without UI changes.

export type ProviderPatch = Partial<Pick<ProviderProfile, "verificationStatus" | "serviceRadiusKm" | "active">>;
export type ServicePatch = Partial<Pick<Service, "basePriceMinor" | "active">>;
export type CategoryPatch = Partial<Pick<Category, "active" | "description">>;
export type PricingRulePatch = Partial<Pick<PricingRule, "mode" | "value" | "active" | "label">>;
export type BookingPatch = Pick<Booking, "status" | "statusHistory" | "updatedAt">;
export type NewAuditLogEntry = Omit<AuditLogEntry, "id" | "at">;

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

export interface CareRepository {
  readonly kind: "memory" | "supabase";

  getUser(id: string): Promise<User | null>;

  listCategories(): Promise<Category[]>;
  updateCategory(id: CategoryId, patch: CategoryPatch): Promise<Category>;

  listProviders(filter?: { category?: CategoryId }): Promise<ProviderProfile[]>;
  getProvider(id: string): Promise<ProviderProfile | null>;
  updateProvider(id: string, patch: ProviderPatch): Promise<ProviderProfile>;

  listServices(filter?: { providerId?: string; providerIds?: string[] }): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  updateService(id: string, patch: ServicePatch): Promise<Service>;

  listSlots(filter?: SlotFilter): Promise<AvailabilitySlot[]>;
  getSlot(id: string): Promise<AvailabilitySlot | null>;
  createSlot(slot: AvailabilitySlot): Promise<AvailabilitySlot>;
  updateSlotStatus(id: string, status: SlotStatus): Promise<AvailabilitySlot>;
  /** Atomically moves an open slot to booked. Returns false if it was no longer open. */
  reserveSlot(id: string): Promise<boolean>;
  /** Returns a booked slot to open (after cancellation or decline). */
  releaseSlot(id: string): Promise<void>;

  listReviews(providerId: string): Promise<Review[]>;

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
