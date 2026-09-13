import { Clock, Languages, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { KindBadge, VerificationBadge, VerifiedTick } from "@/components/category-meta";
import { ProviderAvatar } from "@/components/provider-avatar";
import { formatDistance, formatMoney, formatSlotLabel } from "@/lib/formatters";
import { discoverMessages } from "@/lib/i18n/messages/discover";
import { domainMessages } from "@/lib/i18n/messages/domain";
import { getLocale } from "@/lib/i18n/server";
import type { ProviderSearchResult } from "@/types";

/** Answers at a glance: who, what, how far, how soon, how well rated, and from what price. */
export async function ProviderCard({ result, href }: { result: ProviderSearchResult; href: string }) {
  const { provider, distanceKm, earliestSlot, startingPriceMinor, services } = result;
  const locale = await getLocale();
  const t = discoverMessages[locale].card;

  return (
    <article
      data-testid="provider-card"
      className="group relative grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md sm:flex sm:flex-row"
    >
      <ProviderAvatar provider={provider} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-ink">
            <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
              {provider.name}
            </Link>
            {/* Inside the heading so the tick stays beside the last word when a long name wraps. */}
            {provider.verificationStatus === "verified" && <VerifiedTick className="ml-1.5 align-[-0.2em]" />}
          </h3>
          {provider.verificationStatus !== "verified" && <VerificationBadge status={provider.verificationStatus} />}
        </div>
        <p className="mt-0.5 text-sm font-medium text-ink-muted">
          {domainMessages[locale].categories[provider.category].name} · {t.experience(provider.yearsExperience)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <KindBadge category={provider.category} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t.distance}</dt>
            <MapPin aria-hidden className="size-4 text-ink-muted" />
            <dd>
              {distanceKm === null ? provider.baseLocation.locality : t.away(formatDistance(distanceKm))}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t.rating}</dt>
            <Star aria-hidden className="size-4 fill-amber-400 text-amber-500" />
            <dd>
              <span className="font-semibold">{provider.rating.toFixed(1)}</span>{" "}
              <span className="text-ink-muted">({provider.reviewCount})</span>
            </dd>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <dt className="sr-only">{t.earliest}</dt>
            <Clock aria-hidden className="size-4 text-ink-muted" />
            <dd className={earliestSlot ? "font-medium text-emerald-800" : "text-ink-muted"}>
              {earliestSlot ? t.next(formatSlotLabel(earliestSlot.startAt, new Date(), locale)) : t.noSlots}
            </dd>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 sm:col-span-4">
            <dt className="sr-only">{t.languages}</dt>
            <Languages aria-hidden className="size-4 text-ink-muted" />
            <dd className="text-ink-muted">{provider.languages.join(", ")}</dd>
          </div>
        </dl>
        <p className="mt-2 truncate text-xs text-ink-muted">
          {services.map((s) => s.name).join(" · ")}
        </p>
      </div>

      <div className="col-span-2 flex items-end justify-between gap-2 border-t border-line pt-3 sm:w-36 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
        <div className="sm:text-right">
          <p className="text-xs text-ink-muted">{t.visitsFrom}</p>
          <p className="text-xl font-extrabold text-ink" data-testid="starting-price">
            {formatMoney(startingPriceMinor)}
          </p>
          <p className="text-xs text-ink-muted">{t.travelAndFees}</p>
        </div>
        <span className="text-sm font-semibold text-brand-700 group-hover:underline" aria-hidden>
          {t.viewProfile}
        </span>
      </div>
    </article>
  );
}
