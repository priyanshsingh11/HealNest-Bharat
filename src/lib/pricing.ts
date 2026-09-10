import type {
  LineItemType,
  PlatformConfig,
  PricingRule,
  PricingRuleItemType,
  ProviderProfile,
  Quote,
  QuoteLineItem,
  Service,
} from "@/types";

// Pure, isomorphic quote engine. The server is authoritative; the client reuses it for previews.
// All amounts are integer minor units (paise).

export const MAX_MEDICINE_QUANTITY = 10;

export type QuoteInput = {
  service: Pick<
    Service,
    "name" | "basePriceMinor" | "procedureFeeMinor" | "medicineEstimateMinor" | "requiresConfirmation"
  >;
  provider: Pick<ProviderProfile, "travelFeeMinor">;
  rules: PricingRule[];
  config: Pick<PlatformConfig, "currency" | "taxLabel" | "taxRateBps" | "taxAppliesTo" | "quoteValidityMinutes">;
  includeMedicine: boolean;
  medicineQuantity?: number;
  bookingId?: string | null;
  quoteId?: string;
  now?: Date;
};

function assertMinor(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer in minor units, got ${value}`);
  }
}

/** Integer percentage of a minor amount, rounded half-up. `bps` is basis points (1500 = 15%). */
export function percentOfMinor(amountMinor: number, bps: number): number {
  assertMinor(amountMinor, "amountMinor");
  assertMinor(bps, "bps");
  return Math.floor((amountMinor * bps + 5000) / 10000);
}

export function findRule(rules: PricingRule[], itemType: PricingRuleItemType): PricingRule | undefined {
  return rules.find((rule) => rule.itemType === itemType && rule.active);
}

/** Margin for a single unit of `baseMinor` under the active rule for `itemType`. */
export function marginFor(rules: PricingRule[], itemType: PricingRuleItemType, baseMinor: number): number {
  const rule = findRule(rules, itemType);
  if (!rule) return 0;
  return rule.mode === "fixed" ? rule.value : percentOfMinor(baseMinor, rule.value);
}

function lineItem(
  type: LineItemType,
  label: string,
  baseAmountMinor: number,
  marginAmountMinor: number,
  options: { quantity?: number; estimated?: boolean } = {},
): QuoteLineItem {
  const quantity = options.quantity ?? 1;
  assertMinor(baseAmountMinor, `${type}.baseAmountMinor`);
  assertMinor(marginAmountMinor, `${type}.marginAmountMinor`);
  const customerAmountMinor = baseAmountMinor + marginAmountMinor;
  return {
    id: `li_${type}`,
    type,
    label,
    baseAmountMinor,
    marginAmountMinor,
    customerAmountMinor,
    quantity,
    lineTotalMinor: customerAmountMinor * quantity,
    disclosed: true,
    estimated: options.estimated ?? false,
  };
}

function newId(): string {
  return `q_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function calculateQuote(input: QuoteInput): Quote {
  const { service, provider, rules, config } = input;
  const now = input.now ?? new Date();
  const medicineQuantity = input.medicineQuantity ?? 1;

  if (!Number.isInteger(medicineQuantity) || medicineQuantity < 1 || medicineQuantity > MAX_MEDICINE_QUANTITY) {
    throw new RangeError(`medicineQuantity must be an integer between 1 and ${MAX_MEDICINE_QUANTITY}`);
  }

  const items: QuoteLineItem[] = [];

  items.push(
    lineItem("visit", `Visit fee — ${service.name}`, service.basePriceMinor, marginFor(rules, "visit", service.basePriceMinor)),
  );

  if (service.procedureFeeMinor > 0) {
    items.push(
      lineItem("procedure", "Procedure fee", service.procedureFeeMinor, marginFor(rules, "procedure", service.procedureFeeMinor), {
        estimated: service.requiresConfirmation,
      }),
    );
  }

  if (input.includeMedicine && service.medicineEstimateMinor > 0) {
    // Medicine costs are always estimates until the provider confirms the actual items.
    items.push(
      lineItem(
        "medicine",
        "Medicines & consumables",
        service.medicineEstimateMinor,
        marginFor(rules, "medicine", service.medicineEstimateMinor),
        { quantity: medicineQuantity, estimated: true },
      ),
    );
  }

  if (provider.travelFeeMinor > 0) {
    items.push(lineItem("travel", "Travel fee", provider.travelFeeMinor, marginFor(rules, "travel", provider.travelFeeMinor)));
  }

  const platformRule = findRule(rules, "platform_fee");
  if (platformRule) {
    // Percentage platform fees are charged on the provider's service value (visit + procedure).
    const serviceValue = items
      .filter((item) => item.type === "visit" || item.type === "procedure")
      .reduce((sum, item) => sum + item.baseAmountMinor * item.quantity, 0);
    const fee = platformRule.mode === "fixed" ? platformRule.value : percentOfMinor(serviceValue, platformRule.value);
    if (fee > 0) items.push(lineItem("platform_fee", platformRule.label || "Platform fee", 0, fee));
  }

  const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);

  const taxableMinor = items
    .filter((item) => config.taxAppliesTo.includes(item.type))
    .reduce((sum, item) => sum + item.lineTotalMinor, 0);
  const taxMinor = config.taxRateBps > 0 ? percentOfMinor(taxableMinor, config.taxRateBps) : 0;

  if (config.taxRateBps > 0) {
    const pct = config.taxRateBps / 100;
    items.push(lineItem("tax", `${config.taxLabel} (${pct}%)`, taxMinor, 0));
  }

  const providerPayoutMinor = items
    .filter((item) => item.type !== "tax" && item.type !== "platform_fee")
    .reduce((sum, item) => sum + item.baseAmountMinor * item.quantity, 0);
  const platformEarningsMinor = items.reduce((sum, item) => sum + item.marginAmountMinor * item.quantity, 0);
  const hasEstimates = items.some((item) => item.estimated);

  return {
    id: input.quoteId ?? newId(),
    bookingId: input.bookingId ?? null,
    status: hasEstimates ? "estimated" : "preview",
    currency: config.currency,
    lineItems: items,
    subtotalMinor,
    taxMinor,
    totalMinor: subtotalMinor + taxMinor,
    providerPayoutMinor,
    platformEarningsMinor,
    hasEstimates,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.quoteValidityMinutes * 60_000).toISOString(),
  };
}

/** Checks the invariants every stored quote must satisfy. Returns a list of problems (empty = valid). */
export function validateQuoteInvariants(quote: Quote): string[] {
  const problems: string[] = [];
  for (const item of quote.lineItems) {
    if (item.customerAmountMinor !== item.baseAmountMinor + item.marginAmountMinor) {
      problems.push(`${item.id}: customer amount must equal base + margin`);
    }
    if (item.lineTotalMinor !== item.customerAmountMinor * item.quantity) {
      problems.push(`${item.id}: line total must equal customer amount × quantity`);
    }
    if (!item.disclosed) problems.push(`${item.id}: every charge must be disclosed`);
  }
  const nonTax = quote.lineItems.filter((item) => item.type !== "tax");
  const subtotal = nonTax.reduce((sum, item) => sum + item.lineTotalMinor, 0);
  if (subtotal !== quote.subtotalMinor) problems.push("subtotal does not match line items");
  if (quote.subtotalMinor + quote.taxMinor !== quote.totalMinor) problems.push("total must equal subtotal + tax");
  if (quote.providerPayoutMinor + quote.platformEarningsMinor + quote.taxMinor !== quote.totalMinor) {
    problems.push("payout + platform earnings + tax must equal total");
  }
  return problems;
}

/** Human-readable description of a pricing rule, e.g. "15% of base" or "₹49 fixed". */
export function describeRule(rule: PricingRule, formatMoney: (minor: number) => string): string {
  if (!rule.active) return "Off";
  return rule.mode === "fixed" ? `${formatMoney(rule.value)} fixed` : `${rule.value / 100}% of base`;
}
