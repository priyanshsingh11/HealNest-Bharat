import { notFound, unprocessable } from "@/lib/errors";
import { calculateQuote } from "@/lib/pricing";
import type { CareRepository } from "@/lib/repository/types";
import type { QuoteRequest } from "@/lib/validations";
import type { Quote } from "@/types";

/** Loads everything needed to price a visit and returns the authoritative server-side quote. */
export async function buildQuote(
  repo: CareRepository,
  request: QuoteRequest,
  options: { bookingId?: string; now?: Date } = {},
): Promise<Quote> {
  const [provider, service, rules, config] = await Promise.all([
    repo.getProvider(request.providerId),
    repo.getService(request.serviceId),
    repo.listPricingRules(),
    repo.getPlatformConfig(),
  ]);
  if (!provider || !provider.active) throw notFound("Provider");
  if (!service || !service.active || service.providerId !== provider.id) {
    throw unprocessable("That service is not offered by this provider");
  }

  return calculateQuote({
    service,
    provider,
    rules,
    config,
    includeMedicine: request.includeMedicine && service.medicineEstimateMinor > 0,
    medicineQuantity: request.medicineQuantity,
    bookingId: options.bookingId ?? null,
    now: options.now,
  });
}
