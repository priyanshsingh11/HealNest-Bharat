import { describe, expect, it } from "vitest";
import { calculateQuote, marginFor, percentOfMinor, validateQuoteInvariants } from "@/lib/pricing";
import type { PlatformConfig, PricingRule } from "@/types";

const NOW = new Date("2026-09-10T10:00:00+05:30");

const noTax: Pick<PlatformConfig, "currency" | "taxLabel" | "taxRateBps" | "taxAppliesTo" | "quoteValidityMinutes"> = {
  currency: "INR",
  taxLabel: "GST",
  taxRateBps: 0,
  taxAppliesTo: [],
  quoteValidityMinutes: 30,
};

const rule = (itemType: PricingRule["itemType"], mode: PricingRule["mode"], value: number, active = true): PricingRule => ({
  id: `rule_${itemType}`,
  itemType,
  label: itemType === "platform_fee" ? "Platform fee" : `${itemType} margin`,
  mode,
  value,
  active,
});

// The worked example from the product brief.
const injectionService = {
  name: "Injection administration",
  basePriceMinor: 30000, // ₹300 visit
  procedureFeeMinor: 10000, // ₹100 procedure
  medicineEstimateMinor: 1000, // ₹10 medicine
  requiresConfirmation: true,
};

describe("percentOfMinor", () => {
  it("computes basis-point percentages with half-up rounding in integers", () => {
    expect(percentOfMinor(10000, 1500)).toBe(1500);
    expect(percentOfMinor(333, 5000)).toBe(167); // 166.5 → 167
    expect(percentOfMinor(1, 1)).toBe(0);
    expect(percentOfMinor(0, 1800)).toBe(0);
  });

  it("rejects non-integer or negative inputs", () => {
    expect(() => percentOfMinor(10.5, 100)).toThrow(RangeError);
    expect(() => percentOfMinor(-1, 100)).toThrow(RangeError);
  });
});

describe("marginFor", () => {
  it("supports fixed and percent modes and ignores inactive rules", () => {
    expect(marginFor([rule("medicine", "fixed", 500)], "medicine", 1000)).toBe(500);
    expect(marginFor([rule("medicine", "percent", 5000)], "medicine", 1000)).toBe(500);
    expect(marginFor([rule("medicine", "percent", 5000, false)], "medicine", 1000)).toBe(0);
    expect(marginFor([], "visit", 30000)).toBe(0);
  });
});

describe("calculateQuote", () => {
  it("reproduces the brief's example: ₹10 medicine + ₹5 margin, ₹300 visit, ₹100 procedure, ₹50 travel = ₹465", () => {
    const quote = calculateQuote({
      service: injectionService,
      provider: { travelFeeMinor: 5000 },
      rules: [rule("medicine", "fixed", 500)],
      config: noTax,
      includeMedicine: true,
      now: NOW,
    });

    const medicine = quote.lineItems.find((i) => i.type === "medicine")!;
    expect(medicine).toMatchObject({ baseAmountMinor: 1000, marginAmountMinor: 500, customerAmountMinor: 1500, estimated: true });
    expect(quote.subtotalMinor).toBe(46500);
    expect(quote.taxMinor).toBe(0);
    expect(quote.totalMinor).toBe(46500);
    expect(quote.providerPayoutMinor).toBe(46000);
    expect(quote.platformEarningsMinor).toBe(500);
    expect(quote.hasEstimates).toBe(true);
    expect(quote.status).toBe("estimated");
    expect(validateQuoteInvariants(quote)).toEqual([]);
  });

  it("keeps every line disclosed and customer = base + margin", () => {
    const quote = calculateQuote({
      service: injectionService,
      provider: { travelFeeMinor: 5000 },
      rules: [rule("medicine", "percent", 1000), rule("travel", "fixed", 1000), rule("platform_fee", "fixed", 4900)],
      config: { ...noTax, taxRateBps: 1800, taxAppliesTo: ["platform_fee"] },
      includeMedicine: true,
      now: NOW,
    });
    for (const item of quote.lineItems) {
      expect(item.disclosed).toBe(true);
      expect(item.customerAmountMinor).toBe(item.baseAmountMinor + item.marginAmountMinor);
    }
    expect(validateQuoteInvariants(quote)).toEqual([]);
  });

  it("applies configurable tax only to the configured item types", () => {
    const quote = calculateQuote({
      service: { ...injectionService, procedureFeeMinor: 0, requiresConfirmation: false },
      provider: { travelFeeMinor: 0 },
      rules: [rule("platform_fee", "fixed", 5000)],
      config: { ...noTax, taxRateBps: 1800, taxAppliesTo: ["platform_fee"] },
      includeMedicine: false,
      now: NOW,
    });
    // Visit ₹300 + platform fee ₹50 = ₹350; GST 18% on ₹50 = ₹9.
    expect(quote.subtotalMinor).toBe(35000);
    expect(quote.taxMinor).toBe(900);
    expect(quote.totalMinor).toBe(35900);
    const tax = quote.lineItems.find((i) => i.type === "tax")!;
    expect(tax.label).toBe("GST (18%)");
    expect(quote.hasEstimates).toBe(false);
    expect(quote.status).toBe("preview");
  });

  it("charges a percentage platform fee on visit + procedure base only", () => {
    const quote = calculateQuote({
      service: injectionService,
      provider: { travelFeeMinor: 5000 },
      rules: [rule("platform_fee", "percent", 1000)],
      config: noTax,
      includeMedicine: true,
      now: NOW,
    });
    const fee = quote.lineItems.find((i) => i.type === "platform_fee")!;
    expect(fee.baseAmountMinor).toBe(0);
    expect(fee.marginAmountMinor).toBe(4000); // 10% of ₹400
    expect(quote.providerPayoutMinor).toBe(30000 + 10000 + 1000 + 5000);
  });

  it("multiplies medicine by quantity and keeps payout separate from customer price", () => {
    const quote = calculateQuote({
      service: injectionService,
      provider: { travelFeeMinor: 0 },
      rules: [rule("medicine", "percent", 1000)],
      config: noTax,
      includeMedicine: true,
      medicineQuantity: 3,
      now: NOW,
    });
    const medicine = quote.lineItems.find((i) => i.type === "medicine")!;
    expect(medicine.quantity).toBe(3);
    expect(medicine.customerAmountMinor).toBe(1100);
    expect(medicine.lineTotalMinor).toBe(3300);
    expect(quote.providerPayoutMinor).toBe(30000 + 10000 + 3000);
    expect(quote.platformEarningsMinor).toBe(300);
  });

  it("omits medicine when not requested and zero-value rows entirely", () => {
    const quote = calculateQuote({
      service: { ...injectionService, procedureFeeMinor: 0 },
      provider: { travelFeeMinor: 0 },
      rules: [],
      config: noTax,
      includeMedicine: false,
      now: NOW,
    });
    expect(quote.lineItems.map((i) => i.type)).toEqual(["visit"]);
    expect(quote.totalMinor).toBe(30000);
  });

  it("marks procedure as estimated only when the service requires confirmation", () => {
    const confirmed = calculateQuote({
      service: { ...injectionService, requiresConfirmation: false },
      provider: { travelFeeMinor: 0 },
      rules: [],
      config: noTax,
      includeMedicine: false,
      now: NOW,
    });
    expect(confirmed.lineItems.find((i) => i.type === "procedure")!.estimated).toBe(false);
  });

  it("sets an expiry from the configured validity window", () => {
    const quote = calculateQuote({
      service: injectionService,
      provider: { travelFeeMinor: 0 },
      rules: [],
      config: noTax,
      includeMedicine: false,
      now: NOW,
    });
    expect(Date.parse(quote.expiresAt) - Date.parse(quote.createdAt)).toBe(30 * 60_000);
  });

  it("rejects invalid medicine quantities and fractional amounts", () => {
    const base = { service: injectionService, provider: { travelFeeMinor: 0 }, rules: [], config: noTax, includeMedicine: true };
    expect(() => calculateQuote({ ...base, medicineQuantity: 0 })).toThrow(RangeError);
    expect(() => calculateQuote({ ...base, medicineQuantity: 1.5 })).toThrow(RangeError);
    expect(() => calculateQuote({ ...base, service: { ...injectionService, basePriceMinor: 100.5 } })).toThrow(RangeError);
  });
});
