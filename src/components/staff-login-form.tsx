"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { apiRequest } from "@/lib/client-api";

/** Passcode form for the admin dashboard. The passcode is never held in the URL or in storage. */
export function StaffLoginForm({ configured }: { configured: boolean }) {
  const id = useId();
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/api/session", "POST", { role: "admin", passcode });
      setPasscode("");
      startTransition(() => {
        router.push("/dashboard/admin");
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in");
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <p role="status" className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Staff sign-in is not set up on this deployment. Set <code className="font-mono">ADMIN_PASSCODE</code> in the server
        environment and restart.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm" data-testid="staff-login-form">
      <Label htmlFor={`${id}-passcode`}>Staff passcode</Label>
      <Input
        id={`${id}-passcode`}
        name="passcode"
        type="password"
        autoComplete="current-password"
        maxLength={200}
        required
        autoFocus
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting || pending || !passcode} data-testid="staff-login-submit">
        Sign in <ArrowRight aria-hidden className="size-4" />
      </Button>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
