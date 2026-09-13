"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { AccountType } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Input, Label, Select } from "@/components/ui/field";
import { ApiRequestError, apiRequest } from "@/lib/client-api";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { authMessages } from "@/lib/i18n/messages/auth";
import { domainMessages } from "@/lib/i18n/messages/domain";
import { landingFor } from "@/lib/landing";
import type { Session } from "@/lib/session";
import { CaretakerLocationPicker } from "@/components/caretaker-location-picker";
import { PasswordInput } from "@/components/ui/password-input";
import type { CategoryId } from "@/types";

type Props = {
  type: AccountType;
  /** Caretaker profession, chosen above the form. */
  profession: CategoryId;
  /** Where to send a customer after sign-up (validated server-side). */
  next: string | null;
};

function Field({
  htmlFor,
  label,
  error,
  hint,
  className,
  children,
}: {
  htmlFor: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <Hint>{hint}</Hint>}
      <FieldError id={`${htmlFor}-error`} message={error} />
    </div>
  );
}

/** Sign-up for a customer or caretaker: creates the account with its email + password login, and logs straight in. */
export function CreateAccountForm({ type, profession, next }: Props) {
  const { signUp: t, login } = useMessages(authMessages);
  const locale = useLocale();
  const id = useId();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const busy = submitting || pending;
  const caretaker = type === "caretaker";
  const professionLabel = domainMessages[locale].professions[profession].toLowerCase();

  /** id, name and error wiring for one input. */
  const control = (name: string) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": issues[name] ? true : undefined,
    "aria-describedby": issues[name] ? `${id}-${name}-error` : undefined,
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    const contact = { name: text("name"), email: text("email"), phone: text("phone"), password: text("password") };
    const exactLocRaw = text("exactLocation");
    let exactLocation: { latitude: number; longitude: number; locality: string; city: string; formattedAddress?: string } | undefined;
    if (exactLocRaw) {
      try {
        exactLocation = JSON.parse(exactLocRaw);
      } catch {
        // ignore parse error
      }
    }

    const body = caretaker
      ? {
          type,
          ...contact,
          category: profession,
          gender: text("gender"),
          localityId: text("localityId"),
          exactLocation,
          languages: text("languages")
            .split(",")
            .map((language) => language.trim())
            .filter(Boolean),
          yearsExperience: Number(text("yearsExperience") || 0),
        }
      : { type, ...contact };

    setError(null);
    setIssues({});
    setSubmitting(true);
    try {
      const { session } = await apiRequest<{ session: Session }>("/api/accounts", "POST", body);
      startTransition(() => {
        router.push(landingFor(session, next));
        router.refresh();
      });
    } catch (e) {
      if (e instanceof ApiRequestError) {
        // Keep the first message per field; "languages.0" is reported against the languages field.
        const byField: Record<string, string> = {};
        for (const issue of e.issues) byField[issue.path.split(".")[0]] ??= issue.message;
        setIssues(byField);
      }
      setError(e instanceof Error ? e.message : t.createFailed);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-4" data-testid={`create-${type}-form`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor={`${id}-name`} label={t.fullName} error={issues.name} className="sm:col-span-2">
          <Input
            {...control("name")}
            autoComplete="name"
            maxLength={60}
            required
            placeholder={caretaker ? t.namePlaceholderCaretaker : t.namePlaceholderCustomer}
          />
        </Field>
        <Field htmlFor={`${id}-email`} label={t.email} error={issues.email}>
          <Input {...control("email")} type="email" autoComplete="email" maxLength={120} required placeholder="you@example.com" />
        </Field>
        <Field htmlFor={`${id}-phone`} label={t.mobile} error={issues.phone}>
          <Input {...control("phone")} type="tel" autoComplete="tel" inputMode="tel" required placeholder="+91 98765 43210" />
        </Field>
        <Field htmlFor={`${id}-password`} label={t.password} error={issues.password} hint={t.passwordHint} className="sm:col-span-2">
          <PasswordInput
            {...control("password")}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            showLabel={login.showPassword}
            hideLabel={login.hidePassword}
          />
        </Field>
      </div>

      {caretaker && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor={`${id}-gender`} label={t.gender} error={issues.gender}>
              <Select {...control("gender")} defaultValue="" required>
                <option value="" disabled>
                  {t.choose}
                </option>
                <option value="female">{t.female}</option>
                <option value="male">{t.male}</option>
                <option value="other">{t.other}</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <CaretakerLocationPicker id={`${id}-localityId`} error={issues.localityId} />
            </div>
            <Field htmlFor={`${id}-languages`} label={t.languages} error={issues.languages} hint={t.languagesHint}>
              <Input {...control("languages")} defaultValue="Hindi, English" autoComplete="off" />
            </Field>
            <Field htmlFor={`${id}-yearsExperience`} label={t.yearsExperience} error={issues.yearsExperience}>
              <Input {...control("yearsExperience")} type="number" inputMode="numeric" min={0} max={60} step={1} defaultValue={0} />
            </Field>
          </div>
          <p className="rounded-xl bg-canvas p-3 text-xs text-ink-muted">
            {t.unverifiedBefore(professionLabel)} <strong className="font-semibold text-ink">{t.unverified}</strong>
            {t.unverifiedAfter}
          </p>
        </>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="create-account-submit">
        {caretaker ? t.createCaretaker(professionLabel) : t.createCustomer} <ArrowRight aria-hidden className="size-4" />
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
