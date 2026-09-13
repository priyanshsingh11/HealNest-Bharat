"use client";

import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Input, Label } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiRequestError, apiRequest } from "@/lib/client-api";
import { useMessages } from "@/lib/i18n/client";
import { authMessages } from "@/lib/i18n/messages/auth";
import { landingFor } from "@/lib/landing";
import type { Session } from "@/lib/session";

type Props = {
  initialEmail: string;
  next: string | null;
  onBack: () => void;
  onSignUp: () => void;
};

/** Forgot password: email a code, then enter it with a new password to log straight in. */
export function PasswordResetForm({ initialEmail, next, onBack, onSignUp }: Props) {
  const { reset: t, login } = useMessages(authMessages);
  const id = useId();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  /** The password was saved for an email with no HealNest account yet: sign-up finishes it. */
  const [savedNoAccount, setSavedNoAccount] = useState(false);
  const working = busy || pending;

  function fail(e: unknown, fallback: string) {
    if (e instanceof ApiRequestError) {
      const byField: Record<string, string> = {};
      for (const issue of e.issues) byField[issue.path.split(".")[0]] ??= issue.message;
      setIssues(byField);
    }
    setError(e instanceof Error ? e.message : fallback);
  }

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);
    setIssues({});
    setBusy(true);
    try {
      await apiRequest("/api/password-reset", "POST", { email: email.trim() });
      setCode("");
      setStep("code");
      setNotice(t.codeSent(email.trim()));
    } catch (e) {
      fail(e, t.failed);
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIssues({});
    setBusy(true);
    try {
      const { session } = await apiRequest<{ session: Session | null }>("/api/password-reset/confirm", "POST", {
        email: email.trim(),
        code: code.trim(),
        password,
      });
      if (!session) {
        setSavedNoAccount(true);
        setBusy(false);
        return;
      }
      startTransition(() => {
        router.push(landingFor(session, next));
        router.refresh();
      });
    } catch (e) {
      fail(e, t.failed);
      setBusy(false);
    }
  }

  if (savedNoAccount) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {t.savedNoAccount}
        </p>
        <Button className="w-full" onClick={onSignUp}>
          {login.createAccount} <ArrowRight aria-hidden className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="password-reset">
      <div>
        <h2 className="font-bold text-ink">{t.heading}</h2>
        {step === "email" && <p className="mt-1 text-sm text-ink-muted">{t.intro}</p>}
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} noValidate className="space-y-4">
          <div>
            <Label htmlFor={`${id}-email`}>{login.email}</Label>
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={issues.email ? true : undefined}
              aria-describedby={issues.email ? `${id}-email-error` : undefined}
            />
            <FieldError id={`${id}-email-error`} message={issues.email} />
          </div>
          <Button type="submit" className="w-full" disabled={working}>
            {working ? t.sending : t.sendCode} <ArrowRight aria-hidden className="size-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={save} noValidate className="space-y-4">
          {notice && (
            <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <MailCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
              {notice}
            </p>
          )}
          <div>
            <Label htmlFor={`${id}-code`}>{t.code}</Label>
            <Input
              id={`${id}-code`}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t.codePlaceholder}
              className="tracking-[0.3em]"
              aria-invalid={issues.code ? true : undefined}
              aria-describedby={issues.code ? `${id}-code-error` : undefined}
            />
            <FieldError id={`${id}-code-error`} message={issues.code} />
          </div>
          <div>
            <Label htmlFor={`${id}-password`}>{t.newPassword}</Label>
            <PasswordInput
              id={`${id}-password`}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showLabel={login.showPassword}
              hideLabel={login.hidePassword}
              aria-invalid={issues.password ? true : undefined}
              aria-describedby={issues.password ? `${id}-password-error` : undefined}
            />
            <Hint>{t.passwordHint}</Hint>
            <FieldError id={`${id}-password-error`} message={issues.password} />
          </div>
          <Button type="submit" className="w-full" disabled={working}>
            {working ? t.saving : t.save} <ArrowRight aria-hidden className="size-4" />
          </Button>
          <button type="button" className="text-sm font-semibold text-brand-700 hover:underline" disabled={working} onClick={() => sendCode()}>
            {t.resend}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:underline">
        <ArrowLeft aria-hidden className="size-4" />
        {t.back}
      </button>
    </div>
  );
}
