"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Lock, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch, type DefaultValues, type FieldPath } from "react-hook-form";
import { LocationPicker } from "@/components/location-picker";
import { QuoteBreakdown } from "@/components/quote-breakdown";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { ApiRequestError, apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { formatDistance, formatDuration, formatMoney, formatTime, groupByDay } from "@/lib/formatters";
import { roundedDistanceKm } from "@/lib/geo";
import type { ChosenLocation } from "@/lib/location";
import { calculateQuote, MAX_MEDICINE_QUANTITY } from "@/lib/pricing";
import { bookingFormSchema, NOTES_MAX, type BookingFormValues, type BookingRequest } from "@/lib/validations";
import type { AvailabilitySlot, Booking, PlatformConfig, PricingRule, ProviderProfile, Service } from "@/types";

type Props = {
  provider: ProviderProfile;
  services: Service[];
  slots: AvailabilitySlot[];
  rules: PricingRule[];
  config: PlatformConfig;
  initialServiceId?: string;
  initialSlotId?: string;
  initialLocation: ChosenLocation | null;
};

export function BookingForm({ provider, services, slots, rules, config, initialServiceId, initialSlotId, initialLocation }: Props) {
  const router = useRouter();
  const [location, setLocation] = useState<ChosenLocation | null>(initialLocation);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<BookingFormValues, unknown, BookingRequest>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      providerId: provider.id,
      serviceId: services.some((s) => s.id === initialServiceId) ? initialServiceId : services[0]?.id,
      slotId: slots.some((s) => s.id === initialSlotId) ? initialSlotId : "",
      addressLabel: "Home",
      addressText: "",
      latitude: initialLocation?.latitude,
      longitude: initialLocation?.longitude,
      notes: "",
      includeMedicine: false,
      medicineQuantity: 1,
      consentToShareLocation: false,
      acceptPriceBreakdown: false,
    } as DefaultValues<BookingFormValues>,
  });
  const { register, handleSubmit, formState, setValue, setError, control } = form;
  const { errors, isSubmitting, isSubmitSuccessful } = formState;

  const [serviceId, slotId, includeMedicine, medicineQuantity, notes] = useWatch({
    control,
    name: ["serviceId", "slotId", "includeMedicine", "medicineQuantity", "notes"],
  });
  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const offersMedicine = (service?.medicineEstimateMinor ?? 0) > 0;

  // Client-side preview using the same pricing module the server uses. The server recalculates on submit.
  const quote = calculateQuote({
    service,
    provider,
    rules,
    config,
    includeMedicine: Boolean(includeMedicine) && offersMedicine,
    medicineQuantity: Number(medicineQuantity) || 1,
    quoteId: "preview",
  });

  const distanceKm = location ? roundedDistanceKm(location, provider.baseLocation) : null;
  const outsideArea = distanceKm !== null && distanceKm > provider.serviceRadiusKm;
  const days = groupByDay(slots);
  const busy = isSubmitting || isSubmitSuccessful;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { booking } = await apiRequest<{ booking: Booking }>("/api/bookings", "POST", values);
      router.push(`/booking/${booking.id}?created=1`);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        for (const issue of error.issues) {
          if (issue.path) setError(issue.path as FieldPath<BookingFormValues>, { message: issue.message });
        }
        setServerError(error.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
      throw error; // keeps isSubmitSuccessful false
    }
  });

  return (
    <form
      id="booking-form"
      noValidate
      onSubmit={(e) => onSubmit(e).catch(() => undefined)}
      className="grid gap-6 pb-28 lg:grid-cols-[1fr_24rem] lg:pb-0"
    >
      <div className="min-w-0 space-y-6">
        {serverError && (
          <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {serverError}
          </div>
        )}

        <fieldset className="rounded-2xl border border-line bg-white p-5">
          <legend className="float-left mb-3 w-full text-base font-bold text-ink">1. Choose a service</legend>
          <div className="clear-both space-y-2">
            {services.map((s) => (
              <label
                key={s.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600",
                  serviceId === s.id ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-300",
                )}
              >
                <input type="radio" value={s.id} {...register("serviceId")} className="mt-1 size-4 accent-brand-700" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 font-semibold text-ink">{s.name}</span>
                    <span className="shrink-0 whitespace-nowrap font-bold text-ink">{formatMoney(s.basePriceMinor)}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    {s.description} · {formatDuration(s.durationMinutes)}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id="serviceId-error" message={errors.serviceId?.message} />
        </fieldset>

        <fieldset className="rounded-2xl border border-line bg-white p-5" aria-describedby="slot-hint">
          <legend className="float-left mb-3 w-full text-base font-bold text-ink">2. Pick a date & arrival window</legend>
          <Hint id="slot-hint">Times are in IST. The provider arrives within the chosen 2-hour window.</Hint>
          {days.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No open time windows this week. Please check back later.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {days.map((day) => (
                <div key={day.day}>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{day.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {day.items.map((slot) => (
                      <label
                        key={slot.id}
                        className={cn(
                          "cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600",
                          slotId === slot.id ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink hover:border-brand-300",
                        )}
                      >
                        <input type="radio" value={slot.id} {...register("slotId")} className="sr-only" data-testid="slot-option" />
                        {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
                        {slot.capacity > 1 && (
                          <span className="ml-1 text-xs font-medium opacity-80">· {slot.capacity - slot.bookedCount} left</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <FieldError id="slotId-error" message={errors.slotId?.message} />
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <legend className="float-left mb-3 w-full text-base font-bold text-ink">3. Visit address</legend>
          <LocationPicker
            label="Area"
            value={location}
            errorMessage={errors.latitude?.message}
            onChange={(next) => {
              setLocation(next);
              setValue("latitude", next?.latitude as number, { shouldValidate: formState.isSubmitted });
              setValue("longitude", next?.longitude as number, { shouldValidate: formState.isSubmitted });
            }}
          />
          {distanceKm !== null && (
            <p className={cn("text-sm", outsideArea ? "font-semibold text-rose-700" : "text-ink-muted")} role={outsideArea ? "alert" : undefined}>
              {outsideArea
                ? `This area is ${formatDistance(distanceKm)} away — outside ${provider.name}'s ${provider.serviceRadiusKm} km service area.`
                : `${formatDistance(distanceKm)} from the provider · within their ${provider.serviceRadiusKm} km service area.`}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <div>
              <Label htmlFor="addressLabel">Label</Label>
              <Input id="addressLabel" {...register("addressLabel")} aria-invalid={Boolean(errors.addressLabel)} aria-describedby="addressLabel-error" />
              <FieldError id="addressLabel-error" message={errors.addressLabel?.message} />
            </div>
            <div>
              <Label htmlFor="addressText">Full address</Label>
              <Input
                id="addressText"
                autoComplete="street-address"
                placeholder="House/flat no., building, street, landmark"
                {...register("addressText")}
                aria-invalid={Boolean(errors.addressText)}
                aria-describedby="addressText-error"
              />
              <FieldError id="addressText-error" message={errors.addressText?.message} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <legend className="float-left mb-3 w-full text-base font-bold text-ink">4. What help do you need?</legend>
          <div className="clear-both">
            <Label htmlFor="notes">Short description (optional)</Label>
            <Textarea
              id="notes"
              maxLength={NOTES_MAX}
              placeholder="e.g. Prescribed injection, prescription available at home. Elderly patient, ground floor."
              {...register("notes")}
              aria-invalid={Boolean(errors.notes)}
              aria-describedby="notes-hint notes-error"
            />
            <Hint id="notes-hint">
              Logistics only — please don&apos;t describe symptoms for diagnosis. {String(notes ?? "").length}/{NOTES_MAX}
            </Hint>
            <FieldError id="notes-error" message={errors.notes?.message} />
          </div>

          {offersMedicine && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <input id="includeMedicine" type="checkbox" className="mt-1 size-4 accent-brand-700" {...register("includeMedicine")} />
                <div className="flex-1">
                  <label htmlFor="includeMedicine" className="font-semibold text-ink">
                    Provider brings medicines & consumables (estimated {formatMoney(service.medicineEstimateMinor)} each)
                  </label>
                  <p className="mt-0.5 text-xs text-amber-900">
                    Estimate only — the provider confirms the actual cost before the visit.
                    {config.prescriptionRequiredForMedicine && ` ${config.prescriptionNote}`}
                  </p>
                  {includeMedicine && (
                    <div className="mt-3 max-w-40">
                      <Label htmlFor="medicineQuantity">Quantity</Label>
                      <Select id="medicineQuantity" {...register("medicineQuantity", { valueAsNumber: true })}>
                        {Array.from({ length: MAX_MEDICINE_QUANTITY }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-3 rounded-2xl border border-line bg-white p-5">
          <legend className="float-left mb-3 w-full text-base font-bold text-ink">5. Consent & confirmation</legend>
          <div className="clear-both flex items-start gap-3">
            <input
              id="consentToShareLocation"
              type="checkbox"
              className="mt-1 size-4 accent-brand-700"
              {...register("consentToShareLocation")}
              aria-invalid={Boolean(errors.consentToShareLocation)}
              aria-describedby="consent-error"
            />
            <div>
              <label htmlFor="consentToShareLocation" className="text-sm font-semibold text-ink">
                I agree to share this visit address and my phone number with {provider.name} for this booking only.
              </label>
              <FieldError id="consent-error" message={errors.consentToShareLocation?.message} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              id="acceptPriceBreakdown"
              type="checkbox"
              className="mt-1 size-4 accent-brand-700"
              {...register("acceptPriceBreakdown")}
              aria-invalid={Boolean(errors.acceptPriceBreakdown)}
              aria-describedby="price-error"
            />
            <div>
              <label htmlFor="acceptPriceBreakdown" className="text-sm font-semibold text-ink">
                I have reviewed the itemised price{quote.hasEstimates ? ", including estimated items," : ""} and the cancellation terms.
              </label>
              <FieldError id="price-error" message={errors.acceptPriceBreakdown?.message} />
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs text-ink-muted">
            <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            No payment is taken now. You pay only after the provider accepts (payments are simulated in this demo). Cancellation:{" "}
            {provider.cancellationPolicy}
          </p>
        </fieldset>
      </div>

      {/* Desktop: sticky quote summary. */}
      <aside aria-labelledby="quote-heading" className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 id="quote-heading" className="text-base font-bold">
            Your quote
          </h2>
          <p className="mb-2 text-xs text-ink-muted">Preview — the final price is recalculated securely when you confirm.</p>
          <QuoteBreakdown quote={quote} />
          <div className="mt-5 hidden lg:block">
            <Button type="submit" size="lg" className="w-full" disabled={busy || outsideArea} data-testid="confirm-booking">
              {busy && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
              {busy ? "Sending request…" : `Confirm request · ${formatMoney(quote.totalMinor)}`}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile: bottom summary bar. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-muted">{quote.hasEstimates ? "Estimated total" : "Total"}</p>
            <p className="text-lg font-extrabold">{formatMoney(quote.totalMinor)}</p>
            <a href="#quote-heading" className="text-xs font-semibold text-brand-700 underline">
              See breakdown
            </a>
          </div>
          <Button type="submit" size="lg" disabled={busy || outsideArea} data-testid="confirm-booking-mobile">
            {busy && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
            {busy ? "Sending…" : "Confirm request"}
          </Button>
        </div>
      </div>
    </form>
  );
}
