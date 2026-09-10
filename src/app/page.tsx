import { existsSync } from "node:fs";
import path from "node:path";
import { ArrowUpRight, BadgeCheck, HeartHandshake, Lock, Plus, Receipt, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-meta";
import { EmergencyBanner } from "@/components/emergency-banner";
import { HomeSearch } from "@/components/home-search";
import { ButtonLink } from "@/components/ui/button";
import { isSignedIn } from "@/lib/auth";
import { CARE_SERVICES } from "@/lib/care-services";
import { PROFESSION_LABELS } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { getRepository } from "@/lib/db";
import { initials } from "@/lib/formatters";
import { toQuery } from "@/lib/location";
import type { CategoryId, ProviderProfile } from "@/types";

const TRUST_POINTS = [
  {
    icon: BadgeCheck,
    title: "Verified professionals",
    body: "Doctors and nurses show their council registration. Every provider displays their verification status.",
  },
  {
    icon: Receipt,
    title: "Transparent, itemised pricing",
    body: "See the visit fee, medicines, travel, platform fee and tax as separate lines before you confirm.",
  },
  {
    icon: Lock,
    title: "Your location stays private",
    body: "Your address is shared with a provider only after you give consent and confirm a booking.",
  },
];

const STEPS = [
  { title: "Tell us where", body: "Search your area or use your current location." },
  { title: "Choose a provider", body: "Compare distance, availability, ratings, credentials and prices." },
  { title: "Request a visit", body: "Pick a time window, review the full quote and confirm." },
];

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
const HERO_TEAM: CategoryId[] = ["nurse", "doctor", "physiotherapist"];

const PROFESSION_PLURALS: Record<CategoryId, string> = {
  nurse: "Nurses",
  doctor: "Doctors",
  physiotherapist: "Physiotherapists",
  phlebotomist: "Lab technicians",
  babysitter: "Nannies",
  caregiver: "Caregivers",
};

/** 3420 → "3.4k+"; small numbers stay exact. */
function compactCount(n: number): string {
  return n >= 1000 ? `${Math.floor(n / 100) / 10}k+` : String(n);
}

function PortraitCard({ provider, featured }: { provider: ProviderProfile; featured: boolean }) {
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
            {PROFESSION_LABELS[provider.category]} · {provider.baseLocation.city}
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-1 text-[11px] sm:text-xs">
            <Star aria-hidden className="size-3.5 shrink-0 fill-amber-400 text-amber-500" />
            <span className="font-semibold">{provider.rating.toFixed(1)}</span>
            <BadgeCheck aria-hidden className="ml-1 size-3.5 shrink-0 text-emerald-600" />
            <span className="truncate text-ink-muted">Verified</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

/** Concentric arcs, dot texture and floating plus signs behind the team photo (or provider portraits). */
function HeroTeam({ team, photo }: { team: ProviderProfile[]; photo: string | null }) {
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
          alt="A doctor, a nurse and a caregiver"
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
            <PortraitCard key={provider.id} provider={provider} featured={index === 1} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col-reverse text-right">
        <dt className="text-sm text-ink-muted">{label}</dt>
        <dd className="text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">{value}</dd>
      </div>
      <span aria-hidden className="relative h-20 w-px bg-brand-300">
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-brand-600" />
      </span>
    </div>
  );
}

export default async function HomePage() {
  const repo = getRepository();
  const [categories, config, providers, signedIn] = await Promise.all([
    repo.listCategories(),
    repo.getPlatformConfig(),
    repo.listProviders(),
    isSignedIn(),
  ]);

  const active = categories.filter((c) => c.active);
  const activeIds = new Set(active.map((c) => c.id));
  const verified = providers.filter((p) => p.active && p.verificationStatus === "verified" && activeIds.has(p.category));
  const reviewTotal = verified.reduce((sum, p) => sum + p.reviewCount, 0);
  const team = HERO_TEAM.map((category) =>
    verified.filter((p) => p.category === category).sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)[0],
  ).filter((p): p is ProviderProfile => Boolean(p));

  return (
    <>
      <EmergencyBanner emergencyNumber={config.emergencyNumber} />

      <section aria-labelledby="hero-heading" className="hero-surface">
        <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16">
          <p className="text-center text-xs font-bold tracking-[0.18em] text-brand-700 uppercase sm:text-sm">
            Home visits · Delhi-NCR · Mumbai · Bengaluru
          </p>
          <h1
            id="hero-heading"
            className="mx-auto mt-4 max-w-4xl text-center text-4xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-6xl"
          >
            Trusted <span className="text-brand-600">Care</span> at Your Doorstep
          </h1>

          <div className="mt-4 grid items-end gap-8 lg:mt-6 lg:grid-cols-[1fr_minmax(0,36rem)_1fr]">
            {/* Centred under the headline on small screens; a left column beside the portraits on desktop. */}
            <div className="order-2 flex flex-col items-center space-y-6 text-center lg:order-1 lg:items-start lg:self-center lg:pb-16 lg:text-left">
              <p className="max-w-md text-lg leading-relaxed text-ink-muted lg:max-w-xs">
                Home nursing, injections & IV, physiotherapy, elderly care and lab tests — from verified professionals near
                you, with every rupee explained before you book.
              </p>
              <a href="#find-care" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
                Find a verified professional <ArrowUpRight aria-hidden className="size-4" />
              </a>
              <div className="flex items-center gap-3 text-left">
                <span className="grid size-11 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
                  <HeartHandshake aria-hidden className="size-6" />
                </span>
                <div>
                  <p className="text-3xl font-bold tracking-tight text-ink">{verified.length}</p>
                  <p className="text-sm text-ink-muted">verified professionals</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <HeroTeam team={team} photo={heroPhotoAvailable() ? HERO_PHOTO : null} />
            </div>

            <dl className="order-3 flex justify-center gap-10 lg:flex-col lg:items-end lg:justify-center lg:gap-8 lg:self-center lg:pb-16">
              <Stat value={String(CARE_SERVICES.length)} label="Home care services" />
              <Stat value={compactCount(reviewTotal)} label="Reviews from families" />
            </dl>
          </div>
        </div>

        {/* Floating action pill, overlapping the strip below as in the hero design. */}
        <div className="relative z-10 -mb-9 flex justify-center px-4">
          <div className="flex gap-2 rounded-full bg-white p-2 shadow-[0_18px_40px_-16px_rgb(30_64_140/0.5)] ring-1 ring-line">
            <ButtonLink href="#find-care" size="lg" data-testid="hero-book">
              Book a home visit
            </ButtonLink>
            <ButtonLink href={signedIn ? "/bookings" : "/login"} size="lg" variant="outline">
              {signedIn ? "My bookings" : "Log in"}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section aria-label="Care professionals on HealNest Bharat" className="border-b border-line bg-white pt-16 pb-10">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-4 sm:px-6">
          {active.map((category) => (
            <li key={category.id}>
              <Link
                href={`/discover${toQuery({ category: category.id })}`}
                className="flex items-center gap-2.5 text-lg font-bold text-slate-500 transition-colors hover:text-brand-700"
              >
                <CategoryIcon category={category.id} className="size-6" />
                {PROFESSION_PLURALS[category.id]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="find-care" aria-labelledby="find-care-heading" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 id="find-care-heading" className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Find <span className="text-brand-600">care</span> near you
          </h2>
          <p className="mt-2 text-ink-muted">Choose your area, then the help you need.</p>
        </div>
        <HomeSearch categories={active} />
      </section>

      <section aria-labelledby="trust-heading" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <h2 id="trust-heading" className="sr-only">
          Why HealNest Bharat
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon aria-hidden className="size-6" />
              </span>
              <h3 className="mt-4 font-bold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-heading" className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 id="how-heading" className="text-center text-3xl font-extrabold tracking-tight text-ink">
            How it works
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
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
          <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-ink-muted">
            HealNest Bharat connects you with independent providers. It is not an emergency service and does not offer
            diagnosis or treatment advice. Babysitters and caregivers provide non-medical support only.
          </p>
        </div>
      </section>
    </>
  );
}
