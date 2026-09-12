import type { SupabaseClient } from "@supabase/supabase-js";
import { conflict, notFound } from "@/lib/errors";
import {
  CATEGORY_IDS,
  type AccountDevice,
  type Booking,
  type CategoryId,
  type PlatformConfig,
  type ProviderProfile,
  type Review,
  type Service,
  type SlotStatus,
  type User,
  type VerificationApplication,
} from "@/types";
import {
  fromConfigPatch,
  fromLineItem,
  fromProvider,
  fromQuote,
  fromReview,
  fromService,
  fromSlot,
  fromStatusEvent,
  fromUser,
  fromVerification,
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
  toVerification,
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
  type VerificationRow,
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
  UserFilter,
  VerificationFilter,
  VerificationPatch,
} from "./types";

const BOOKING_SELECT = "*, addresses(*), quotes(*, quote_line_items(*)), booking_status_events(*)";

/** Compare-and-swap retries for slot place counting before giving up. */
const SLOT_CAS_ATTEMPTS = 3;

/**
 * Rows for categories the app no longer offers (e.g. doctors in a database that hasn't run the
 * remove_doctors migration yet) are skipped, so the pages never see a category they can't render.
 */
const isKnownCategory = (id: string) => (CATEGORY_IDS as readonly string[]).includes(id);

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

  async listUsers(filter: UserFilter = {}) {
    let query = this.db.from("app_users").select("*").order("created_at").order("id");
    if (filter.role) query = query.eq("role", filter.role);
    if (filter.email) query = query.eq("email", filter.email);
    return (check(await query, "listUsers") as UserRow[]).map(toUser);
  }

  async createUser(user: User) {
    const result = await this.db.from("app_users").insert(fromUser(user)).select("*").single();
    if (result.error?.code === "23505") throw conflict("That account already exists.");
    return toUser(check(result, "createUser") as UserRow);
  }

  async linkAuthUser(userId: string, authUserId: string) {
    // auth_user_id is unique: free it from any other row first (e.g. the one the sign-up trigger made).
    check(
      await this.db.from("app_users").update({ auth_user_id: null }).eq("auth_user_id", authUserId).neq("id", userId),
      "linkAuthUser",
    );
    const row = check(
      await this.db.from("app_users").update({ auth_user_id: authUserId }).eq("id", userId).select("id").maybeSingle(),
      "linkAuthUser",
    );
    if (!row) throw notFound("Account");
  }

  async deleteUser(id: string) {
    const result = await this.db.from("app_users").delete().eq("id", id);
    // Foreign-key violation: bookings, addresses or a profile still point at this user.
    if (result.error?.code === "23503") return false;
    check(result, "deleteUser");
    return true;
  }

  async registerDevice(device: AccountDevice) {
    check(
      await this.db.from("account_devices").upsert(
        {
          token_hash: device.tokenHash,
          user_id: device.userId,
          label: device.label,
          created_at: device.createdAt,
        },
        { onConflict: "token_hash" },
      ),
      "registerDevice",
    );
  }

  async findDeviceUser(tokenHash: string) {
    const row = check(
      await this.db.from("account_devices").select("user_id").eq("token_hash", tokenHash).maybeSingle(),
      "findDeviceUser",
    ) as { user_id: string } | null;
    return row?.user_id ?? null;
  }

  async listDevices(userId: string) {
    const rows = check(
      await this.db.from("account_devices").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      "listDevices",
    ) as { token_hash: string; user_id: string; label: string; created_at: string }[];
    return rows.map((r) => ({ tokenHash: r.token_hash, userId: r.user_id, label: r.label, createdAt: r.created_at }));
  }

  async listCategories() {
    const rows = check(await this.db.from("categories").select("*").order("id"), "listCategories");
    const order = ["nurse", "babysitter", "caregiver"];
    return (rows as CategoryRow[])
      .filter((r) => isKnownCategory(r.id))
      .map(toCategory)
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
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
    return (check(await query, "listProviders") as ProviderRow[]).filter((r) => isKnownCategory(r.category)).map(toProvider);
  }

  async getProvider(id: string) {
    const row = check(await this.db.from("provider_profiles").select("*").eq("id", id).maybeSingle(), "getProvider") as ProviderRow | null;
    return row && isKnownCategory(row.category) ? toProvider(row) : null;
  }

  async updateProvider(id: string, patch: ProviderPatch) {
    const update: Partial<ProviderRow> = {};
    if (patch.verificationStatus !== undefined) update.verification_status = patch.verificationStatus;
    if (patch.serviceRadiusKm !== undefined) update.service_radius_km = patch.serviceRadiusKm;
    if (patch.active !== undefined) update.active = patch.active;
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.photoUrl !== undefined) update.photo_url = patch.photoUrl;
    if (patch.languages !== undefined) update.languages = patch.languages;
    if (patch.yearsExperience !== undefined) update.years_experience = patch.yearsExperience;
    if (patch.credentials !== undefined) update.credentials = patch.credentials;
    if (patch.rating !== undefined) update.rating = patch.rating;
    if (patch.reviewCount !== undefined) update.review_count = patch.reviewCount;
    const row = check(
      await this.db.from("provider_profiles").update(update).eq("id", id).select("*").maybeSingle(),
      "updateProvider",
    );
    if (!row) throw notFound("Provider");
    return toProvider(row as ProviderRow);
  }

  async createProvider(provider: ProviderProfile, services: Service[]) {
    const result = await this.db.from("provider_profiles").insert(fromProvider(provider)).select("*").single();
    if (result.error?.code === "23505") throw conflict("That provider profile already exists.");
    const row = check(result, "createProvider") as ProviderRow;
    if (services.length) {
      const inserted = await this.db.from("services").insert(services.map(fromService));
      if (inserted.error) {
        // Best-effort compensation, as in createBooking.
        await this.db.from("provider_profiles").delete().eq("id", provider.id);
        check(inserted, "createProvider.services");
      }
    }
    return toProvider(row);
  }

  async listServices(filter?: { providerId?: string; providerIds?: string[] }) {
    let query = this.db.from("services").select("*").order("id");
    if (filter?.providerId) query = query.eq("provider_id", filter.providerId);
    if (filter?.providerIds) query = query.in("provider_id", filter.providerIds);
    return (check(await query, "listServices") as ServiceRow[]).filter((r) => isKnownCategory(r.category)).map(toService);
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
    // Compare-and-swap on booked_count: the update only applies if nobody took a place since we read it,
    // so concurrent requests can never overfill a slot (a CHECK constraint also enforces booked_count <= capacity).
    for (let attempt = 0; attempt < SLOT_CAS_ATTEMPTS; attempt++) {
      const slot = await this.getSlot(id);
      if (!slot || slot.status !== "open" || slot.bookedCount >= slot.capacity) return false;
      const bookedCount = slot.bookedCount + 1;
      const rows = check(
        await this.db
          .from("availability_slots")
          .update({ booked_count: bookedCount, status: bookedCount >= slot.capacity ? "booked" : "open" })
          .eq("id", id)
          .eq("status", "open")
          .eq("booked_count", slot.bookedCount)
          .select("id"),
        "reserveSlot",
      );
      if ((rows as unknown[]).length === 1) return true;
    }
    return false;
  }

  async releaseSlot(id: string) {
    for (let attempt = 0; attempt < SLOT_CAS_ATTEMPTS; attempt++) {
      const slot = await this.getSlot(id);
      if (!slot || slot.bookedCount === 0) return;
      const rows = check(
        await this.db
          .from("availability_slots")
          .update({ booked_count: slot.bookedCount - 1, status: slot.status === "booked" ? "open" : slot.status })
          .eq("id", id)
          .eq("booked_count", slot.bookedCount)
          .select("id"),
        "releaseSlot",
      );
      if ((rows as unknown[]).length === 1) return;
    }
    throw new Error(`Could not release a place in slot ${id}`);
  }

  async listReviews(providerId: string) {
    const rows = check(
      await this.db.from("reviews").select("*").eq("provider_id", providerId).order("created_at", { ascending: false }),
      "listReviews",
    );
    return (rows as ReviewRow[]).map(toReview);
  }

  async createReview(review: Review) {
    const result = await this.db.from("reviews").insert(fromReview(review)).select("*").single();
    // 23505 = unique_violation on reviews_booking_unique: one review per booking.
    if (result.error?.code === "23505") throw conflict("This visit has already been reviewed.");
    return toReview(check(result, "createReview") as ReviewRow);
  }

  async getReviewForBooking(bookingId: string) {
    const row = check(
      await this.db.from("reviews").select("*").eq("booking_id", bookingId).maybeSingle(),
      "getReviewForBooking",
    );
    return row ? toReview(row as ReviewRow) : null;
  }

  async listVerificationApplications(filter: VerificationFilter = {}) {
    let query = this.db.from("verification_applications").select("*").order("submitted_at", { ascending: false });
    if (filter.providerId) query = query.eq("provider_id", filter.providerId);
    if (filter.status) query = query.eq("status", filter.status);
    return (check(await query, "listVerificationApplications") as VerificationRow[])
      .filter((r) => isKnownCategory(r.category))
      .map(toVerification);
  }

  async getVerificationApplication(id: string) {
    const row = check(
      await this.db.from("verification_applications").select("*").eq("id", id).maybeSingle(),
      "getVerificationApplication",
    );
    return row ? toVerification(row as VerificationRow) : null;
  }

  async createVerificationApplication(application: VerificationApplication) {
    const row = check(
      await this.db.from("verification_applications").insert(fromVerification(application)).select("*").single(),
      "createVerificationApplication",
    );
    return toVerification(row as VerificationRow);
  }

  async updateVerificationApplication(id: string, patch: VerificationPatch) {
    const row = check(
      await this.db
        .from("verification_applications")
        .update({ status: patch.status, reviewed_at: patch.reviewedAt, reviewer_note: patch.reviewerNote })
        .eq("id", id)
        .select("*")
        .maybeSingle(),
      "updateVerificationApplication",
    );
    if (!row) throw notFound("Verification application");
    return toVerification(row as VerificationRow);
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
