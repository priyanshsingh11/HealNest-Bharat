"use client";

import { ArrowRight, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label } from "@/components/ui/field";
import { apiRequest } from "@/lib/client-api";
import { useMessages } from "@/lib/i18n/client";
import { staffMessages } from "@/lib/i18n/messages/staff";

/**
 * Staff sign-in, in two steps: the shared passcode emails a one-time code to a listed staff address, then
 * that code opens the admin dashboard. Neither the passcode nor the code is ever stored — they live in this
 * component's state until the tab is closed.
 */
export function StaffLoginForm({ configured }: { configured: boolean }) {
  const t = useMessages(staffMessages).form;
  const id = useId();
  const router = useRouter();
  const [step, setStep] = useState<"passcode" | "code">("passcode");
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : t.signInFailed);

  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiRequest("/api/staff/code", "POST", { passcode, email: email.trim() });
      setCode("");
      setStep("code");
      setNotice(t.codeSent(email.trim()));
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiRequest("/api/session", "POST", { role: "admin", email: email.trim(), code: code.trim() });
      setPasscode("");
      setCode("");
      startTransition(() => {
        router.push("/dashboard/admin");
        router.refresh();
      });
    } catch (e) {
      fail(e);
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {t.notConfigured.before} <code className="font-mono">ADMIN_PASSCODE</code>,{" "}
        <code className="font-mono">ADMIN_EMAILS</code> {t.notConfigured.and} <code className="font-mono">SUPABASE_ANON_KEY</code>{" "}
        {t.notConfigured.after}
      </p>
    );
  }

  const working = busy || pending;

  return (
    <div className="space-y-4">
      {step === "passcode" ? (
        <form onSubmit={requestCode} className="space-y-4">
          <div>
            <Label htmlFor={`${id}-email`}>{t.email}</Label>
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@healnestbharat.com"
            />
            <Hint>{t.emailHint}</Hint>
          </div>
          <div>
            <Label htmlFor={`${id}-passcode`}>{t.passcode}</Label>
            <Input
              id={`${id}-passcode`}
              type="password"
              autoComplete="off"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={working}>
            {working ? t.sendingCode : t.sendCode}
            <ArrowRight aria-hidden className="size-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-4">
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
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.codePlaceholder}
              className="tracking-[0.3em]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={working}>
            {working ? t.checking : t.openDashboard}
            <ArrowRight aria-hidden className="size-4" />
          </Button>
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <button type="button" className="font-semibold text-brand-700 hover:underline" disabled={working} onClick={() => requestCode()}>
              {t.resend}
            </button>
            <button
              type="button"
              className="font-semibold text-ink-muted hover:underline"
              onClick={() => {
                setStep("passcode");
                setError(null);
                setNotice(null);
              }}
            >
              {t.differentAddress}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
