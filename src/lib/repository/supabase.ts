import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from "@/lib/errors";
import type { Booking, CategoryId, PlatformConfig, SlotStatus } from "@/types";
import {
  fromConfigPatch,
  fromLineItem,
  fromQuote,
  fromSlot,
  fromStatusEvent,
  toAuditLog,
  toBooking,
  toCategory,
  toConfig,
  toPricingRule,
  toProvider,
  toReview,
  toService,
  toSlot,
  toUser,
  type AuditLogRow,
  type BookingRow,
  type CategoryRow,
  type PlatformConfigRow,
  type PricingRuleRow,
  type ProviderRow,
  type ReviewRow,
  type ServiceRow,
  type SlotRow,
  type UserRow,
} from "./supabase-mappers";
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

const BOOKING_SELECT = "*, addresses(*), quotes(*, quote_line_items(*)), booking_status_events(*)";

/** Unwraps a Supabase response, throwing on error. Callers cast the untyped data to the expected row shape. */
function check(result: { data: unknown; error: { message: string } | null }, context: string): unknown {
  if (result.error) throw new Error(`Supabase ${context} failed: ${result.error.message}`);
  return result.data;
}

/**
 * Supabase (Postgres) repository. Uses a server-side client with the service-role/secret key;
 * all tables have Row Level Security enabled with no public policies, so the browser can never reach them directly.
 */
export class SupabaseRepository implements CareRepository {
  readonly kind = "supabase" as const;

  constructor(private readonly db: SupabaseClient) {}

  async getUser(id: string) {
    const row = check(await this.db.from("app_users").select("*").eq("id", id).maybeSingle(), "getUser");
    return row ? toUser(row as UserRow) : null;
  }

  async listCategories() {
    const rows = check(await this.db.from("categories").select("*").order("id"), "listCategories");
    const order = ["nurse", "doctor", "babysitter", "caregiver"];
    return (rows as CategoryRow[]).map(toCategory).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }

  async updateCategory(id: CategoryId, patch: CategoryPatch) {
    const row = check(
      await this.db.from("categories").update(patch).eq("id", id).select("*").maybeSingle(),
      "updateCategory",
    );
    if (!row) throw notFound("Category");
    return toCategory(row as CategoryRow);
  }

  async listProviders(filter?: { category?: CategoryId }) {
    let query = this.db.from("provider_profiles").select("*").order("id");
    if (filter?.category) query = query.eq("category", filter.category);
    return (check(await query, "listProviders") as ProviderRow[]).map(toProvider);
  }

  async getProvider(id: string) {
    const row = check(await this.db.from("provider_profiles").select("*").eq("id", id).maybeSingle(), "getProvider");
    return row ? toProvider(row as ProviderRow) : null;
  }

  async updateProvider(id: string, patch: ProviderPatch) {
    const update: Partial<ProviderRow> = {};
    if (patch.verificationStatus !== undefined) update.verification_status = patch.verificationStatus;
    if (patch.serviceRadiusKm !== undefined) update.service_radius_km = patch.serviceRadiusKm;
    if (patch.active !== undefined) update.active = patch.active;
    const row = check(
      await this.db.from("provider_profiles").update(update).eq("id", id).select("*").maybeSingle(),
      "updateProvider",
    );
    if (!row) throw notFound("Provider");
    return toProvider(row as ProviderRow);
  }

  async listServices(filter?: { providerId?: string; providerIds?: string[] }) {
    let query = this.db.from("services").select("*").order("id");
    if (filter?.providerId) query = query.eq("provider_id", filter.providerId);
    if (filter?.providerIds) query = query.in("provider_id", filter.providerIds);
    return (check(await query, "listServices") as ServiceRow[]).map(toService);
  }

  async getService(id: string) {
    const row = check(await this.db.from("services").select("*").eq("id", id).maybeSingle(), "getService");
    return row ? toService(row as ServiceRow) : null;
  }

  async updateService(id: string, patch: ServicePatch) {
    const update: Partial<ServiceRow> = {};
    if (patch.basePriceMinor !== undefined) update.base_price_minor = patch.basePriceMinor;
    if (patch.active !== undefined) update.active = patch.active;
    const row = check(await this.db.from("services").update(update).eq("id", id).select("*").maybeSingle(), "updateService");
    if (!row) throw notFound("Service");
    return toService(row as ServiceRow);
  }

  async listSlots(filter: SlotFilter = {}) {
    let query = this.db.from("availability_slots").select("*").order("start_at");
    if (filter.providerId) query = query.eq("provider_id", filter.providerId);
    if (filter.providerIds) query = query.in("provider_id", filter.providerIds);
    if (filter.from) query = query.gte("start_at", filter.from);
    if (filter.status) query = query.eq("status", filter.status);
    return (check(await query, "listSlots") as SlotRow[]).map(toSlot);
  }

  async getSlot(id: string) {
    const row = check(await this.db.from("availability_slots").select("*").eq("id", id).maybeSingle(), "getSlot");
    return row ? toSlot(row as SlotRow) : null;
  }

  async createSlot(slot: Parameters<CareRepository["createSlot"]>[0]) {
    const row = check(await this.db.from("availability_slots").insert(fromSlot(slot)).select("*").single(), "createSlot");
    return toSlot(row as SlotRow);
  }

  async updateSlotStatus(id: string, status: SlotStatus) {
    const row = check(
      await this.db.from("availability_slots").update({ status }).eq("id", id).select("*").maybeSingle(),
      "updateSlotStatus",
    );
    if (!row) throw notFound("Slot");
    return toSlot(row as SlotRow);
  }

  async reserveSlot(id: string) {
    // Conditional update: only one concurrent request can flip an open slot to booked.
    const rows = check(
      await this.db.from("availability_slots").update({ status: "booked" }).eq("id", id).eq("status", "open").select("id"),
      "reserveSlot",
    );
    return (rows as unknown[]).length === 1;
  }

  async releaseSlot(id: string) {
    check(
      await this.db.from("availability_slots").update({ status: "open" }).eq("id", id).eq("status", "booked"),
      "releaseSlot",
    );
  }

  async listReviews(providerId: string) {
    const rows = check(
      await this.db.from("reviews").select("*").eq("provider_id", providerId).order("created_at", { ascending: false }),
      "listReviews",
    );
    return (rows as ReviewRow[]).map(toReview);
  }

  async listPricingRules() {
    const rows = check(await this.db.from("pricing_rules").select("*").order("id"), "listPricingRules");
    return (rows as PricingRuleRow[]).map(toPricingRule);
  }

  async updatePricingRule(id: string, patch: PricingRulePatch) {
    const row = check(
      await this.db.from("pricing_rules").update(patch).eq("id", id).select("*").maybeSingle(),
      "updatePricingRule",
    );
    if (!row) throw notFound("Pricing rule");
    return toPricingRule(row as PricingRuleRow);
  }

  async getPlatformConfig() {
    const row = check(await this.db.from("platform_config").select("*").eq("id", 1).maybeSingle(), "getPlatformConfig");
    if (!row) throw new Error("platform_config row is missing — run `npm run db:seed`");
    return toConfig(row as PlatformConfigRow);
  }

  async updatePlatformConfig(patch: Partial<PlatformConfig>) {
    const row = check(
      await this.db.from("platform_config").update(fromConfigPatch(patch)).eq("id", 1).select("*").single(),
      "updatePlatformConfig",
    );
    return toConfig(row as PlatformConfigRow);
  }

  async createBooking(booking: Booking) {
    const addressId = `addr_${booking.id}`;
    check(
      await this.db.from("addresses").insert({
        id: addressId,
        user_id: booking.userId,
        label: booking.address.label,
        address_text: booking.address.addressText,
        latitude: booking.address.latitude,
        longitude: booking.address.longitude,
        consent_to_share: booking.address.consentToShare,
      }),
      "createBooking.address",
    );

    try {
      check(
        await this.db.from("bookings").insert({
          id: booking.id,
          user_id: booking.userId,
          provider_id: booking.providerId,
          service_id: booking.serviceId,
          address_id: addressId,
          slot_id: booking.slotId,
          provider_name: booking.providerName,
          service_name: booking.serviceName,
          category: booking.category,
          scheduled_start: booking.scheduledStart,
          scheduled_end: booking.scheduledEnd,
          status: booking.status,
          notes: booking.notes,
          distance_km: booking.distanceKm,
          total_amount_minor: booking.totalAmountMinor,
          created_at: booking.createdAt,
          updated_at: booking.updatedAt,
        }),
        "createBooking.booking",
      );
      check(await this.db.from("quotes").insert(fromQuote(booking.quote)), "createBooking.quote");
      check(
        await this.db
          .from("quote_line_items")
          .insert(booking.quote.lineItems.map((item, i) => fromLineItem(booking.quote.id, item, i))),
        "createBooking.lineItems",
      );
      check(
        await this.db.from("booking_status_events").insert(booking.statusHistory.map((e) => fromStatusEvent(booking.id, e))),
        "createBooking.statusEvents",
      );
    } catch (error) {
      // Best-effort compensation; quotes, line items and events cascade from the booking.
      await this.db.from("bookings").delete().eq("id", booking.id);
      await this.db.from("addresses").delete().eq("id", addressId);
      throw error;
    }

    const created = await this.getBooking(booking.id);
    if (!created) throw new Error("Booking was not persisted");
    return created;
  }

  async getBooking(id: string) {
    const row = check(await this.db.from("bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle(), "getBooking");
    return row ? toBooking(row as BookingRow) : null;
  }

  async listBookings(filter: BookingFilter = {}) {
    let query = this.db.from("bookings").select(BOOKING_SELECT).order("created_at", { ascending: false });
    if (filter.userId) query = query.eq("user_id", filter.userId);
    if (filter.providerId) query = query.eq("provider_id", filter.providerId);
    if (filter.status) query = query.eq("status", filter.status);
    return (check(await query, "listBookings") as BookingRow[]).map(toBooking);
  }

  async updateBooking(id: string, patch: BookingPatch) {
    const existing = await this.getBooking(id);
    if (!existing) throw notFound("Booking");
    check(
      await this.db.from("bookings").update({ status: patch.status, updated_at: patch.updatedAt }).eq("id", id),
      "updateBooking",
    );
    const newEvents = patch.statusHistory.slice(existing.statusHistory.length);
    if (newEvents.length) {
      check(
        await this.db.from("booking_status_events").insert(newEvents.map((e) => fromStatusEvent(id, e))),
        "updateBooking.events",
      );
    }
    const updated = await this.getBooking(id);
    if (!updated) throw notFound("Booking");
    return updated;
  }

  async addAuditLog(entry: NewAuditLogEntry) {
    check(
      await this.db.from("audit_logs").insert({
        actor_role: entry.actorRole,
        actor_id: entry.actorId,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        details: entry.details,
      }),
      "addAuditLog",
    );
  }

  async listAuditLogs(limit = 100) {
    const rows = check(
      await this.db.from("audit_logs").select("*").order("at", { ascending: false }).limit(limit),
      "listAuditLogs",
    );
    return (rows as AuditLogRow[]).map(toAuditLog);
  }
}
