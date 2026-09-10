import { canActorTransition, STATUS_LABELS } from "@/lib/booking-status";
import { conflict, forbidden, notFound, unprocessable } from "@/lib/errors";
import { roundedDistanceKm } from "@/lib/geo";
import type { CareRepository } from "@/lib/repository/types";
import { buildQuote } from "@/lib/services/quotes";
import type { Session } from "@/lib/session";
import type { BookingRequest } from "@/lib/validations";
import type { Booking, BookingStatus, Role } from "@/types";

const newBookingId = () => `bk_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

export function canViewBooking(session: Session, booking: Booking): boolean {
  if (session.role === "admin") return true;
  if (session.role === "provider") return booking.providerId === session.providerId;
  return booking.userId === session.userId;
}

/** Validates a booking request against live data, snapshots the server-side quote and reserves the slot. */
export async function createBooking(
  repo: CareRepository,
  request: BookingRequest,
  session: Session,
  now: Date = new Date(),
): Promise<Booking> {
  if (session.role !== "user") throw forbidden("Switch to the Customer role to request a visit.");

  const [provider, service, slot, categories] = await Promise.all([
    repo.getProvider(request.providerId),
    repo.getService(request.serviceId),
    repo.getSlot(request.slotId),
    repo.listCategories(),
  ]);

  if (!provider || !provider.active) throw notFound("Provider");
  if (provider.verificationStatus !== "verified") {
    throw unprocessable("This provider has not completed verification yet and cannot accept bookings.");
  }
  if (!categories.find((c) => c.id === provider.category)?.active) {
    throw unprocessable("This category is temporarily unavailable.");
  }
  if (!service || !service.active || service.providerId !== provider.id) {
    throw unprocessable("That service is not offered by this provider.");
  }
  if (!slot || slot.providerId !== provider.id) throw unprocessable("Choose one of this provider's available time windows.");
  if (slot.status !== "open" || Date.parse(slot.startAt) <= now.getTime()) {
    throw conflict("That time window is no longer available. Please pick another.");
  }

  const address = { latitude: request.latitude, longitude: request.longitude };
  const distanceKm = roundedDistanceKm(address, provider.baseLocation);
  if (distanceKm > provider.serviceRadiusKm) {
    throw unprocessable(
      `This address is ${distanceKm} km away, outside ${provider.name}'s ${provider.serviceRadiusKm} km service area.`,
    );
  }

  const bookingId = newBookingId();
  const quote = await buildQuote(
    repo,
    {
      providerId: provider.id,
      serviceId: service.id,
      includeMedicine: request.includeMedicine,
      medicineQuantity: request.medicineQuantity,
    },
    { bookingId, now },
  );

  if (!(await repo.reserveSlot(slot.id))) {
    throw conflict("Someone just booked that time window. Please pick another.");
  }

  const createdAt = now.toISOString();
  const booking: Booking = {
    id: bookingId,
    userId: session.userId,
    providerId: provider.id,
    serviceId: service.id,
    providerName: provider.name,
    serviceName: service.name,
    category: provider.category,
    address: {
      label: request.addressLabel,
      addressText: request.addressText,
      latitude: request.latitude,
      longitude: request.longitude,
      consentToShare: request.consentToShareLocation,
    },
    scheduledStart: slot.startAt,
    scheduledEnd: slot.endAt,
    slotId: slot.id,
    status: "REQUESTED",
    notes: request.notes,
    distanceKm,
    quote,
    totalAmountMinor: quote.totalMinor,
    statusHistory: [{ status: "REQUESTED", at: createdAt, by: "user" }],
    createdAt,
    updatedAt: createdAt,
  };

  let created: Booking;
  try {
    created = await repo.createBooking(booking);
  } catch (error) {
    await repo.releaseSlot(slot.id);
    throw error;
  }

  await repo.addAuditLog({
    actorRole: session.role,
    actorId: session.userId,
    action: "booking.created",
    entityType: "booking",
    entityId: created.id,
    details: { providerId: provider.id, serviceId: service.id, slotId: slot.id },
  });
  await repo.addAuditLog({
    actorRole: session.role,
    actorId: session.userId,
    action: "quote.snapshotted",
    entityType: "quote",
    entityId: quote.id,
    details: {
      bookingId: created.id,
      totalMinor: quote.totalMinor,
      platformEarningsMinor: quote.platformEarningsMinor,
      providerPayoutMinor: quote.providerPayoutMinor,
      hasEstimates: quote.hasEstimates,
    },
  });

  return created;
}

/**
 * Moves a booking through the state machine after checking ownership and role.
 * `simulateAs` lets demo tools act as the booking's provider; it is recorded in the audit log.
 */
export async function transitionBooking(
  repo: CareRepository,
  bookingId: string,
  to: BookingStatus,
  session: Session,
  options: { note?: string; simulateAs?: Role; now?: Date } = {},
): Promise<Booking> {
  const booking = await repo.getBooking(bookingId);
  if (!booking || !canViewBooking(session, booking)) throw notFound("Booking");

  const actingRole = options.simulateAs ?? session.role;
  if (!canActorTransition(booking.status, to, actingRole)) {
    throw conflict(`A ${actingRole} cannot move this booking from ${STATUS_LABELS[booking.status]} to ${STATUS_LABELS[to]}.`);
  }

  const at = (options.now ?? new Date()).toISOString();
  const updated = await repo.updateBooking(booking.id, {
    status: to,
    statusHistory: [...booking.statusHistory, { status: to, at, by: actingRole, ...(options.note ? { note: options.note } : {}) }],
    updatedAt: at,
  });

  if ((to === "CANCELLED" || to === "DECLINED") && booking.slotId) {
    await repo.releaseSlot(booking.slotId);
  }

  await repo.addAuditLog({
    actorRole: session.role,
    actorId: session.userId,
    action: "booking.status_changed",
    entityType: "booking",
    entityId: booking.id,
    details: { from: booking.status, to, ...(options.simulateAs ? { simulatedAs: options.simulateAs } : {}) },
  });

  return updated;
}
