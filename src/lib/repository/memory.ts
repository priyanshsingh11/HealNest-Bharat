import { notFound } from "@/lib/errors";
import type { SeedData } from "@/lib/mock-data";
import type { AuditLogEntry, Booking, CategoryId, PlatformConfig, SlotStatus } from "@/types";
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
} from "./types";

const clone = <T>(value: T): T => structuredClone(value);
const byStart = (a: { startAt: string }, b: { startAt: string }) => a.startAt.localeCompare(b.startAt);

/** In-memory repository backed by seeded mock data. Data resets when the server restarts. */
export class MemoryRepository implements CareRepository {
  readonly kind = "memory" as const;
  private readonly state: SeedData & { auditLogs: AuditLogEntry[] };
  private auditSeq = 0;

  constructor(seed: SeedData) {
    this.state = { ...clone(seed), auditLogs: [] };
  }

  async getUser(id: string) {
    const user = this.state.users.find((u) => u.id === id);
    return user ? clone(user) : null;
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
    Object.assign(provider, patch);
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
    if (!slot || slot.status !== "open") return false;
    slot.status = "booked";
    return true;
  }

  async releaseSlot(id: string) {
    const slot = this.state.slots.find((s) => s.id === id);
    if (slot && slot.status === "booked") slot.status = "open";
  }

  async listReviews(providerId: string) {
    return clone(
      this.state.reviews
        .filter((r) => r.providerId === providerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
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
