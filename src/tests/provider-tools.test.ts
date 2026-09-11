import { beforeEach, describe, expect, it } from "vitest";
import { appointmentsCalendar } from "@/lib/ics";
import { MemoryRepository } from "@/lib/repository/memory";
import { summarizeReviews } from "@/lib/reviews";
import { createSeedData, DEMO_ADMIN_ID, DEMO_USER_ID } from "@/lib/seed";
import { addSlots } from "@/lib/services/admin";
import { submitReview } from "@/lib/services/reviews";
import { reviewVerification, submitVerification } from "@/lib/services/verification";
import { buildSession } from "@/lib/session";
import { verificationSchemaFor } from "@/lib/verification";
import { createTestData } from "./fixtures";

const NOW = new Date("2026-09-10T06:00:00Z"); // 11:30 IST
const HOUR = 3600 * 1000;
const customer = buildSession("user", undefined);
const admin = buildSession("admin", undefined);
const nurse = buildSession("provider", "prov_01");
const otherNurse = buildSession("provider", "prov_02");
const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";

let repo: MemoryRepository;

beforeEach(() => {
  repo = new MemoryRepository(createTestData(NOW));
});

describe("seed data", () => {
  it("holds only settings and the demo accounts: no mock providers, bookings or reviews", () => {
    const seed = createSeedData(NOW);
    expect(seed.users.map((u) => u.id)).toEqual([DEMO_USER_ID, DEMO_ADMIN_ID]);
    for (const rows of [seed.providers, seed.services, seed.slots, seed.reviews, seed.bookings, seed.verificationApplications]) {
      expect(rows).toEqual([]);
    }
    expect(seed.categories.map((c) => c.id)).not.toContain("doctor");
    expect(seed.pricingRules.length).toBeGreaterThan(0);
  });
});

describe("addSlots", () => {
  it("opens the same window on several days", async () => {
    const slots = await addSlots(repo, nurse, "prov_01", { dates: ["2026-09-12", "2026-09-11"], startTime: "07:00", durationMinutes: 60 }, NOW);
    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.startAt)).toEqual(["2026-09-11T01:30:00.000Z", "2026-09-12T01:30:00.000Z"]);
    expect(slots.every((s) => s.capacity === 1 && s.status === "open" && s.bookedCount === 0)).toBe(true);
  });

  it("rejects overlapping and past windows, and other providers' calendars", async () => {
    await expect(addSlots(repo, nurse, "prov_01", { dates: ["2026-09-11"], startTime: "08:30", durationMinutes: 60 }, NOW)).rejects.toMatchObject({ status: 409 });
    await expect(addSlots(repo, nurse, "prov_01", { dates: ["2026-09-10"], startTime: "07:00", durationMinutes: 60 }, NOW)).rejects.toMatchObject({ status: 409 });
    await expect(addSlots(repo, otherNurse, "prov_01", { dates: ["2026-09-11"], startTime: "07:00", durationMinutes: 60 }, NOW)).rejects.toMatchObject({ status: 403 });
  });
});

describe("caretaker verification", () => {
  const caregiverForm = {
    fullName: "Anjali Thakur",
    phone: "+91 98100 12345",
    email: "anjali@example.com",
    addressText: "House 12, Paharganj, New Delhi",
    city: "New Delhi",
    languages: ["Hindi", "English"],
    yearsExperience: 5,
    govtIdType: "aadhaar",
    govtIdLast4: "1234",
    photoUrl: PHOTO,
    qualifications: [],
    policeVerificationRef: "DL-PV-99812",
    documents: [
      { kind: "photo_id", fileName: "aadhaar.pdf", sizeBytes: 1000, contentType: "application/pdf" },
      { kind: "police", fileName: "police.pdf", sizeBytes: 1000, contentType: "application/pdf" },
    ],
    confirmAccurate: true,
  };

  it("requires each profession's credentials", () => {
    const nurseResult = verificationSchemaFor("nurse").safeParse(caregiverForm);
    expect(nurseResult.success).toBe(false);
    const paths = nurseResult.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["registrationNumber", "registrationCouncil", "qualifications", "documents"]));
    expect(verificationSchemaFor("caregiver").safeParse(caregiverForm).success).toBe(true);
    expect(verificationSchemaFor("caregiver").safeParse({ ...caregiverForm, policeVerificationRef: "" }).success).toBe(false);
  });

  it("moves a caretaker from submitted to verified with checked credentials and photo", async () => {
    const input = verificationSchemaFor("caregiver").parse(caregiverForm);
    const application = await submitVerification(repo, buildSession("provider", "prov_08"), "prov_08", input, NOW);
    expect(application.status).toBe("submitted");
    expect((await repo.getProvider("prov_08"))?.verificationStatus).toBe("pending");

    await reviewVerification(repo, admin, application.id, "approve", "", NOW);
    const provider = (await repo.getProvider("prov_08"))!;
    expect(provider.verificationStatus).toBe("verified");
    expect(provider.name).toBe("Anjali Thakur");
    expect(provider.photoUrl).toBe(PHOTO);
    expect(provider.credentials.map((c) => c.label)).toEqual(["Police verification", "Identity check"]);
    expect(provider.credentials.every((c) => c.verified)).toBe(true);
    await expect(reviewVerification(repo, admin, application.id, "reject", "Too late", NOW)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects with a reason, replaces a pending application on resubmission, and checks roles", async () => {
    await reviewVerification(repo, admin, "vapp_demo_2", "reject", "Police certificate is unreadable.", NOW);
    expect((await repo.getProvider("prov_14"))?.verificationStatus).toBe("rejected");

    const input = verificationSchemaFor("caregiver").parse(caregiverForm);
    const session = buildSession("provider", "prov_08");
    const first = await submitVerification(repo, session, "prov_08", input, NOW);
    await submitVerification(repo, session, "prov_08", input, new Date(NOW.getTime() + HOUR));
    expect((await repo.getVerificationApplication(first.id))?.status).toBe("superseded");

    await expect(submitVerification(repo, nurse, "prov_08", input)).rejects.toMatchObject({ status: 403 });
    await expect(reviewVerification(repo, nurse, first.id, "approve", "")).rejects.toMatchObject({ status: 403 });
  });
});

describe("reviews", () => {
  const input = { rating: 5, aspects: { punctuality: 5, communication: 4 }, wouldRecommend: true, comment: "Very gentle and on time." };

  it("lets the customer review a completed visit once and updates the provider's rating", async () => {
    const before = (await repo.getProvider("prov_01"))!;
    const review = await submitReview(repo, customer, "bk_demo_3", input, NOW);
    expect(review).toMatchObject({ bookingId: "bk_demo_3", authorName: "Aarav S.", rating: 5, wouldRecommend: true });

    const after = (await repo.getProvider("prov_01"))!;
    expect(after.reviewCount).toBe(before.reviewCount + 1);
    expect((await repo.listReviews("prov_01"))[0].id).toBe(review.id);
    await expect(submitReview(repo, customer, "bk_demo_3", input, NOW)).rejects.toMatchObject({ status: 409 });
  });

  it("refuses unfinished visits and non-customers", async () => {
    await expect(submitReview(repo, customer, "bk_demo_1", input, NOW)).rejects.toMatchObject({ status: 422 });
    await expect(submitReview(repo, nurse, "bk_demo_3", input, NOW)).rejects.toMatchObject({ status: 403 });
  });

  it("summarises star distribution, aspect averages and recommendations", async () => {
    const summary = summarizeReviews(await repo.listReviews("prov_01"));
    expect(summary.count).toBe(3);
    expect(Object.values(summary.distribution).reduce((a, b) => a + b, 0)).toBe(3);
    expect(summary.aspects.map((a) => a.aspect)).toEqual(["punctuality", "communication", "courtesy", "value"]);
    expect(summary.recommendPercent).toBe(100);
  });
});

describe("appointment calendar export", () => {
  it("exports each appointment with a reminder, without the patient's address", async () => {
    const bookings = await repo.listBookings({ providerId: "prov_01" });
    expect(bookings.length).toBeGreaterThan(0);
    const ics = appointmentsCalendar(bookings, { calendarName: "HealNest — Sunita Rawat", baseUrl: "https://example.test", now: NOW });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(bookings.length);
    expect(ics).toContain("TRIGGER:-PT30M");
    expect(ics).not.toContain("Demo Residency");
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
