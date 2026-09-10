import { BadgeCheck, Lock, Receipt } from "lucide-react";
import { EmergencyBanner } from "@/components/emergency-banner";
import { HomeSearch } from "@/components/home-search";
import { getRepository } from "@/lib/db";

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

export default async function HomePage() {
  const repo = getRepository();
  const [categories, config] = await Promise.all([repo.listCategories(), repo.getPlatformConfig()]);

  return (
    <>
      <EmergencyBanner emergencyNumber={config.emergencyNumber} />

      <section className="bg-gradient-to-b from-brand-50 to-canvas">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Home visits · Delhi-NCR · Mumbai · Bengaluru</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Trusted care, at your doorstep.
            </h1>
            <p className="mt-4 text-lg text-ink-muted">
              Home nursing, injections & IV, wound dressing, physiotherapy, elderly care and lab tests at home — from verified
              professionals near you, with every rupee explained before you book.
            </p>
          </div>
          <div className="mt-8">
            <HomeSearch categories={categories.filter((c) => c.active)} />
          </div>
        </div>
      </section>

      <section aria-labelledby="trust-heading" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 id="trust-heading" className="sr-only">
          Why HealNest Bharat
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-2xl border border-line bg-white p-6">
              <Icon aria-hidden className="size-7 text-emerald-700" />
              <h3 className="mt-3 font-bold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-heading" className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 id="how-heading" className="text-xl font-bold text-ink">
            How it works
          </h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-700 font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-bold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-3xl text-sm text-ink-muted">
            HealNest Bharat connects you with independent providers. It is not an emergency service and does not offer
            diagnosis or treatment advice. Babysitters and caregivers provide non-medical support only.
          </p>
        </div>
      </section>
    </>
  );
}
