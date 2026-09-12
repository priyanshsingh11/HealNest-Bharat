import {
  Activity,
  Bandage,
  ClipboardList,
  HandHeart,
  Pill,
  Pipette,
  UtensilsCrossed,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { findCareService } from "@/lib/care-services";

/** One icon per scope heading in the home-nursing service. Anything unmapped falls back to the clipboard. */
const SCOPE_ICONS: Record<string, LucideIcon> = {
  "Patient Monitoring": Activity,
  "Medication & Treatment": Pill,
  "Basic Nursing Care": HandHeart,
  "Catheter/Tube Care": Pipette,
  "Wound Care": Bandage,
  "Respiratory Care": Wind,
  "Nutrition & Elimination": UtensilsCrossed,
  Documentation: ClipboardList,
};

/**
 * Reference list of what home nursing can involve — not a promise that every nurse does all of it.
 * The wording here is deliberately descriptive: the actual scope of a visit is set by the doctor's
 * advice, the nurse's own competency and what the family agrees with the provider.
 */
export function NursingScope() {
  const scope = findCareService("home-nursing")?.scope;
  if (!scope?.length) return null;

  return (
    <section aria-labelledby="nursing-scope-heading" className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-brand-700 uppercase sm:text-sm">For reference</p>
          <h2 id="nursing-scope-heading" className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            What home <span className="text-brand-gradient">nursing</span> can involve
          </h2>
          <p className="mt-3 text-ink-muted">
            The areas a registered nurse may work across at home. What happens on your visit is decided by your doctor’s
            advice, the nurse’s own competency and what you agree with the provider before booking.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scope.map((item) => {
            const Icon = SCOPE_ICONS[item.title] ?? ClipboardList;
            return (
              <li key={item.title} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon aria-hidden className="size-5" />
                </span>
                <h3 className="mt-4 font-bold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-muted">{item.description}</p>
              </li>
            );
          })}
        </ul>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-ink-muted">
          This is a general description of home nursing, not a list of services HealNest Bharat guarantees. Medicines and
          injections are given only against a valid prescription from a registered medical practitioner.
        </p>
      </div>
    </section>
  );
}
