"use client";

import { ArrowRight, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { apiRequest } from "@/lib/client-api";
import type { Session } from "@/lib/session";

/** Body for POST /api/auth/email-code: log into an existing account, or confirm the email before a sign-up. */
export type CodeRequest =
  | { intent: "login"; email: string }
  | { intent: "signup"; account: Record<string, unknown> & { email: string } };

/** Where each role lands after logging in. Customers go back to `next`. */
const DESTINATIONS: Record<Session["role"], string | null> = {
  user: null,
  provider: "/dashboard/provider",
  admin: "/dashboard/admin",
};

const LINK_BUTTON = "font-semibold underline-offset-2 hover:underline disabled:text-ink-muted disabled:no-underline";

/** Second step: type the code from the email. Logs in, creating the account first for a sign-up. */
export function CodeEntry({ request, next, onBack }: { request: CodeRequest; next: string | null; onBack: () => void }) {
  const id = useId();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const email = request.intent === "login" ? request.email : request.account.email;
  const signup = request.intent === "signup";
  const busy = submitting || pending;

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const { session } = await apiRequest<{ session: Session }>("/api/auth/email-code/verify", "POST", {
        email,
        token: code,
        account: signup ? request.account : undefined,
      });
      startTransition(() => {
        router.push(DESTINATIONS[session.role] ?? next ?? "/");
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check the code");
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await apiRequest("/api/auth/email-code", "POST", request);
      setCode("");
      setNotice("We sent a new code. Use the latest email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send a new code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={verify} noValidate className="mt-4 space-y-4" data-testid="email-code-form">
      <p className="rounded-xl bg-canvas p-3 text-sm text-ink-muted">
        We emailed a code to <strong className="font-semibold break-all text-ink">{email}</strong>. If it hasn&apos;t arrived in a
        minute, check your spam folder.
      </p>
      <div>
        <Label htmlFor={`${id}-code`}>Code from the email</Label>
        <Input
          id={`${id}-code`}
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder="123456"
          className="text-center text-lg font-semibold tracking-[0.4em]"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-code-error` : undefined}
          data-testid="email-code-input"
        />
        <FieldError id={`${id}-code-error`} message={error ?? undefined} />
        {notice && (
          <p role="status" className="mt-1 text-sm text-leaf-700">
            {notice}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy || code.length < 6} data-testid="email-code-submit">
        {signup ? "Verify and create account" : "Verify and log in"} <ArrowRight aria-hidden className="size-4" />
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <button type="button" onClick={onBack} disabled={busy} className={`${LINK_BUTTON} text-ink-muted hover:text-ink`}>
          {signup ? "Edit my details" : "Use a different email"}
        </button>
        <button type="button" onClick={resend} disabled={busy} className={`${LINK_BUTTON} text-brand-700`}>
          Send a new code
        </button>
      </div>
    </form>
  );
}

/** Log in without a password: we email a one-time code to the account's address. */
export function EmailCodeLogin({ next }: { next: string | null }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/api/auth/email-code", "POST", { intent: "login", email: address });
      setSentTo(address);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the code");
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) return <CodeEntry request={{ intent: "login", email: sentTo }} next={next} onBack={() => setSentTo(null)} />;

  return (
    <form onSubmit={send} noValidate className="mt-4 space-y-3" data-testid="email-login-form">
      <div>
        <Label htmlFor={`${id}-email`}>Your email</Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          maxLength={120}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-email-error` : undefined}
          data-testid="email-login-input"
        />
        <FieldError id={`${id}-email-error`} message={error ?? undefined} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={submitting || !email.trim()} data-testid="email-login-submit">
        <Mail aria-hidden className="size-4" /> Email me a code
      </Button>
    </form>
  );
}
