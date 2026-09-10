"use client";

import { ArrowRight, Check, HeartHandshake, HeartPulse, UserRound, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CategoryIcon, KIND_TILE, VerificationBadge } from "@/components/category-meta";
import { Button } from "@/components/ui/button";
import { categoryKind, PROFESSION_LABELS } from "@/lib/categories";
import { apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import type { CategoryId, Role, VerificationStatus } from "@/types";

export type AccountType = "customer" | "caretaker";

export type CaretakerOption = {
  id: string;
  name: string;
  category: CategoryId;
  locality: string;
  city: string;
  verificationStatus: VerificationStatus;
};

const ACCOUNT_TYPES: { value: AccountType; title: string; body: string; icon: LucideIcon }[] = [
  {
    value: "customer",
    title: "Customer",
    body: "Book home nursing, doctor visits, physiotherapy, lab tests, nannies and more for yourself or your family.",
    icon: UserRound,
  },
  {
    value: "caretaker",
    title: "Caretaker",
    body: "Doctors, nurses, nannies, caregivers, physiotherapists and lab technicians who provide care at home.",
    icon: HeartHandshake,
  },
];

/** Radio-card styling: the native radio is visually hidden, the card shows checked and focus states. */
const OPTION_CARD =
  "relative flex cursor-pointer rounded-2xl border border-line bg-white shadow-sm transition hover:border-brand-300 " +
  "has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50 has-[:checked]:ring-2 has-[:checked]:ring-brand-700/20 " +
  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600/40";

type Props = {
  customerName: string;
  caretakers: CaretakerOption[];
  professions: CategoryId[];
  initialType: AccountType;
  /** Where to send a customer after login (validated server-side). */
  next: string | null;
  enabled: boolean;
};

/** Mock login: choose customer or caretaker (then profession and profile). Swap for real auth later. */
export function LoginForm({ customerName, caretakers, professions, initialType, next, enabled }: Props) {
  const router = useRouter();
  const [type, setType] = useState<AccountType>(initialType);
  const [profession, setProfession] = useState<CategoryId>(professions[0]);
  const [providerId, setProviderId] = useState(() => caretakers.find((c) => c.category === professions[0])?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const profiles = caretakers.filter((c) => c.category === profession);
  const selected = profiles.find((c) => c.id === providerId);
  const busy = !enabled || submitting || pending;

  function chooseProfession(id: CategoryId) {
    setProfession(id);
    setProviderId(caretakers.find((c) => c.category === id)?.id ?? "");
  }

  async function logIn(role: Role, destination: string, asProviderId?: string) {
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/api/session", "POST", { role, providerId: asProviderId });
      startTransition(() => {
        router.push(destination);
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not log in");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-700 text-white">
          <HeartPulse aria-hidden className="size-6" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">Log in to HealNest Bharat</h1>
        <p className="mt-2 text-ink-muted">Tell us how you use HealNest so we can take you to the right place.</p>
      </div>

      {!enabled && (
        <p role="status" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Sign-in is turned off in this deployment.
        </p>
      )}

      <fieldset className="mt-8">
        <legend className="mb-3 text-sm font-bold text-ink">I want to log in as</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCOUNT_TYPES.map(({ value, title, body, icon: Icon }) => (
            <label key={value} className={cn(OPTION_CARD, "flex-col gap-2 p-5")}>
              <input
                type="radio"
                name="account-type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
                data-testid={`login-as-${value}`}
              />
              <span className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-700 text-white">
                  <Icon aria-hidden className="size-6" />
                </span>
                {type === value && <Check aria-hidden className="size-5 text-brand-700" />}
              </span>
              <span className="mt-1 text-lg font-bold text-ink">{title}</span>
              <span className="text-sm text-ink-muted">{body}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        {type === "customer" ? (
          <section aria-labelledby="customer-heading">
            <h2 id="customer-heading" className="font-bold text-ink">
              Customer account
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Find and book care, track your visits and see every price before you confirm.</p>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <span className="grid size-10 place-items-center rounded-full bg-brand-700 text-white">
                <UserRound aria-hidden className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">{customerName}</p>
                <p className="text-xs text-ink-muted">Demo customer account</p>
              </div>
            </div>
            <Button size="lg" className="mt-5 w-full" disabled={busy} onClick={() => logIn("user", next ?? "/")} data-testid="login-submit">
              Log in as customer <ArrowRight aria-hidden className="size-4" />
            </Button>
          </section>
        ) : (
          <section aria-labelledby="caretaker-heading">
            <h2 id="caretaker-heading" className="font-bold text-ink">
              Caretaker account
            </h2>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-ink">What kind of care do you provide?</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {professions.map((id) => (
                  <label key={id} className={cn(OPTION_CARD, "items-center gap-2.5 rounded-xl p-3")}>
                    <input
                      type="radio"
                      name="profession"
                      value={id}
                      checked={profession === id}
                      onChange={() => chooseProfession(id)}
                      className="sr-only"
                      data-testid={`profession-${id}`}
                    />
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", KIND_TILE[categoryKind(id)])}>
                      <CategoryIcon category={id} className="size-5" />
                    </span>
                    <span className="text-sm font-semibold text-ink">{PROFESSION_LABELS[id]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-ink">Choose your profile</legend>
              <p className="text-xs text-ink-muted">Demo caretaker accounts. Pick one to open its dashboard.</p>
              {profiles.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">
                  No {PROFESSION_LABELS[profession].toLowerCase()} profiles yet.
                </p>
              ) : (
                <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto p-0.5">
                  {profiles.map((profile) => (
                    <li key={profile.id}>
                      <label className={cn(OPTION_CARD, "items-center justify-between gap-3 rounded-xl p-3")}>
                        <input
                          type="radio"
                          name="provider"
                          value={profile.id}
                          checked={providerId === profile.id}
                          onChange={() => setProviderId(profile.id)}
                          className="sr-only"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink">{profile.name}</span>
                          <span className="block truncate text-xs text-ink-muted">
                            {profile.locality}, {profile.city}
                          </span>
                        </span>
                        <VerificationBadge status={profile.verificationStatus} />
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <Button
              size="lg"
              className="mt-5 w-full"
              disabled={busy || !selected}
              onClick={() => selected && logIn("provider", "/dashboard/provider", selected.id)}
              data-testid="login-submit"
            >
              {selected ? `Log in as ${selected.name}` : "Choose a profile"} <ArrowRight aria-hidden className="size-4" />
            </Button>
          </section>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        HealNest staff?{" "}
        <button
          type="button"
          onClick={() => logIn("admin", "/dashboard/admin")}
          disabled={busy}
          className="font-semibold text-brand-700 underline underline-offset-2 disabled:text-ink-muted"
        >
          Log in as admin
        </button>
      </p>
      <p className="mt-2 text-center text-xs text-ink-muted">This MVP uses demo accounts, so no password or OTP is needed.</p>
    </div>
  );
}
