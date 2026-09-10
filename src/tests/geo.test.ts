import { describe, expect, it } from "vitest";
import { haversineKm, isValidPoint, isWithinRadius, roundedDistanceKm } from "@/lib/geo";

const connaughtPlace = { latitude: 28.6315, longitude: 77.2167 };
const saket = { latitude: 28.5245, longitude: 77.2066 };
const mumbaiBandra = { latitude: 19.0596, longitude: 72.8295 };

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm(connaughtPlace, connaughtPlace)).toBe(0);
  });

  it("matches a known short distance within a city (~11.9 km)", () => {
    expect(haversineKm(connaughtPlace, saket)).toBeCloseTo(11.94, 1);
  });

  it("matches a known long distance between cities (Delhi → Mumbai ≈ 1150 km)", () => {
    const d = haversineKm(connaughtPlace, mumbaiBandra);
    expect(d).toBeGreaterThan(1140);
    expect(d).toBeLessThan(1160);
  });

  it("is symmetric", () => {
    expect(haversineKm(saket, mumbaiBandra)).toBeCloseTo(haversineKm(mumbaiBandra, saket), 10);
  });

  it("handles antipodal points without NaN", () => {
    const d = haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 });
    expect(d).toBeCloseTo(Math.PI * 6371, 0);
  });
});

describe("roundedDistanceKm", () => {
  it("rounds to one decimal place", () => {
    expect(roundedDistanceKm(connaughtPlace, saket)).toBe(11.9);
  });
});

describe("isWithinRadius", () => {
  it("includes points inside the radius and excludes points outside", () => {
    expect(isWithinRadius(connaughtPlace, saket, 12)).toBe(true);
    expect(isWithinRadius(connaughtPlace, saket, 10)).toBe(false);
  });
});

describe("isValidPoint", () => {
  it("accepts valid coordinates and rejects invalid ones", () => {
    expect(isValidPoint(connaughtPlace)).toBe(true);
    expect(isValidPoint({ latitude: 91, longitude: 0 })).toBe(false);
    expect(isValidPoint({ latitude: Number.NaN, longitude: 0 })).toBe(false);
    expect(isValidPoint(null)).toBe(false);
  });
});
