import { conflict, forbidden, notFound, unprocessable } from "@/lib/errors";
import { formatDateTime } from "@/lib/formatters";
import type {
  CategoryPatch,
  CareRepository,
  PricingRulePatch,
  ProviderPatch,
  ServicePatch,
} from "@/lib/repository/types";
import type { Session } from "@/lib/session";
import type { SlotCreateInput } from "@/lib/validations";
import type { AvailabilitySlot, CategoryId, PlatformConfig, SlotStatus } from "@/types";

// Provider and admin mutations. Every change is authorized here and written to the audit log.

/** How far ahead providers can open slots. */
export const MAX_SCHEDULE_DAYS_AHEAD = 60;

export function audit(
  repo: CareRepository,
  session: Session,
  action: string,
  entityType: Parameters<CareRepository["addAuditLog"]>[0]["entityType"],
  entityId: string,
  details: Record<string, unknown>,
) {
  return repo.addAuditLog({ actorRole: session.role, actorId: session.userId, action, entityType, entityId, details });
}

export function assertAdmin(session: Session) {
  if (session.role !== "admin") throw forbidden("Admin role required.");
}

export function assertProviderOwns(session: Session, providerId: string) {
  if (session.role === "admin") return;
  if (session.role !== "provider" || session.providerId !== providerId) {
    throw forbidden("You can only manage your own provider profile.");
  }
}

export async function updateProvider(repo: CareRepository, session: Session, providerId: string, patch: ProviderPatch) {
  // Only admins may change verification or deactivate a profile; providers may change their own radius.
  if (patch.verificationStatus !== undefined || patch.active !== undefined) assertAdmin(session);
  else assertProviderOwns(session, providerId);

  const before = await repo.getProvider(providerId);
  if (!before) throw notFound("Provider");
  const after = await repo.updateProvider(providerId, patch);

  if (patch.verificationStatus !== undefined && patch.verificationStatus !== before.verificationStatus) {
    await audit(repo, session, "provider.verification_changed", "provider", providerId, {
      from: before.verificationStatus,
      to: after.verificationStatus,
    });
  }
  if (patch.serviceRadiusKm !== undefined && patch.serviceRadiusKm !== before.serviceRadiusKm) {
    await audit(repo, session, "provider.radius_changed", "provider", providerId, {
      from: before.serviceRadiusKm,
      to: after.serviceRadiusKm,
    });
  }
  if (patch.active !== undefined && patch.active !== before.active) {
    await audit(repo, session, "provider.active_changed", "provider", providerId, { to: after.active });
  }
  return after;
}

export async function setSlotStatus(repo: CareRepository, session: Session, slotId: string, status: Extract<SlotStatus, "open" | "blocked">) {
  const slot = await repo.getSlot(slotId);
  if (!slot) throw notFound("Slot");
  assertProviderOwns(session, slot.providerId);
  // Blocking a partly booked slot stops new bookings; patients already booked keep their place.
  if (slot.status === "booked") throw conflict("Fully booked slots can't be changed. Cancel or decline the bookings instead.");
  const updated = await repo.updateSlotStatus(slotId, status);
  await audit(repo, session, "slot.status_changed", "slot", slotId, { from: slot.status, to: status });
  return updated;
}

/** Opens the same time window on each chosen day. */
export async function addSlots(
  repo: CareRepository,
  session: Session,
  providerId: string,
  input: SlotCreateInput,
  now = new Date(),
): Promise<AvailabilitySlot[]> {
  assertProviderOwns(session, providerId);
  const provider = await repo.getProvider(providerId);
  if (!provider) throw notFound("Provider");

  const latest = now.getTime() + MAX_SCHEDULE_DAYS_AHEAD * 24 * 3600 * 1000;
  const windows = [...new Set(input.dates)].sort().map((date) => {
    const start = new Date(`${date}T${input.startTime}:00+05:30`);
    return { start, end: new Date(start.getTime() + input.durationMinutes * 60_000) };
  });
  for (const { start } of windows) {
    if (Number.isNaN(start.getTime())) throw unprocessable("Choose valid dates.");
    if (start.getTime() <= now.getTime()) throw conflict(`${formatDateTime(start.toISOString())} is in the past.`);
    if (start.getTime() > latest) throw unprocessable(`You can open slots up to ${MAX_SCHEDULE_DAYS_AHEAD} days ahead.`);
  }

  const existing = await repo.listSlots({ providerId });
  const clash = windows.find(({ start, end }) =>
    existing.some((s) => Date.parse(s.startAt) < end.getTime() && Date.parse(s.endAt) > start.getTime()),
  );
  if (clash) throw conflict(`${formatDateTime(clash.start.toISOString())} overlaps an existing slot.`);

  const created: AvailabilitySlot[] = [];
  for (const { start, end } of windows) {
    const slot = await repo.createSlot({
      id: `slot_${providerId.replace("prov_", "")}_${start.getTime()}`,
      providerId,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      status: "open",
      capacity: 1,
      bookedCount: 0,
    });
    await audit(repo, session, "slot.created", "slot", slot.id, { startAt: slot.startAt, endAt: slot.endAt });
    created.push(slot);
  }
  return created;
}

export async function updatePricingRule(repo: CareRepository, session: Session, ruleId: string, patch: PricingRulePatch) {
  assertAdmin(session);
  const before = (await repo.listPricingRules()).find((r) => r.id === ruleId);
  if (!before) throw notFound("Pricing rule");
  const after = await repo.updatePricingRule(ruleId, patch);
  await audit(repo, session, "pricing_rule.updated", "pricing_rule", ruleId, {
    from: { mode: before.mode, value: before.value, active: before.active },
    to: { mode: after.mode, value: after.value, active: after.active },
  });
  return after;
}

export async function updatePlatformConfig(repo: CareRepository, session: Session, patch: Partial<PlatformConfig>) {
  assertAdmin(session);
  const after = await repo.updatePlatformConfig(patch);
  await audit(repo, session, "config.updated", "config", "platform", { changed: Object.keys(patch) });
  return after;
}

export async function updateCategory(repo: CareRepository, session: Session, id: CategoryId, patch: CategoryPatch) {
  assertAdmin(session);
  const after = await repo.updateCategory(id, patch);
  await audit(repo, session, "category.updated", "category", id, { ...patch });
  return after;
}

export async function updateService(repo: CareRepository, session: Session, serviceId: string, patch: ServicePatch) {
  assertAdmin(session);
  const before = await repo.getService(serviceId);
  if (!before) throw notFound("Service");
  const after = await repo.updateService(serviceId, patch);
  await audit(repo, session, "service.updated", "service", serviceId, {
    from: { basePriceMinor: before.basePriceMinor, active: before.active },
    to: { basePriceMinor: after.basePriceMinor, active: after.active },
  });
  return after;
}
