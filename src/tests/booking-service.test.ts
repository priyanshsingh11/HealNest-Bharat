import { beforeEach, describe, expect, it } from "vitest";
import { validateQuoteInvariants } from "@/lib/pricing";
import { MemoryRepository } from "@/lib/repository/memory";
import { DEMO_USER_ID } from "@/lib/seed";
import { updatePricingRule, updateProvider } from "@/lib/services/admin";
import { createBooking, transitionBooking } from "@/lib/services/bookings";
import { searchProviders } from "@/lib/services/discovery";
import { buildSession } from "@/lib/session";
import type { BookingRequest } from "@/lib/validations";
import { createTestData } from "./fixtures";

const NOW = new Date("2026-09-10T06:00:00Z"); // 11:30 IST
const customer = buildSession("user", undefined);
const admin = buildSession("admin", undefined);
const nurseProvider = buildSession("provider", "prov_01");
const otherProvider = buildSession("provider", "prov_02");
const connaughtPlace = { lat: 28.6315, lng: 77.2167 };

let repo: MemoryRepository;

beforeEach(() => {
  repo = new MemoryRepository(createTestData(NOW));
});

async function firstOpenSlot(providerId: string) {
  const slots = await repo.listSlots({ providerId, status: "open", from: NOW.toISOString() });
  return slots[0];
}

async function bookingRequest(overrides: Partial<BookingRequest> = {}): Promise<BookingRequest> {
  const slot = await firstOpenSlot("prov_01");
  return {
    providerId: "prov_01",
    serviceId: "svc_01_1",
    slotId: slot.id,
    addressLabel: "Home",
    addressText: "Flat 4, Barakhamba Road, Connaught Place",
    latitude: connaughtPlace.lat,
    longitude: connaughtPlace.lng,
    notes: "Prescription is available.",
    includeMedicine: true,
    medicineQuantity: 1,
    consentToShareLocation: true,
    acceptPriceBreakdown: true,
    ...overrides,
  };
}

describe("searchProviders", () => {
  it("returns only providers whose service radius covers the location, sorted by distance", async () => {
    const { results } = await searchProviders(repo, { ...connaughtPlace, category: "nurse" }, NOW);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.provider.category).toBe("nurse");
      expect(r.distanceKm).not.toBeNull();
      expect(r.distanceKm!).toBeLessThanOrEqual(r.provider.serviceRadiusKm);
    }
    const distances = results.map((r) => r.distanceKm!);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    // A Delhi location never shows Mumbai or Bengaluru nurses.
    expect(results.every((r) => ["New Delhi", "Noida", "Gurugram"].includes(r.provider.baseLocation.city))).toBe(true);
  });

  it("shows distance, earliest availability and a starting price on every result", async () => {
    const { results } = await searchProviders(repo, { ...connaughtPlace }, NOW);
    for (const r of results) {
      expect(r.startingPriceMinor).toBeGreaterThan(0);
      expect(r.earliestSlot?.status).toBe("open");
    }
  });

  it("applies the verified-only filter", async () => {
    const all = await searchProviders(repo, { lat: 28.5708, lng: 77.3261, category: "phlebotomist" }, NOW);
    const verified = await searchProviders(repo, { lat: 28.5708, lng: 77.3261, category: "phlebotomist", verifiedOnly: true }, NOW);
    expect(all.results.some((r) => r.provider.verificationStatus !== "verified")).toBe(true);
    expect(verified.results.every((r) => r.provider.verificationStatus === "verified")).toBe(true);
  });

  it("sorts by rating when requested", async () => {
    const { results } = await searchProviders(repo, { ...connaughtPlace, sort: "rating" }, NOW);
    const ratings = results.map((r) => r.provider.rating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });
});

describe("createBooking", () => {
  it("creates a REQUESTED booking with a valid price snapshot and reserves the slot", async () => {
    const request = await bookingRequest();
    const booking = await createBooking(repo, request, customer, NOW);

    expect(booking.status).toBe("REQUESTED");
    expect(booking.userId).toBe(DEMO_USER_ID);
    expect(booking.totalAmountMinor).toBe(booking.quote.totalMinor);
    expect(validateQuoteInvariants(booking.quote)).toEqual([]);
    expect(booking.quote.lineItems.map((i) => i.type)).toEqual(
      expect.arrayContaining(["visit", "procedure", "medicine", "travel", "platform_fee", "tax"]),
    );
    expect((await repo.getSlot(request.slotId))?.status).toBe("booked");

    const logs = await repo.listAuditLogs();
    expect(logs.map((l) => l.action)).toEqual(expect.arrayContaining(["booking.created", "quote.snapshotted"]));
  });

  it("refuses a slot that is already booked", async () => {
    const request = await bookingRequest();
    await createBooking(repo, request, customer, NOW);
    await expect(createBooking(repo, request, customer, NOW)).rejects.toMatchObject({ status: 409 });
  });

  it("refuses addresses outside the provider's service radius", async () => {
    const request = await bookingRequest({ latitude: 19.0596, longitude: 72.8295 });
    await expect(createBooking(repo, request, customer, NOW)).rejects.toMatchObject({ status: 422 });
  });

  it("refuses providers that are not verified", async () => {
    await updateProvider(repo, admin, "prov_01", { verificationStatus: "pending" });
    await expect(createBooking(repo, await bookingRequest(), customer, NOW)).rejects.toMatchObject({ status: 422 });
  });

  it("refuses non-customer roles", async () => {
    await expect(createBooking(repo, await bookingRequest(), nurseProvider, NOW)).rejects.toMatchObject({ status: 403 });
  });

  it("keeps the historical price snapshot when pricing rules change later", async () => {
    const booking = await createBooking(repo, await bookingRequest(), customer, NOW);
    await updatePricingRule(repo, admin, "rule_platform", { mode: "fixed", value: 99900, active: true });
    const reloaded = await repo.getBooking(booking.id);
    expect(reloaded?.quote).toEqual(booking.quote);
  });
});

describe("transitionBooking", () => {
  it("lets the booking's provider accept and complete the visit, recording history", async () => {
    const booking = await createBooking(repo, await bookingRequest(), customer, NOW);
    let current = booking;
    for (const status of ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "COMPLETED"] as const) {
      current = await transitionBooking(repo, booking.id, status, nurseProvider);
    }
    expect(current.status).toBe("COMPLETED");
    expect(current.statusHistory.map((e) => e.status)).toEqual([
      "REQUESTED",
      "ACCEPTED",
      "ON_THE_WAY",
      "ARRIVED",
      "IN_PROGRESS",
      "COMPLETED",
    ]);
  });

  it("does not let another provider touch the booking", async () => {
    const booking = await createBooking(repo, await bookingRequest(), customer, NOW);
    await expect(transitionBooking(repo, booking.id, "ACCEPTED", otherProvider)).rejects.toMatchObject({ status: 404 });
  });

  it("does not let a customer accept their own booking", async () => {
    const booking = await createBooking(repo, await bookingRequest(), customer, NOW);
    await expect(transitionBooking(repo, booking.id, "ACCEPTED", customer)).rejects.toMatchObject({ status: 409 });
  });

  it("releases the slot when the customer cancels", async () => {
    const request = await bookingRequest();
    const booking = await createBooking(repo, request, customer, NOW);
    await transitionBooking(repo, booking.id, "CANCELLED", customer);
    expect((await repo.getSlot(request.slotId))?.status).toBe("open");
  });

  it("blocks cancellation once the provider is on the way", async () => {
    const booking = await createBooking(repo, await bookingRequest(), customer, NOW);
    await transitionBooking(repo, booking.id, "ACCEPTED", nurseProvider);
    await transitionBooking(repo, booking.id, "ON_THE_WAY", nurseProvider);
    await expect(transitionBooking(repo, booking.id, "CANCELLED", customer)).rejects.toMatchObject({ status: 409 });
  });
});
