"use client";

import { ArrowRight, Check, HeartHandshake, UserRound, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CategoryIcon, ComingSoonBadge, KIND_TILE, VerificationBadge } from "@/components/category-meta";
import { CreateAccountForm } from "@/components/create-account-form";
import { Button } from "@/components/ui/button";
import { categoryKind, isComingSoon, PROFESSION_LABELS } from "@/lib/categories";
import { apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import type { CategoryId, Role, VerificationStatus } from "@/types";

export type AccountType = "customer" | "caretaker";
type AccountMode = "existing" | "new";

export type CustomerOption = { id: string; name: string; email: string };

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
    body: "Book home nursing, physiotherapy, nannies, caregivers and more for yourself or your family.",
    icon: UserRound,
  },
  {
    value: "caretaker",
    title: "Caretaker",
    body: "Nurses, nannies, caregivers and physiotherapists who provide care at home.",
    icon: HeartHandshake,
  },
];

/** Radio-card styling: the native radio is visually hidden, the card shows checked and focus states. */
const OPTION_CARD =
  "relative flex cursor-pointer rounded-2xl border border-line bg-white shadow-sm transition hover:border-brand-300 " +
  "has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50 has-[:checked]:ring-2 has-[:checked]:ring-brand-700/20 " +
  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600/40";

/** Toggle between logging into an existing account and creating a new one. */
function ModeSwitch({ mode, onChange }: { mode: AccountMode; onChange: (mode: AccountMode) => void }) {
  return (
    <div role="group" aria-label="Account" className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-canvas p-1 text-sm font-semibold ring-1 ring-line">
      {(["existing", "new"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={cn(
            "rounded-full px-3 py-2 whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-600/40",
            mode === value ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink",
          )}
          data-testid={`account-mode-${value}`}
        >
          {value === "existing" ? "Existing account" : "New account"}
        </button>
      ))}
    </div>
  );
}

type Props = {
  customers: CustomerOption[];
  caretakers: CaretakerOption[];
  professions: CategoryId[];
  initialType: AccountType;
  /** Where to send a customer after login (validated server-side). */
  next: string | null;
  /** Demo account pickers and demo sign-up (DEMO_TOOLS). */
  demoEnabled: boolean;
};

/** Log in as a customer or caretaker by picking a demo account, or create a new one. */
export function LoginForm({ customers, caretakers, professions, initialType, next, demoEnabled }: Props) {
  const router = useRouter();
  const [type, setType] = useState<AccountType>(initialType);
  const [mode, setMode] = useState<AccountMode>("existing");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const openProfessions = professions.filter((id) => !isComingSoon(id));
  const [profession, setProfession] = useState<CategoryId>(openProfessions[0] ?? professions[0]);
  const [providerId, setProviderId] = useState(() => caretakers.find((c) => c.category === (openProfessions[0] ?? professions[0]))?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const customer = customers.find((c) => c.id === customerId);
  const profiles = caretakers.filter((c) => c.category === profession);
  const selected = profiles.find((c) => c.id === providerId);
  const busy = !demoEnabled || submitting || pending;

  function chooseProfession(id: CategoryId) {
    setProfession(id);
    setProviderId(caretakers.find((c) => c.category === id)?.id ?? "");
  }

  async function logIn(role: Role, destination: string, account: { userId?: string; providerId?: string } = {}) {
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/api/session", "POST", { role, ...account });
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
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">Log in to HealNest Bharat</h1>
        <p className="mt-2 text-ink-muted">Tell us how you use HealNest so we can take you to the right place.</p>
      </div>

      {!demoEnabled && (
        <p role="status" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Sign-in is turned off in this deployment.
        </p>
      )}

      <fieldset className="mt-8">
        <legend className="mb-3 text-sm font-bold text-ink">I want to log in as</legend>
        {/* Side by side even on phones; the description is hidden there to keep the form above the fold. */}
        <div className="grid grid-cols-2 gap-3">
          {ACCOUNT_TYPES.map(({ value, title, body, icon: Icon }) => (
            <label key={value} className={cn(OPTION_CARD, "flex-col gap-2 p-4 sm:p-5")}>
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
              <span className="mt-1 text-base font-bold text-ink sm:text-lg">{title}</span>
              <span className="hidden text-sm text-ink-muted sm:block">{body}</span>
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
            <ModeSwitch mode={mode} onChange={setMode} />

            {mode === "new" ? (
              <CreateAccountForm type="customer" profession={profession} next={next} enabled={demoEnabled} />
            ) : (
              <>
                <fieldset className="mt-4">
                  <legend className="text-sm font-semibold text-ink">Choose your account</legend>
                  <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto p-0.5">
                    {customers.map((c) => (
                      <li key={c.id}>
                        <label className={cn(OPTION_CARD, "items-center gap-3 rounded-xl p-3")}>
                          <input
                            type="radio"
                            name="customer"
                            value={c.id}
                            checked={customerId === c.id}
                            onChange={() => setCustomerId(c.id)}
                            className="sr-only"
                          />
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 text-white">
                            <UserRound aria-hidden className="size-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-ink">{c.name}</span>
                            <span className="block truncate text-xs text-ink-muted">{c.email}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
                <Button
                  size="lg"
                  className="mt-5 w-full"
                  disabled={busy || !customer}
                  onClick={() => customer && logIn("user", next ?? "/", { userId: customer.id })}
                  data-testid="login-submit"
                >
                  {customer ? `Log in as ${customer.name}` : "Choose an account"} <ArrowRight aria-hidden className="size-4" />
                </Button>
              </>
            )}
          </section>
        ) : (
          <section aria-labelledby="caretaker-heading">
            <h2 id="caretaker-heading" className="font-bold text-ink">
              Caretaker account
            </h2>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-ink">What kind of care do you provide?</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {professions.map((id) => {
                  const soon = isComingSoon(id);
                  return (
                    // Phones: icon above the label, so long names like "Physiotherapist" fit the half-width tile.
                    <label
                      key={id}
                      className={cn(
                        OPTION_CARD,
                        "flex-col items-start gap-2 rounded-xl p-3 sm:flex-row sm:items-center sm:gap-2.5",
                        soon && "cursor-not-allowed border-dashed bg-canvas shadow-none hover:border-line",
                      )}
                    >
                      <input
                        type="radio"
                        name="profession"
                        value={id}
                        checked={profession === id}
                        disabled={soon}
                        onChange={() => chooseProfession(id)}
                        className="sr-only"
                        data-testid={`profession-${id}`}
                      />
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg",
                          soon ? "bg-white text-ink-muted" : KIND_TILE[categoryKind(id)],
                        )}
                      >
                        <CategoryIcon category={id} className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-sm font-semibold break-words", soon ? "text-ink-muted" : "text-ink")}>
                          {PROFESSION_LABELS[id]}
                        </span>
                        {soon && (
                          <span className="mt-1 block">
                            <ComingSoonBadge />
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <ModeSwitch mode={mode} onChange={setMode} />

            {mode === "new" ? (
              <CreateAccountForm type="caretaker" profession={profession} next={next} enabled={demoEnabled} />
            ) : (
              <>
                <fieldset className="mt-4">
                  <legend className="text-sm font-semibold text-ink">Choose your profile</legend>
                  <p className="text-xs text-ink-muted">Pick a caretaker account to open its dashboard.</p>
                  {profiles.length === 0 ? (
                    <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">
                      No {PROFESSION_LABELS[profession].toLowerCase()} profiles yet. Create one with “New account”.
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
                  onClick={() => selected && logIn("provider", "/dashboard/provider", { providerId: selected.id })}
                  data-testid="login-submit"
                >
                  {selected ? `Log in as ${selected.name}` : "Choose a profile"} <ArrowRight aria-hidden className="size-4" />
                </Button>
              </>
            )}
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
      <p className="mt-2 text-center text-xs text-ink-muted">
        This MVP uses demo accounts, so no password or OTP is needed. New accounts are saved to the app&apos;s database.
      </p>
    </div>
  );
}
