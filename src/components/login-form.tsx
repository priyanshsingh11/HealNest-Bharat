"use client";

import { ArrowRight, Check, HeartHandshake, UserRound, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { CategoryIcon, ComingSoonBadge, KIND_TILE } from "@/components/category-meta";
import { CreateAccountForm } from "@/components/create-account-form";
import { PasswordResetForm } from "@/components/password-reset-form";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { categoryKind, isComingSoon } from "@/lib/categories";
import { apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { authMessages } from "@/lib/i18n/messages/auth";
import { domainMessages } from "@/lib/i18n/messages/domain";
import { landingFor } from "@/lib/landing";
import type { Session } from "@/lib/session";
import type { CategoryId } from "@/types";

export type AccountType = "customer" | "caretaker";
export type AuthMode = "login" | "signup";

/** Title and description come from the message file, keyed by `value`. */
const ACCOUNT_TYPES: { value: AccountType; icon: LucideIcon }[] = [
  { value: "customer", icon: UserRound },
  { value: "caretaker", icon: HeartHandshake },
];

/** Radio-card styling: the native radio is visually hidden, the card shows checked and focus states. */
const OPTION_CARD =
  "relative flex cursor-pointer rounded-2xl border border-line bg-white shadow-sm transition hover:border-brand-300 " +
  "has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50 has-[:checked]:ring-2 has-[:checked]:ring-brand-700/20 " +
  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600/40";

function ModeTabs({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  const t = useMessages(authMessages).login;
  return (
    <div role="group" aria-label={t.tabsLabel} className="grid grid-cols-2 gap-1 rounded-full bg-canvas p-1 text-sm font-semibold ring-1 ring-line">
      {(["login", "signup"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={cn(
            "rounded-full px-3 py-2.5 whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-600/40",
            mode === value ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink",
          )}
          data-testid={`auth-tab-${value}`}
        >
          {value === "login" ? t.tabLogIn : t.tabSignUp}
        </button>
      ))}
    </div>
  );
}

function LogInForm({ next, onForgot, onSignUp }: { next: string | null; onForgot: (email: string) => void; onSignUp: () => void }) {
  const t = useMessages(authMessages).login;
  const id = useId();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const busy = submitting || pending;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { session } = await apiRequest<{ session: Session }>("/api/session", "POST", { email: email.trim(), password });
      startTransition(() => {
        router.push(landingFor(session, next));
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.logInFailed);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="login-form">
      <div>
        <Label htmlFor={`${id}-email`}>{t.email}</Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          data-testid="login-email"
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={`${id}-password`}>{t.password}</Label>
          <button
            type="button"
            onClick={() => onForgot(email.trim())}
            className="mb-1.5 text-sm font-semibold text-brand-700 hover:underline"
            data-testid="forgot-password"
          >
            {t.forgotPassword}
          </button>
        </div>
        <PasswordInput
          id={`${id}-password`}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
          data-testid="login-password"
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="login-submit">
        {busy ? t.submitting : t.submit} <ArrowRight aria-hidden className="size-4" />
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <p className="border-t border-line pt-4 text-center text-sm text-ink-muted">
        {t.newHere}{" "}
        <button type="button" onClick={onSignUp} className="font-semibold text-brand-700 hover:underline">
          {t.createAccount}
        </button>
      </p>
    </form>
  );
}

function SignUpSection({
  professions,
  initialType,
  next,
  onLogIn,
}: {
  professions: CategoryId[];
  initialType: AccountType;
  next: string | null;
  onLogIn: () => void;
}) {
  const t = useMessages(authMessages).login;
  const locale = useLocale();
  const [type, setType] = useState<AccountType>(initialType);
  const openProfessions = professions.filter((id) => !isComingSoon(id));
  const [profession, setProfession] = useState<CategoryId>(openProfessions[0] ?? professions[0]);

  return (
    <div>
      <fieldset>
        <legend className="mb-3 text-sm font-bold text-ink">{t.joinAs}</legend>
        {/* Side by side even on phones; the description is hidden there to keep the form above the fold. */}
        <div className="grid grid-cols-2 gap-3">
          {ACCOUNT_TYPES.map(({ value, icon: Icon }) => (
            <label key={value} className={cn(OPTION_CARD, "flex-col gap-2 p-4")}>
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
                <span className="grid size-10 place-items-center rounded-xl bg-brand-700 text-white">
                  <Icon aria-hidden className="size-5" />
                </span>
                {type === value && <Check aria-hidden className="size-5 text-brand-700" />}
              </span>
              <span className="mt-1 text-base font-bold text-ink">{t.types[value].title}</span>
              <span className="hidden text-sm text-ink-muted sm:block">{t.types[value].body}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === "caretaker" && (
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-ink">{t.professionLegend}</legend>
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
                    className={cn("grid size-9 shrink-0 place-items-center rounded-lg", soon ? "bg-white text-ink-muted" : KIND_TILE[categoryKind(id)])}
                  >
                    <CategoryIcon category={id} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block text-sm font-semibold break-words", soon ? "text-ink-muted" : "text-ink")}>
                      {domainMessages[locale].professions[id]}
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
      )}

      {/* Keyed by type so switching clears the other form's half-typed details and errors. */}
      <CreateAccountForm key={type} type={type} profession={profession} next={next} />

      <p className="mt-4 border-t border-line pt-4 text-center text-sm text-ink-muted">
        {t.haveAccount}{" "}
        <button type="button" onClick={onLogIn} className="font-semibold text-brand-700 hover:underline">
          {t.logInInstead}
        </button>
      </p>
    </div>
  );
}

type Props = {
  professions: CategoryId[];
  initialMode: AuthMode;
  initialType: AccountType;
  /** Where to send a customer after logging in (validated server-side). */
  next: string | null;
};

/** Log in with email and password, sign up as a customer or caretaker, or reset a forgotten password. */
export function LoginForm({ professions, initialMode, initialType, next }: Props) {
  const t = useMessages(authMessages).login;
  const [mode, setMode] = useState<AuthMode>(initialMode);
  /** Set while the forgot-password flow is open; carries the email typed so far. */
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  const switchMode = (value: AuthMode) => {
    setResetEmail(null);
    setMode(value);
  };

  return (
    <div>
      <div className="text-center">
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">{mode === "login" ? t.headingLogIn : t.headingSignUp}</h1>
        <p className="mt-2 text-ink-muted">{mode === "login" ? t.introLogIn : t.introSignUp}</p>
      </div>

      <div className={cn("mx-auto mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6", mode === "login" && "max-w-md")}>
        <ModeTabs mode={mode} onChange={switchMode} />
        <div className="mt-6">
          {mode === "signup" ? (
            <SignUpSection professions={professions} initialType={initialType} next={next} onLogIn={() => switchMode("login")} />
          ) : resetEmail !== null ? (
            <PasswordResetForm
              initialEmail={resetEmail}
              next={next}
              onBack={() => setResetEmail(null)}
              onSignUp={() => switchMode("signup")}
            />
          ) : (
            <LogInForm next={next} onForgot={setResetEmail} onSignUp={() => switchMode("signup")} />
          )}
        </div>
      </div>
    </div>
  );
}
