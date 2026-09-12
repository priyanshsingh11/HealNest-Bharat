import { conflict, notFound } from "@/lib/errors";
import type { SeedData } from "@/lib/seed";
import type {
  AccountDevice,
  AuditLogEntry,
  Booking,
  CategoryId,
  PlatformConfig,
  ProviderProfile,
  Review,
  Service,
  SlotStatus,
  User,
  VerificationApplication,
} from "@/types";
import type {
  BookingFilter,
  BookingPatch,
  CareRepository,
  CategoryPatch,
  NewAuditLogEntry,
  PricingRulePatch,
  ProviderPatch,
  ServicePatch,
  SlotFilter,
  UserFilter,
  VerificationFilter,
  VerificationPatch,
} from "./types";

const clone = <T>(value: T): T => structuredClone(value);
const byStart = (a: { startAt: string }, b: { startAt: string }) => a.startAt.localeCompare(b.startAt);

/** In-memory repository, starting from the seed (settings and demo accounts). Data resets when the server restarts. */
export class MemoryRepository implements CareRepository {
  readonly kind = "memory" as const;
  private readonly state: SeedData & { auditLogs: AuditLogEntry[] };
  private auditSeq = 0;
  /** app user id → Supabase Auth user id. */
  private readonly authLinks = new Map<string, string>();
  /** Device token hash → the account it was issued for. */
  private readonly devices = new Map<string, AccountDevice>();

  constructor(seed: SeedData) {
    this.state = { ...clone(seed), auditLogs: [] };
  }

  async getUser(id: string) {
    const user = this.state.users.find((u) => u.id === id);
    return user ? clone(user) : null;
  }

  async listUsers(filter: UserFilter = {}) {
    return clone(
      this.state.users.filter(
        (u) => (!filter.role || u.role === filter.role) && (!filter.email || u.email.toLowerCase() === filter.email),
      ),
    );
  }

  async createUser(user: User) {
    if (this.state.users.some((u) => u.id === user.id)) throw conflict("That account already exists.");
    this.state.users.push(clone(user));
    return clone(user);
  }

  async linkAuthUser(userId: string, authUserId: string) {
    if (!this.state.users.some((u) => u.id === userId)) throw notFound("Account");
    for (const [id, linked] of this.authLinks) if (linked === authUserId) this.authLinks.delete(id);
    this.authLinks.set(userId, authUserId);
  }

  async deleteUser(id: string) {
    const referenced = this.state.providers.some((p) => p.userId === id) || this.state.bookings.some((b) => b.userId === id);
    if (referenced) return false;
    this.state.users = this.state.users.filter((u) => u.id !== id);
    this.authLinks.delete(id);
    for (const [hash, device] of this.devices) if (device.userId === id) this.devices.delete(hash);
    return true;
  }

  async registerDevice(device: AccountDevice) {
    this.devices.set(device.tokenHash, clone(device));
  }

  async findDeviceUser(tokenHash: string) {
    return this.devices.get(tokenHash)?.userId ?? null;
  }

  async listDevices(userId: string) {
    return clone([...this.devices.values()].filter((d) => d.userId === userId)).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async listCategories() {
    return clone(this.state.categories);
  }

  async updateCategory(id: CategoryId, patch: CategoryPatch) {
    const category = this.state.categories.find((c) => c.id === id);
    if (!category) throw notFound("Category");
    Object.assign(category, patch);
    return clone(category);
  }

  async listProviders(filter?: { category?: CategoryId }) {
    const list = this.state.providers.filter((p) => !filter?.category || p.category === filter.category);
    return clone(list);
  }

  async getProvider(id: string) {
    const provider = this.state.providers.find((p) => p.id === id);
    return provider ? clone(provider) : null;
  }

  async updateProvider(id: string, patch: ProviderPatch) {
    const provider = this.state.providers.find((p) => p.id === id);
    if (!provider) throw notFound("Provider");
    Object.assign(provider, clone(patch));
    return clone(provider);
  }

  async createProvider(provider: ProviderProfile, services: Service[]) {
    if (this.state.providers.some((p) => p.id === provider.id)) throw conflict("That provider profile already exists.");
    this.state.providers.push(clone(provider));
    this.state.services.push(...clone(services));
    return clone(provider);
  }

  async listServices(filter?: { providerId?: string; providerIds?: string[] }) {
    const ids = filter?.providerIds ? new Set(filter.providerIds) : null;
    return clone(
      this.state.services.filter(
        (s) => (!filter?.providerId || s.providerId === filter.providerId) && (!ids || ids.has(s.providerId)),
      ),
    );
  }

  async getService(id: string) {
    const service = this.state.services.find((s) => s.id === id);
    return service ? clone(service) : null;
  }

  async updateService(id: string, patch: ServicePatch) {
    const service = this.state.services.find((s) => s.id === id);
    if (!service) throw notFound("Service");
    Object.assign(service, patch);
    return clone(service);
  }

  async listSlots(filter: SlotFilter = {}) {
    const ids = filter.providerIds ? new Set(filter.providerIds) : null;
    return clone(
      this.state.slots
        .filter(
          (slot) =>
            (!filter.providerId || slot.providerId === filter.providerId) &&
            (!ids || ids.has(slot.providerId)) &&
            (!filter.from || slot.startAt >= filter.from) &&
            (!filter.status || slot.status === filter.status),
        )
        .sort(byStart),
    );
  }

  async getSlot(id: string) {
    const slot = this.state.slots.find((s) => s.id === id);
    return slot ? clone(slot) : null;
  }

  async createSlot(slot: Parameters<CareRepository["createSlot"]>[0]) {
    this.state.slots.push(clone(slot));
    return clone(slot);
  }

  async updateSlotStatus(id: string, status: SlotStatus) {
    const slot = this.state.slots.find((s) => s.id === id);
    if (!slot) throw notFound("Slot");
    slot.status = status;
    return clone(slot);
  }

  async reserveSlot(id: string) {
    const slot = this.state.slots.find((s) => s.id === id);
    if (!slot || slot.status !== "open" || slot.bookedCount >= slot.capacity) return false;
    slot.bookedCount += 1;
    if (slot.bookedCount >= slot.capacity) slot.status = "booked";
    return true;
  }

  async releaseSlot(id: string) {
    const slot = this.state.slots.find((s) => s.id === id);
    if (!slot || slot.bookedCount === 0) return;
    slot.bookedCount -= 1;
    if (slot.status === "booked") slot.status = "open";
  }

  async listReviews(providerId: string) {
    return clone(
      this.state.reviews
        .filter((r) => r.providerId === providerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  async createReview(review: Review) {
    if (review.bookingId && this.state.reviews.some((r) => r.bookingId === review.bookingId)) {
      throw conflict("This visit has already been reviewed.");
    }
    this.state.reviews.push(clone(review));
    return clone(review);
  }

  async getReviewForBooking(bookingId: string) {
    const review = this.state.reviews.find((r) => r.bookingId === bookingId);
    return review ? clone(review) : null;
  }

  async listVerificationApplications(filter: VerificationFilter = {}) {
    return clone(
      this.state.verificationApplications
        .filter((a) => (!filter.providerId || a.providerId === filter.providerId) && (!filter.status || a.status === filter.status))
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    );
  }

  async getVerificationApplication(id: string) {
    const application = this.state.verificationApplications.find((a) => a.id === id);
    return application ? clone(application) : null;
  }

  async createVerificationApplication(application: VerificationApplication) {
    this.state.verificationApplications.push(clone(application));
    return clone(application);
  }

  async updateVerificationApplication(id: string, patch: VerificationPatch) {
    const application = this.state.verificationApplications.find((a) => a.id === id);
    if (!application) throw notFound("Verification application");
    Object.assign(application, patch);
    return clone(application);
  }

  async listPricingRules() {
    return clone(this.state.pricingRules);
  }

  async updatePricingRule(id: string, patch: PricingRulePatch) {
    const rule = this.state.pricingRules.find((r) => r.id === id);
    if (!rule) throw notFound("Pricing rule");
    Object.assign(rule, patch);
    return clone(rule);
  }

  async getPlatformConfig() {
    return clone(this.state.config);
  }

  async updatePlatformConfig(patch: Partial<PlatformConfig>) {
    Object.assign(this.state.config, clone(patch));
    return clone(this.state.config);
  }

  async createBooking(booking: Booking) {
    this.state.bookings.push(clone(booking));
    return clone(booking);
  }

  async getBooking(id: string) {
    const booking = this.state.bookings.find((b) => b.id === id);
    return booking ? clone(booking) : null;
  }

  async listBookings(filter: BookingFilter = {}) {
    return clone(
      this.state.bookings
        .filter(
          (b) =>
            (!filter.userId || b.userId === filter.userId) &&
            (!filter.providerId || b.providerId === filter.providerId) &&
            (!filter.status || b.status === filter.status),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  async updateBooking(id: string, patch: BookingPatch) {
    const booking = this.state.bookings.find((b) => b.id === id);
    if (!booking) throw notFound("Booking");
    // The quote snapshot is never touched here, so historical prices stay fixed.
    Object.assign(booking, clone(patch));
    return clone(booking);
  }

  async addAuditLog(entry: NewAuditLogEntry) {
    this.auditSeq += 1;
    this.state.auditLogs.unshift({ ...clone(entry), id: `audit_${this.auditSeq}`, at: new Date().toISOString() });
    if (this.state.auditLogs.length > 500) this.state.auditLogs.length = 500;
  }

  async listAuditLogs(limit = 100) {
    return clone(this.state.auditLogs.slice(0, limit));
  }
}
