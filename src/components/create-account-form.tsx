"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { AccountType } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Input, Label, Select } from "@/components/ui/field";
import { PROFESSION_LABELS } from "@/lib/categories";
import { ApiRequestError, apiRequest } from "@/lib/client-api";
import { LOCALITIES_BY_STATE, localityLabel } from "@/lib/localities";
import type { CategoryId } from "@/types";

type Props = {
  type: AccountType;
  /** Caretaker profession, chosen above the form. */
  profession: CategoryId;
  /** Where to send a customer after sign-up (validated server-side). */
  next: string | null;
  enabled: boolean;
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

/** Demo sign-up: creates a customer or caretaker account and logs straight into it. */
export function CreateAccountForm({ type, profession, next, enabled }: Props) {
  const id = useId();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const busy = !enabled || submitting || pending;
  const caretaker = type === "caretaker";
  const professionLabel = PROFESSION_LABELS[profession].toLowerCase();

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
    const contact = { name: text("name"), email: text("email"), phone: text("phone") };
    const body = caretaker
      ? {
          type,
          ...contact,
          category: profession,
          gender: text("gender"),
          localityId: text("localityId"),
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
      await apiRequest("/api/accounts", "POST", body);
      startTransition(() => {
        router.push(caretaker ? "/dashboard/provider" : (next ?? "/"));
        router.refresh();
      });
    } catch (e) {
      if (e instanceof ApiRequestError) {
        // Keep the first message per field; "languages.0" is reported against the languages field.
        const byField: Record<string, string> = {};
        for (const issue of e.issues) byField[issue.path.split(".")[0]] ??= issue.message;
        setIssues(byField);
      }
      setError(e instanceof Error ? e.message : "Could not create the account");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-4" data-testid={`create-${type}-form`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor={`${id}-name`} label="Full name" error={issues.name} className="sm:col-span-2">
          <Input
            {...control("name")}
            autoComplete="name"
            maxLength={60}
            required
            placeholder={caretaker ? "e.g. Sunita Rawat" : "e.g. Aarav Sharma"}
          />
        </Field>
        <Field htmlFor={`${id}-email`} label="Email" error={issues.email}>
          <Input {...control("email")} type="email" autoComplete="email" maxLength={120} required placeholder="you@example.com" />
        </Field>
        <Field htmlFor={`${id}-phone`} label="Mobile number" error={issues.phone}>
          <Input {...control("phone")} type="tel" autoComplete="tel" inputMode="tel" required placeholder="+91 98765 43210" />
        </Field>
      </div>

      {caretaker && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor={`${id}-gender`} label="Gender" error={issues.gender}>
              <Select {...control("gender")} defaultValue="" required>
                <option value="" disabled>
                  Choose…
                </option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field htmlFor={`${id}-localityId`} label="Based in" error={issues.localityId}>
              <Select {...control("localityId")} defaultValue="" required>
                <option value="" disabled>
                  Choose your area…
                </option>
                {LOCALITIES_BY_STATE.map(([state, localities]) => (
                  <optgroup key={state} label={state}>
                    {localities.map((locality) => (
                      <option key={locality.id} value={locality.id}>
                        {localityLabel(locality)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>
            <Field htmlFor={`${id}-languages`} label="Languages" error={issues.languages} hint="Separate with commas">
              <Input {...control("languages")} defaultValue="Hindi, English" autoComplete="off" />
            </Field>
            <Field htmlFor={`${id}-yearsExperience`} label="Years of experience" error={issues.yearsExperience}>
              <Input {...control("yearsExperience")} type="number" inputMode="numeric" min={0} max={60} step={1} defaultValue={0} />
            </Field>
          </div>
          <p className="rounded-xl bg-canvas p-3 text-xs text-ink-muted">
            Your {professionLabel} profile starts <strong className="font-semibold text-ink">unverified</strong>, with standard
            services and prices. Submit your documents from the dashboard to get verified — only verified caretakers can be booked.
          </p>
        </>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="create-account-submit">
        {caretaker ? `Create ${professionLabel} account` : "Create customer account"} <ArrowRight aria-hidden className="size-4" />
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
