import type {
  Address,
  AuditLogEntry,
  AvailabilitySlot,
  Booking,
  Category,
  PlatformConfig,
  PricingRule,
  ProviderProfile,
  Quote,
  QuoteLineItem,
  Review,
  Service,
  StatusEvent,
  User,
  VerificationApplication,
} from "@/types";

// Row shapes for the Supabase (Postgres) schema in supabase/migrations, and camelCase ↔ snake_case mapping.
// Kept free of `server-only` so the seed script can import it.

export type CategoryRow = {
  id: string;
  name: string;
  short_name: string;
  kind: string;
  description: string;
  active: boolean;
};

export type UserRow = { id: string; name: string; email: string; phone: string; role: string; created_at: string };

export type ProviderRow = {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  category: string;
  gender: string;
  languages: string[];
  bio: string;
  years_experience: number;
  credentials: ProviderProfile["credentials"];
  verification_status: string;
  rating: number | string;
  review_count: number;
  service_radius_km: number;
  latitude: number;
  longitude: number;
  locality: string;
  city: string;
  travel_fee_minor: number;
  cancellation_policy: string;
  active: boolean;
};

export type ServiceRow = {
  id: string;
  provider_id: string;
  category: string;
  care_service: string | null;
  name: string;
  description: string;
  base_price_minor: number;
  duration_minutes: number;
  requires_confirmation: boolean;
  medicine_estimate_minor: number;
  procedure_fee_minor: number;
  active: boolean;
};

export type SlotRow = {
  id: string;
  provider_id: string;
  start_at: string;
  end_at: string;
  status: string;
  capacity: number;
  booked_count: number;
};

export type ReviewRow = {
  id: string;
  booking_id: string | null;
  user_id: string;
  provider_id: string;
  author_name: string;
  rating: number;
  aspects: Review["aspects"] | null;
  would_recommend: boolean | null;
  comment: string;
  created_at: string;
};

export type VerificationRow = {
  id: string;
  provider_id: string;
  category: string;
  status: string;
  details: VerificationApplication["details"];
  documents: VerificationApplication["documents"];
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_note: string;
};

export type PricingRuleRow = { id: string; item_type: string; label: string; mode: string; value: number; active: boolean };

export type PlatformConfigRow = {
  id: number;
  country: string;
  currency: string;
  tax_label: string;
  tax_rate_bps: number;
  tax_applies_to: string[];
  quote_validity_minutes: number;
  refund_policy: string;
  prescription_required_for_medicine: boolean;
  prescription_note: string;
  licensing_note: string;
  emergency_number: string;
};

export type AddressRow = {
  id: string;
  user_id: string;
  label: string;
  address_text: string;
  latitude: number;
  longitude: number;
  consent_to_share: boolean;
};

export type LineItemRow = {
  id: string;
  quote_id: string;
  position: number;
  type: string;
  label: string;
  base_amount_minor: number;
  margin_amount_minor: number;
  customer_amount_minor: number;
  quantity: number;
  line_total_minor: number;
  disclosed: boolean;
  estimated: boolean;
};

export type QuoteRow = {
  id: string;
  booking_id: string | null;
  status: string;
  currency: string;
  subtotal_minor: number;
  tax_minor: number;
  total_minor: number;
  provider_payout_minor: number;
  platform_earnings_minor: number;
  has_estimates: boolean;
  created_at: string;
  expires_at: string;
  quote_line_items?: LineItemRow[];
};

export type StatusEventRow = { id?: number; booking_id: string; status: string; at: string; by_role: string; note: string | null };

export type BookingRow = {
  id: string;
  user_id: string;
  provider_id: string;
  service_id: string;
  address_id: string;
  slot_id: string | null;
  provider_name: string;
  service_name: string;
  category: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  notes: string;
  distance_km: number | string;
  total_amount_minor: number;
  created_at: string;
  updated_at: string;
  addresses?: AddressRow | null;
  quotes?: QuoteRow[] | QuoteRow | null;
  booking_status_events?: StatusEventRow[];
};

export type AuditLogRow = {
  id: number | string;
  at: string;
  actor_role: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
};

export const toCategory = (r: CategoryRow): Category => ({
  id: r.id as Category["id"],
  name: r.name,
  shortName: r.short_name,
  kind: r.kind as Category["kind"],
  description: r.description,
  active: r.active,
});

export const fromCategory = (c: Category): CategoryRow => ({
  id: c.id,
  name: c.name,
  short_name: c.shortName,
  kind: c.kind,
  description: c.description,
  active: c.active,
});

export const toUser = (r: UserRow): User => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  role: r.role as User["role"],
  createdAt: r.created_at,
});

export const fromUser = (u: User): UserRow => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  created_at: u.createdAt,
});

export const toProvider = (r: ProviderRow): ProviderProfile => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  photoUrl: r.photo_url ?? null,
  category: r.category as ProviderProfile["category"],
  gender: r.gender as ProviderProfile["gender"],
  languages: r.languages ?? [],
  bio: r.bio,
  yearsExperience: r.years_experience,
  credentials: r.credentials ?? [],
  verificationStatus: r.verification_status as ProviderProfile["verificationStatus"],
  rating: Number(r.rating),
  reviewCount: r.review_count,
  serviceRadiusKm: r.service_radius_km,
  baseLocation: { latitude: r.latitude, longitude: r.longitude, locality: r.locality, city: r.city },
  travelFeeMinor: r.travel_fee_minor,
  cancellationPolicy: r.cancellation_policy,
  active: r.active,
});

export const fromProvider = (p: ProviderProfile): ProviderRow => ({
  id: p.id,
  user_id: p.userId,
  name: p.name,
  photo_url: p.photoUrl,
  category: p.category,
  gender: p.gender,
  languages: p.languages,
  bio: p.bio,
  years_experience: p.yearsExperience,
  credentials: p.credentials,
  verification_status: p.verificationStatus,
  rating: p.rating,
  review_count: p.reviewCount,
  service_radius_km: p.serviceRadiusKm,
  latitude: p.baseLocation.latitude,
  longitude: p.baseLocation.longitude,
  locality: p.baseLocation.locality,
  city: p.baseLocation.city,
  travel_fee_minor: p.travelFeeMinor,
  cancellation_policy: p.cancellationPolicy,
  active: p.active,
});

export const toService = (r: ServiceRow): Service => ({
  id: r.id,
  providerId: r.provider_id,
  category: r.category as Service["category"],
  careService: (r.care_service ?? null) as Service["careService"],
  name: r.name,
  description: r.description,
  basePriceMinor: r.base_price_minor,
  durationMinutes: r.duration_minutes,
  requiresConfirmation: r.requires_confirmation,
  medicineEstimateMinor: r.medicine_estimate_minor,
  procedureFeeMinor: r.procedure_fee_minor,
  active: r.active,
});

export const fromService = (s: Service): ServiceRow => ({
  id: s.id,
  provider_id: s.providerId,
  category: s.category,
  care_service: s.careService,
  name: s.name,
  description: s.description,
  base_price_minor: s.basePriceMinor,
  duration_minutes: s.durationMinutes,
  requires_confirmation: s.requiresConfirmation,
  medicine_estimate_minor: s.medicineEstimateMinor,
  procedure_fee_minor: s.procedureFeeMinor,
  active: s.active,
});

export const toSlot = (r: SlotRow): AvailabilitySlot => ({
  id: r.id,
  providerId: r.provider_id,
  startAt: new Date(r.start_at).toISOString(),
  endAt: new Date(r.end_at).toISOString(),
  status: r.status as AvailabilitySlot["status"],
  capacity: r.capacity ?? 1,
  bookedCount: r.booked_count ?? 0,
});

export const fromSlot = (s: AvailabilitySlot): SlotRow => ({
  id: s.id,
  provider_id: s.providerId,
  start_at: s.startAt,
  end_at: s.endAt,
  status: s.status,
  capacity: s.capacity,
  booked_count: s.bookedCount,
});

export const toReview = (r: ReviewRow): Review => ({
  id: r.id,
  bookingId: r.booking_id,
  userId: r.user_id,
  providerId: r.provider_id,
  authorName: r.author_name,
  rating: r.rating,
  aspects: r.aspects ?? {},
  wouldRecommend: r.would_recommend ?? null,
  comment: r.comment,
  createdAt: new Date(r.created_at).toISOString(),
});

export const fromReview = (r: Review): ReviewRow => ({
  id: r.id,
  booking_id: r.bookingId,
  user_id: r.userId,
  provider_id: r.providerId,
  author_name: r.authorName,
  rating: r.rating,
  aspects: r.aspects,
  would_recommend: r.wouldRecommend,
  comment: r.comment,
  created_at: r.createdAt,
});

export const toVerification = (r: VerificationRow): VerificationApplication => ({
  id: r.id,
  providerId: r.provider_id,
  category: r.category as VerificationApplication["category"],
  status: r.status as VerificationApplication["status"],
  details: r.details,
  documents: r.documents ?? [],
  submittedAt: new Date(r.submitted_at).toISOString(),
  reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
  reviewerNote: r.reviewer_note,
});

export const fromVerification = (a: VerificationApplication): VerificationRow => ({
  id: a.id,
  provider_id: a.providerId,
  category: a.category,
  status: a.status,
  details: a.details,
  documents: a.documents,
  submitted_at: a.submittedAt,
  reviewed_at: a.reviewedAt,
  reviewer_note: a.reviewerNote,
});

export const toPricingRule = (r: PricingRuleRow): PricingRule => ({
  id: r.id,
  itemType: r.item_type as PricingRule["itemType"],
  label: r.label,
  mode: r.mode as PricingRule["mode"],
  value: r.value,
  active: r.active,
});

export const fromPricingRule = (r: PricingRule): PricingRuleRow => ({
  id: r.id,
  item_type: r.itemType,
  label: r.label,
  mode: r.mode,
  value: r.value,
  active: r.active,
});

export const toConfig = (r: PlatformConfigRow): PlatformConfig => ({
  country: r.country,
  currency: r.currency,
  taxLabel: r.tax_label,
  taxRateBps: r.tax_rate_bps,
  taxAppliesTo: (r.tax_applies_to ?? []) as PlatformConfig["taxAppliesTo"],
  quoteValidityMinutes: r.quote_validity_minutes,
  refundPolicy: r.refund_policy,
  prescriptionRequiredForMedicine: r.prescription_required_for_medicine,
  prescriptionNote: r.prescription_note,
  licensingNote: r.licensing_note,
  emergencyNumber: r.emergency_number,
});

export const fromConfigPatch = (c: Partial<PlatformConfig>): Partial<PlatformConfigRow> => {
  const row: Partial<PlatformConfigRow> = {};
  if (c.country !== undefined) row.country = c.country;
  if (c.currency !== undefined) row.currency = c.currency;
  if (c.taxLabel !== undefined) row.tax_label = c.taxLabel;
  if (c.taxRateBps !== undefined) row.tax_rate_bps = c.taxRateBps;
  if (c.taxAppliesTo !== undefined) row.tax_applies_to = c.taxAppliesTo;
  if (c.quoteValidityMinutes !== undefined) row.quote_validity_minutes = c.quoteValidityMinutes;
  if (c.refundPolicy !== undefined) row.refund_policy = c.refundPolicy;
  if (c.prescriptionRequiredForMedicine !== undefined) row.prescription_required_for_medicine = c.prescriptionRequiredForMedicine;
  if (c.prescriptionNote !== undefined) row.prescription_note = c.prescriptionNote;
  if (c.licensingNote !== undefined) row.licensing_note = c.licensingNote;
  if (c.emergencyNumber !== undefined) row.emergency_number = c.emergencyNumber;
  return row;
};

export const toAddress = (r: AddressRow): Address => ({
  id: r.id,
  userId: r.user_id,
  label: r.label,
  addressText: r.address_text,
  latitude: r.latitude,
  longitude: r.longitude,
  consentToShare: r.consent_to_share,
});

/** Line-item ids are unique per quote in the domain model; the database prefixes them with the quote id. */
const lineItemDbId = (quoteId: string, itemId: string) => `${quoteId}:${itemId}`;

export const toLineItem = (r: LineItemRow): QuoteLineItem => ({
  id: r.id.includes(":") ? r.id.slice(r.id.indexOf(":") + 1) : r.id,
  type: r.type as QuoteLineItem["type"],
  label: r.label,
  baseAmountMinor: r.base_amount_minor,
  marginAmountMinor: r.margin_amount_minor,
  customerAmountMinor: r.customer_amount_minor,
  quantity: r.quantity,
  lineTotalMinor: r.line_total_minor,
  disclosed: r.disclosed,
  estimated: r.estimated,
});

export const fromLineItem = (quoteId: string, item: QuoteLineItem, position: number): LineItemRow => ({
  id: lineItemDbId(quoteId, item.id),
  quote_id: quoteId,
  position,
  type: item.type,
  label: item.label,
  base_amount_minor: item.baseAmountMinor,
  margin_amount_minor: item.marginAmountMinor,
  customer_amount_minor: item.customerAmountMinor,
  quantity: item.quantity,
  line_total_minor: item.lineTotalMinor,
  disclosed: item.disclosed,
  estimated: item.estimated,
});

export const toQuote = (r: QuoteRow): Quote => ({
  id: r.id,
  bookingId: r.booking_id,
  status: r.status as Quote["status"],
  currency: r.currency,
  lineItems: [...(r.quote_line_items ?? [])].sort((a, b) => a.position - b.position).map(toLineItem),
  subtotalMinor: r.subtotal_minor,
  taxMinor: r.tax_minor,
  totalMinor: r.total_minor,
  providerPayoutMinor: r.provider_payout_minor,
  platformEarningsMinor: r.platform_earnings_minor,
  hasEstimates: r.has_estimates,
  createdAt: new Date(r.created_at).toISOString(),
  expiresAt: new Date(r.expires_at).toISOString(),
});

export const fromQuote = (q: Quote): Omit<QuoteRow, "quote_line_items"> => ({
  id: q.id,
  booking_id: q.bookingId,
  status: q.status,
  currency: q.currency,
  subtotal_minor: q.subtotalMinor,
  tax_minor: q.taxMinor,
  total_minor: q.totalMinor,
  provider_payout_minor: q.providerPayoutMinor,
  platform_earnings_minor: q.platformEarningsMinor,
  has_estimates: q.hasEstimates,
  created_at: q.createdAt,
  expires_at: q.expiresAt,
});

export const toStatusEvent = (r: StatusEventRow): StatusEvent => ({
  status: r.status as StatusEvent["status"],
  at: new Date(r.at).toISOString(),
  by: r.by_role as StatusEvent["by"],
  ...(r.note ? { note: r.note } : {}),
});

export const fromStatusEvent = (bookingId: string, e: StatusEvent): StatusEventRow => ({
  booking_id: bookingId,
  status: e.status,
  at: e.at,
  by_role: e.by,
  note: e.note ?? null,
});

export const toBooking = (r: BookingRow): Booking => {
  const quoteRow = Array.isArray(r.quotes) ? r.quotes[0] : r.quotes;
  if (!quoteRow) throw new Error(`Booking ${r.id} has no price snapshot`);
  if (!r.addresses) throw new Error(`Booking ${r.id} has no address`);
  return {
    id: r.id,
    userId: r.user_id,
    providerId: r.provider_id,
    serviceId: r.service_id,
    providerName: r.provider_name,
    serviceName: r.service_name,
    category: r.category as Booking["category"],
    address: toAddress(r.addresses),
    scheduledStart: new Date(r.scheduled_start).toISOString(),
    scheduledEnd: new Date(r.scheduled_end).toISOString(),
    slotId: r.slot_id,
    status: r.status as Booking["status"],
    notes: r.notes,
    distanceKm: Number(r.distance_km),
    quote: toQuote(quoteRow),
    totalAmountMinor: r.total_amount_minor,
    statusHistory: [...(r.booking_status_events ?? [])]
      .sort((a, b) => a.at.localeCompare(b.at) || (a.id ?? 0) - (b.id ?? 0))
      .map(toStatusEvent),
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
};

export const toAuditLog = (r: AuditLogRow): AuditLogEntry => ({
  id: String(r.id),
  at: new Date(r.at).toISOString(),
  actorRole: r.actor_role as AuditLogEntry["actorRole"],
  actorId: r.actor_id,
  action: r.action,
  entityType: r.entity_type as AuditLogEntry["entityType"],
  entityId: r.entity_id,
  details: r.details ?? {},
});
