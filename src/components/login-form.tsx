"use client";

import { ArrowRight, Check, HeartHandshake, Laptop, UserRound, X, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CategoryIcon, ComingSoonBadge, KIND_TILE } from "@/components/category-meta";
import { CreateAccountForm } from "@/components/create-account-form";
import { Button } from "@/components/ui/button";
import { categoryKind, isComingSoon, PROFESSION_LABELS } from "@/lib/categories";
import { apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { forgetDeviceAccount, listDeviceAccounts, type DeviceAccount } from "@/lib/device-accounts";
import type { CategoryId } from "@/types";

export type AccountType = "customer" | "caretaker";
type AccountMode = "existing" | "new";

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

/** Toggle between logging into an account saved on this device and creating a new one. */
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
          {value === "existing" ? "Saved on this device" : "New account"}
        </button>
      ))}
    </div>
  );
}

/** Shown on a device with no account of this kind saved: there is nothing to pick, so point at sign-up. */
function NoAccounts({ type, onCreate }: { type: AccountType; onCreate: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-line bg-canvas p-5 text-center">
      <Laptop aria-hidden className="mx-auto size-6 text-ink-muted" />
      <p className="mt-2 text-sm font-semibold text-ink">No {type} account on this device</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
        Accounts stay on the device they were created on, so nobody else can open yours. Create one here, or log in from
        the device you already use.
      </p>
      <Button variant="secondary" className="mt-4" onClick={onCreate}>
        Create a new account <ArrowRight aria-hidden className="size-4" />
      </Button>
    </div>
  );
}

type Props = {
  professions: CategoryId[];
  initialType: AccountType;
  /** Where to send a customer after login (validated server-side). */
  next: string | null;
  /** Whether sign-up and login are enabled at all (DEMO_TOOLS). */
  demoEnabled: boolean;
};

/**
 * Log into an account saved on this device, or create a new one.
 *
 * The list comes from this browser's own storage, never from the server, and each entry carries the secret
 * issued when the account was created. The server re-checks that secret, so an entry copied from elsewhere
 * is useless.
 */
export function LoginForm({ professions, initialType, next, demoEnabled }: Props) {
  const router = useRouter();
  const [type, setType] = useState<AccountType>(initialType);
  const [mode, setMode] = useState<AccountMode>("existing");
  const [accounts, setAccounts] = useState<DeviceAccount[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const openProfessions = professions.filter((id) => !isComingSoon(id));
  const [profession, setProfession] = useState<CategoryId>(openProfessions[0] ?? professions[0]);
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // localStorage is only readable in the browser, so the first render matches the server's empty list.
  useEffect(() => setAccounts(listDeviceAccounts()), []);

  const role = type === "customer" ? "user" : "provider";
  const saved = (accounts ?? []).filter((a) => a.role === role);
  const selected = saved.find((a) => a.id === selectedId) ?? saved[0];
  const busy = !demoEnabled || submitting || pending;
  // Until the effect has run we don't know what this device has; don't flash the empty state at people.
  const loaded = accounts !== null;

  function drop(id: string) {
    forgetDeviceAccount(id);
    setAccounts(listDeviceAccounts());
  }

  async function logIn(account: DeviceAccount) {
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/api/session", "POST", {
        role: account.role,
        userId: account.role === "user" ? account.id : undefined,
        providerId: account.providerId ?? undefined,
        deviceToken: account.token,
      });
      startTransition(() => {
        router.push(account.role === "provider" ? "/dashboard/provider" : (next ?? "/"));
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not log in");
      setSubmitting(false);
    }
  }

  // Called as a plain function rather than rendered as a nested component: a component declared inside another
  // component is a new type on every render, which would remount the radios and drop focus mid-click.
  function savedAccounts() {
    if (!loaded) return <p className="mt-4 text-sm text-ink-muted">Checking this device…</p>;
    if (saved.length === 0) return <NoAccounts type={type} onCreate={() => setMode("new")} />;
    return (
      <>
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-ink">Accounts on this device</legend>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto p-0.5">
            {saved.map((account) => (
              <li key={account.id} className="relative">
                <label className={cn(OPTION_CARD, "items-center gap-3 rounded-xl p-3 pr-11")}>
                  <input
                    type="radio"
                    name="device-account"
                    value={account.id}
                    checked={selected?.id === account.id}
                    onChange={() => setSelectedId(account.id)}
                    className="sr-only"
                  />
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 text-white">
                    {account.category ? (
                      <CategoryIcon category={account.category} className="size-5" />
                    ) : (
                      <UserRound aria-hidden className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{account.name}</span>
                    <span className="block truncate text-xs text-ink-muted">{account.detail}</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => drop(account.id)}
                  aria-label={`Remove ${account.name} from this device`}
                  title="Remove from this device"
                  className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-muted transition hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-600/40"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
        <Button
          size="lg"
          className="mt-5 w-full"
          disabled={busy || !selected}
          onClick={() => selected && logIn(selected)}
          data-testid="login-submit"
        >
          {selected ? `Log in as ${selected.name}` : "Choose an account"} <ArrowRight aria-hidden className="size-4" />
        </Button>
      </>
    );
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
                onChange={() => {
                  setType(value);
                  setSelectedId("");
                }}
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
              savedAccounts()
            )}
          </section>
        ) : (
          <section aria-labelledby="caretaker-heading">
            <h2 id="caretaker-heading" className="font-bold text-ink">
              Caretaker account
            </h2>
            <ModeSwitch mode={mode} onChange={setMode} />

            {mode === "new" ? (
              <>
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
                            onChange={() => setProfession(id)}
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
                <CreateAccountForm type="caretaker" profession={profession} next={next} enabled={demoEnabled} />
              </>
            ) : (
              savedAccounts()
            )}
          </section>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Accounts are tied to the device that created them — they are never listed for anyone else. Clearing this
        browser&apos;s site data removes them from here.
      </p>
    </div>
  );
}
