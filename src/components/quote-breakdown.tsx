import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import type { Quote } from "@/types";

/**
 * Itemised quote. Every charge is its own row; any platform margin is shown next to the original cost.
 * `variant="snapshot"` is the immutable price recorded on a booking.
 */
export function QuoteBreakdown({ quote, variant = "live", className }: { quote: Quote; variant?: "live" | "snapshot"; className?: string }) {
  const money = (minor: number) => formatMoney(minor, quote.currency);
  const taxLine = quote.lineItems.find((item) => item.type === "tax");
  const items = quote.lineItems.filter((item) => item.type !== "tax");

  return (
    <div className={cn("text-sm", className)} data-testid="quote-breakdown">
      <table className="w-full border-collapse">
        <caption className="sr-only">Price breakdown</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-line align-top" data-testid={`quote-line-${item.type}`}>
              <th scope="row" className="py-3 pr-3 text-left font-normal">
                <span className="flex flex-wrap items-center gap-1.5 font-semibold text-ink">
                  {item.label}
                  {item.quantity > 1 && <span className="font-normal text-ink-muted">× {item.quantity}</span>}
                  {item.estimated && <Badge tone="warning">Estimated</Badge>}
                </span>
                {item.type === "platform_fee" ? (
                  <span className="mt-0.5 block text-xs text-ink-muted">HealNest Bharat service fee (platform earnings)</span>
                ) : item.marginAmountMinor > 0 ? (
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    Original cost {money(item.baseAmountMinor)} + platform margin {money(item.marginAmountMinor)} ={" "}
                    {money(item.customerAmountMinor)}
                    {item.quantity > 1 ? " each" : ""}
                  </span>
                ) : item.quantity > 1 ? (
                  <span className="mt-0.5 block text-xs text-ink-muted">{money(item.customerAmountMinor)} each</span>
                ) : null}
              </th>
              <td className="py-3 text-right font-semibold whitespace-nowrap text-ink tabular-nums">{money(item.lineTotalMinor)}</td>
            </tr>
          ))}
          <tr className="border-b border-line">
            <th scope="row" className="py-2.5 text-left font-medium text-ink-muted">
              Subtotal
            </th>
            <td className="py-2.5 text-right whitespace-nowrap tabular-nums">{money(quote.subtotalMinor)}</td>
          </tr>
          {taxLine && (
            <tr className="border-b border-line" data-testid="quote-line-tax">
              <th scope="row" className="py-2.5 text-left font-medium text-ink-muted">
                {taxLine.label}
              </th>
              <td className="py-2.5 text-right whitespace-nowrap tabular-nums">{money(quote.taxMinor)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-3 text-left text-base font-bold text-ink">
              {quote.hasEstimates ? "Estimated total" : "Total"}
            </th>
            <td className="pt-3 text-right text-xl font-extrabold whitespace-nowrap text-ink tabular-nums" data-testid="quote-total">
              {money(quote.totalMinor)}
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-3 text-xs text-ink-muted">
        Provider receives {money(quote.providerPayoutMinor)} · Platform earns {money(quote.platformEarningsMinor)}
        {quote.taxMinor > 0 ? ` · Tax ${money(quote.taxMinor)}` : ""}
      </p>

      {quote.hasEstimates && (
        <p className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          Items marked “Estimated” are confirmed by the provider before the visit. If the actual cost differs, you will be
          asked to approve the change — you are never charged silently.
        </p>
      )}
      {variant === "snapshot" && (
        <p className="mt-3 text-xs text-ink-muted">
          Price snapshot recorded {formatDateTime(quote.createdAt)}. Later pricing changes do not affect this booking.
        </p>
      )}
    </div>
  );
}
