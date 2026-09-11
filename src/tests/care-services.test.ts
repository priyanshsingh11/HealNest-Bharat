import { beforeEach, describe, expect, it } from "vitest";
import { CARE_SERVICES } from "@/lib/care-services";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { starterServicesFor } from "@/lib/platform-defaults";
import { MemoryRepository } from "@/lib/repository/memory";
import { searchProviders } from "@/lib/services/discovery";
import { createTestData } from "./fixtures";

const NOW = new Date("2026-09-10T06:00:00Z");
const connaughtPlace = { lat: 28.6315, lng: 77.2167 };
const koramangala = { lat: 12.9352, lng: 77.6245 };

let repo: MemoryRepository;

beforeEach(() => {
  repo = new MemoryRepository(createTestData(NOW));
});

describe("care services catalogue", () => {
  it("every care service is a starter service of exactly its listed categories", () => {
    const starter = DEFAULT_CATEGORIES.flatMap((category) => starterServicesFor(category.id, "prov_01"));
    for (const care of CARE_SERVICES) {
      const offering = starter.filter((s) => s.careService === care.id);
      expect(offering.length, care.id).toBeGreaterThan(0);
      expect(new Set(offering.map((s) => s.category)), care.id).toEqual(new Set(care.providedBy));
    }
  });
});

describe("searchProviders by care service", () => {
  it("returns only matching services and prices from them", async () => {
    const { results } = await searchProviders(repo, { ...koramangala, service: "physiotherapy" }, NOW);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.provider.category).toBe("physiotherapist");
      expect(r.services.every((s) => s.careService === "physiotherapy")).toBe(true);
      expect(r.startingPriceMinor).toBe(Math.min(...r.services.map((s) => s.basePriceMinor)));
    }
  });

  it("finds elderly care from caregivers", async () => {
    const { results } = await searchProviders(repo, { ...connaughtPlace, service: "elderly-care" }, NOW);
    expect(new Set(results.map((r) => r.provider.category))).toEqual(new Set(["caregiver"]));
  });

  it("finds home lab collection near a Bengaluru location", async () => {
    const { results } = await searchProviders(repo, { ...koramangala, service: "home-lab-collection" }, NOW);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.provider.category === "phlebotomist")).toBe(true);
  });
});
