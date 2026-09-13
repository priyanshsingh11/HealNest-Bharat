import { existsSync } from "node:fs";
import path from "node:path";
import { ArrowDown, BadgeCheck, HeartHandshake, Lock, Plus, Receipt, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryIcon, ComingSoonBadge } from "@/components/category-meta";
import { EmergencyBanner } from "@/components/emergency-banner";
import { HomeSearch } from "@/components/home-search";
import { Marquee } from "@/components/marquee";
import { NursingScope } from "@/components/nursing-scope";
import { ButtonLink } from "@/components/ui/button";
import { isSignedIn } from "@/lib/auth";
import { AVAILABLE_CARE_SERVICES } from "@/lib/care-services";
import { bookableCategories, isComingSoon } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { getRepository } from "@/lib/db";
import { initials } from "@/lib/formatters";
import type { Locale } from "@/lib/i18n/config";
import { domainMessages } from "@/lib/i18n/messages/domain";
import { homeMessages } from "@/lib/i18n/messages/home";
import { getLocale } from "@/lib/i18n/server";
import { toQuery } from "@/lib/location";
import type { CategoryId, ProviderProfile } from "@/types";

/** Icons for the trust points; their copy is in homeMessages.how.trust. */
const TRUST_POINTS = [
  { key: "verified", icon: BadgeCheck },
  { key: "pricing", icon: Receipt },
  { key: "privacy", icon: Lock },
] as const;

/** Background-removed team photo for the hero. Until it exists, the hero shows provider portrait cards. */
const HERO_PHOTO = "/images/hero-team.png";

function heroPhotoAvailable(): boolean {
  return existsSync(path.join(process.cwd(), "public", HERO_PHOTO));
}

/**
 * ✏️ Hand-tune the hero photo here — change a number, save, and the page updates.
 *   zoom:  size. 1 = fits the frame, 1.2 = 20% bigger, 0.9 = 10% smaller. Grows upwards from the bottom edge.
 *   moveX: pixels to shift the photo. Negative = left, positive = right.
 *   moveY: pixels to shift the photo. Negative = up, positive = down.
 */
const HERO_PHOTO_ADJUST = { zoom: 1, moveX: 0, moveY: 28 };

/** Hero portraits, left to right. The middle one is featured. */
const HERO_TEAM: CategoryId[] = ["caregiver", "nurse", "physiotherapist"];

/** 3420 → "3.4k+"; small numbers stay exact. */
function compactCount(n: number): string {
  return n >= 1000 ? `${Math.floor(n / 100) / 10}k+` : String(n);
}

function PortraitCard({ provider, featured, locale }: { provider: ProviderProfile; featured: boolean; locale: Locale }) {
  const domain = domainMessages[locale];
  return (
    <li className={cn("shrink-0", featured ? "w-[36%] -translate-y-8" : "w-[29%]")}>
      <Link
        href={`/providers/${provider.id}`}
        className="block rounded-[1.75rem] bg-white/90 p-2 shadow-[0_24px_48px_-24px_rgb(30_64_140/0.5)] ring-1 ring-white transition hover:-translate-y-1"
      >
        <div
          className={cn(
            "relative grid aspect-[4/5] place-items-center rounded-[1.35rem] bg-gradient-to-br from-brand-100 to-brand-300 font-extrabold text-brand-800",
            featured ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
          )}
          aria-hidden
        >
          {initials(provider.name)}
          <span className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-white text-brand-700 shadow sm:size-9">
            <CategoryIcon category={provider.category} className="size-4" />
          </span>
        </div>
        <div className="px-1.5 pt-2.5 pb-1.5 sm:px-2">
          <p className="truncate text-xs font-bold text-ink sm:text-sm">{provider.name}</p>
          <p className="truncate text-[11px] text-ink-muted sm:text-xs">
            {domain.professions[provider.category]} · {provider.baseLocation.city}
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-1 text-[11px] sm:text-xs">
            <Star aria-hidden className="size-3.5 shrink-0 fill-amber-400 text-amber-500" />
            <span className="font-semibold">{provider.rating.toFixed(1)}</span>
            <BadgeCheck aria-hidden className="ml-1 size-3.5 shrink-0 text-emerald-600" />
            <span className="truncate text-ink-muted">{domain.verified}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

/** Concentric arcs, dot texture and floating plus signs behind the team photo (or provider portraits). */
function HeroTeam({ team, photo, locale }: { team: ProviderProfile[]; photo: string | null; locale: Locale }) {
  return (
    // Frame size: h-[…] is the height on phones / tablets (sm:) / desktops (lg:); max-w-xl is the width.
    // overflow-x-clip stops a zoomed photo from making the page scroll sideways on phones.
    <div className="relative mx-auto h-[19rem] w-full max-w-xl overflow-x-clip sm:h-[26rem] lg:h-[29rem]">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {[100, 80, 60].map((size) => (
          <div
            key={size}
            className="absolute bottom-0 left-1/2 aspect-square -translate-x-1/2 translate-y-1/2 rounded-full border border-white"
            style={{ width: `${size}%` }}
          />
        ))}
        <div className="dot-grid absolute inset-0" />
        <Plus className="absolute top-[14%] left-[16%] size-9 text-white" strokeWidth={3} />
        <Plus className="absolute top-[30%] right-[10%] size-7 text-white" strokeWidth={3} />
      </div>
      {photo ? (
        <Image
          src={photo}
          alt={homeMessages[locale].hero.photoAlt}
          fill
          priority
          // Requests a larger file than the frame so zooming in stays sharp.
          sizes="(min-width: 1024px) 48rem, 100vw"
          className="object-contain object-bottom"
          style={{
            transform: `translate(${HERO_PHOTO_ADJUST.moveX}px, ${HERO_PHOTO_ADJUST.moveY}px) scale(${HERO_PHOTO_ADJUST.zoom})`,
            transformOrigin: "bottom center",
          }}
        />
      ) : (
        <ul className="absolute inset-x-0 bottom-6 flex items-end justify-center gap-2 px-2 sm:bottom-10 sm:gap-4">
          {team.map((provider, index) => (
            <PortraitCard key={provider.id} provider={provider} featured={index === 1} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Centred number over its label on phones; right-aligned beside a gradient rule on desktop. */
function Stat({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex flex-col-reverse text-center lg:text-right">
        <dt className="text-xs text-ink-muted sm:text-sm">{label}</dt>
        <dd className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-5xl">{value}</dd>
      </div>
      <span aria-hidden className="relative hidden h-20 w-px bg-gradient-to-b from-brand-300 to-leaf-300 lg:block">
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-leaf-500" />
      </span>
    </div>
  );
}

export default async function HomePage() {
  const repo = getRepository();
  const [categories, config, providers, signedIn, locale] = await Promise.all([
    repo.listCategories(),
    repo.getPlatformConfig(),
    repo.listProviders(),
    isSignedIn(),
    getLocale(),
  ]);
  const t = homeMessages[locale];

  const active = categories.filter((c) => c.active);
  const bookable = bookableCategories(categories);
  const activeIds = new Set(bookable.map((c) => c.id));
  const verified = providers.filter((p) => p.active && p.verificationStatus === "verified" && activeIds.has(p.category));
  const reviewTotal = verified.reduce((sum, p) => sum + p.reviewCount, 0);
  const team = HERO_TEAM.map((category) =>
    verified.filter((p) => p.category === category).sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)[0],
  ).filter((p): p is ProviderProfile => Boolean(p));

  return (
    <>
      <EmergencyBanner emergencyNumber={config.emergencyNumber} />

      <section aria-labelledby="hero-heading" className="hero-surface">
        {/* Bottom padding on phones keeps the stats clear of the floating pill below. */}
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-14 sm:px-6 sm:pt-16 lg:pb-0">
          <p className="text-center text-xs font-bold tracking-[0.18em] text-brand-700 uppercase sm:text-sm">
            {t.hero.eyebrow}
          </p>
          <h1
            id="hero-heading"
            className="mx-auto mt-4 max-w-4xl text-center text-4xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-6xl"
          >
            {t.hero.headingBefore}
            <span className="text-brand-gradient">{t.hero.headingHighlight}</span>
            {t.hero.headingAfter}
          </h1>

          <div className="mt-4 grid items-end gap-8 lg:mt-6 lg:grid-cols-[1fr_minmax(0,36rem)_1fr]">
            {/* Centred under the headline on small screens; a left column beside the portraits on desktop. */}
            <div className="order-2 flex flex-col items-center space-y-6 text-center lg:order-1 lg:items-start lg:self-center lg:pb-16 lg:text-left">
              <p className="max-w-md text-lg leading-relaxed text-ink-muted lg:max-w-xs">{t.hero.intro}</p>
              <a href="#find-care" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
                {t.hero.findLink} <ArrowDown aria-hidden className="size-4" />
              </a>
              {/* Desktop only; phones show this count in the stats row. Hidden until someone is verified. */}
              {verified.length > 0 && (
                <div className="hidden items-center gap-3 text-left lg:flex">
                  <span className="grid size-11 place-items-center rounded-2xl bg-white text-leaf-600 shadow-sm">
                    <HeartHandshake aria-hidden className="size-6" />
                  </span>
                  <div>
                    <p className="text-3xl font-bold tracking-tight text-ink">{compactCount(verified.length)}</p>
                    <p className="text-sm text-ink-muted">{t.hero.verifiedCount}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <HeroTeam team={team} photo={heroPhotoAvailable() ? HERO_PHOTO : null} locale={locale} />
            </div>

            {/* Phones: one evenly spaced row with rules between. Desktop: a right-hand column. Zero counts are left out. */}
            <dl className="order-3 flex justify-center divide-x divide-brand-200 *:px-5 sm:*:px-8 lg:flex-col lg:items-end lg:justify-center lg:gap-8 lg:divide-x-0 lg:self-center lg:pb-16 lg:*:px-0">
              {verified.length > 0 && (
                <Stat value={compactCount(verified.length)} label={t.stats.verified} className="lg:hidden" />
              )}
              <Stat value={String(AVAILABLE_CARE_SERVICES.length)} label={t.stats.services} />
              {reviewTotal > 0 && <Stat value={compactCount(reviewTotal)} label={t.stats.reviews} />}
            </dl>
          </div>
        </div>

        {/* Floating action pill, overlapping the strip below as in the hero design. */}
        <div className="relative z-10 -mb-9 flex justify-center px-4">
          <div className="rounded-full bg-white p-2 shadow-[0_18px_40px_-16px_rgb(30_64_140/0.5)] ring-1 ring-line">
            <ButtonLink href={signedIn ? "#find-care" : "/login"} size="lg" data-testid="hero-book">
              {t.hero.book}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section aria-label={t.professionsAria} className="border-b border-line bg-white pt-16 pb-10">
        <Marquee>
          {(hidden) =>
            active.map((category) =>
              isComingSoon(category.id) ? (
                <li key={category.id} className="shrink-0 px-4 sm:px-6">
                  <span className="flex items-center gap-2.5 py-2 text-lg font-bold whitespace-nowrap text-ink-muted/70 sm:text-xl">
                    <CategoryIcon category={category.id} className="size-6 text-brand-600/60" />
                    {t.professionPlurals[category.id]}
                    <ComingSoonBadge />
                  </span>
                </li>
              ) : (
                <li key={category.id} className="shrink-0 px-4 sm:px-6">
                  <Link
                    href={`/discover${toQuery({ category: category.id })}`}
                    tabIndex={hidden ? -1 : undefined}
                    className="flex items-center gap-2.5 py-2 text-lg font-bold whitespace-nowrap text-ink-muted transition-colors hover:text-brand-700 sm:text-xl"
                  >
                    <CategoryIcon category={category.id} className="size-6 text-brand-600" />
                    {t.professionPlurals[category.id]}
                  </Link>
                </li>
              ),
            )
          }
        </Marquee>
      </section>

      <section id="find-care" aria-labelledby="find-care-heading" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 id="find-care-heading" className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {t.findCare.headingBefore}
            <span className="text-brand-gradient">{t.findCare.headingHighlight}</span>
            {t.findCare.headingAfter}
          </h2>
          <p className="mt-2 text-ink-muted">{t.findCare.subtitle}</p>
        </div>
        <HomeSearch categories={active} />
      </section>

      <NursingScope />

      <section aria-labelledby="how-heading" className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 id="how-heading" className="text-center text-3xl font-extrabold tracking-tight text-ink">
            {t.how.heading}
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {t.how.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-b from-brand-500 to-brand-700 font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-bold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <ul aria-label={t.how.trustAria} className="mt-12 grid gap-6 border-t border-line pt-10 md:grid-cols-3">
            {TRUST_POINTS.map(({ key, icon: Icon }) => (
              <li key={key} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf-50 text-leaf-700">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold text-ink">{t.how.trust[key].title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{t.how.trust[key].body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-ink-muted">{t.how.disclaimer}</p>
        </div>
      </section>
    </>
  );
}
