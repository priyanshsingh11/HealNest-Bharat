import { Clock, Languages, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { CategoryIcon, KIND_TILE, KindBadge, VerificationBadge } from "@/components/category-meta";
import { categoryKind, categoryName } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatDistance, formatMoney, formatSlotLabel, initials } from "@/lib/formatters";
import type { ProviderSearchResult } from "@/types";

/** Answers at a glance: who, what, how far, how soon, how well rated, and from what price. */
export function ProviderCard({ result, href }: { result: ProviderSearchResult; href: string }) {
  const { provider, distanceKm, earliestSlot, startingPriceMinor, services } = result;
  const kind = categoryKind(provider.category);

  return (
    <article
      data-testid="provider-card"
      className="group relative flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md sm:flex-row"
    >
      <div className={cn("relative grid size-16 shrink-0 place-items-center rounded-2xl text-lg font-bold", KIND_TILE[kind])} aria-hidden>
        {initials(provider.name)}
        <span className="absolute -right-1.5 -bottom-1.5 grid size-7 place-items-center rounded-full border-2 border-white bg-white">
          <CategoryIcon category={provider.category} className="size-4" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-ink">
            <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
              {provider.name}
            </Link>
          </h3>
          <VerificationBadge status={provider.verificationStatus} />
        </div>
        <p className="mt-0.5 text-sm font-medium text-ink-muted">
          {categoryName(provider.category)} · {provider.yearsExperience} yrs experience
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <KindBadge category={provider.category} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Distance</dt>
            <MapPin aria-hidden className="size-4 text-ink-muted" />
            <dd>
              {distanceKm === null ? provider.baseLocation.locality : `${formatDistance(distanceKm)} away`}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Rating</dt>
            <Star aria-hidden className="size-4 fill-amber-400 text-amber-500" />
            <dd>
              <span className="font-semibold">{provider.rating.toFixed(1)}</span>{" "}
              <span className="text-ink-muted">({provider.reviewCount})</span>
            </dd>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <dt className="sr-only">Earliest availability</dt>
            <Clock aria-hidden className="size-4 text-ink-muted" />
            <dd className={earliestSlot ? "font-medium text-emerald-800" : "text-ink-muted"}>
              {earliestSlot ? `Next: ${formatSlotLabel(earliestSlot.startAt)}` : "No open slots this week"}
            </dd>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 sm:col-span-4">
            <dt className="sr-only">Languages</dt>
            <Languages aria-hidden className="size-4 text-ink-muted" />
            <dd className="text-ink-muted">{provider.languages.join(", ")}</dd>
          </div>
        </dl>
        <p className="mt-2 truncate text-xs text-ink-muted">
          {services.map((s) => s.name).join(" · ")}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2 border-t border-line pt-3 sm:w-36 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
        <div className="sm:text-right">
          <p className="text-xs text-ink-muted">Visits from</p>
          <p className="text-xl font-extrabold text-ink" data-testid="starting-price">
            {formatMoney(startingPriceMinor)}
          </p>
          <p className="text-xs text-ink-muted">+ travel & fees</p>
        </div>
        <span className="text-sm font-semibold text-brand-700 group-hover:underline" aria-hidden>
          View profile →
        </span>
      </div>
    </article>
  );
}
