"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { apiRequest } from "@/lib/client-api";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { adminMessages } from "@/lib/i18n/messages/admin";
import { domainMessages } from "@/lib/i18n/messages/domain";
import type { Category, LineItemType, PlatformConfig, PricingRule, Service, VerificationStatus } from "@/types";

function useMutation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const t = useMessages(adminMessages).controls;
  async function mutate(fn: () => Promise<unknown>) {
    setError(null);
    setSaved(false);
    try {
      await fn();
      setSaved(true);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : t.somethingWentWrong);
    }
  }
  return { pending, error, saved, mutate };
}

function Feedback({ error, saved }: { error: string | null; saved: boolean }) {
  const t = useMessages(adminMessages).controls;
  return (
    <>
      {error && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}
      <span aria-live="polite" className="text-xs text-emerald-800">
        {saved && !error ? t.saved : ""}
      </span>
    </>
  );
}

export function VerificationSelect({ providerId, status, name }: { providerId: string; status: VerificationStatus; name: string }) {
  const { pending, error, saved, mutate } = useMutation();
  const t = useMessages(adminMessages).controls;
  return (
    <div>
      <Select
        aria-label={t.verificationFor(name)}
        value={status}
        disabled={pending}
        onChange={(e) => mutate(() => apiRequest(`/api/providers/${providerId}`, "PATCH", { verificationStatus: e.target.value }))}
        className="h-9 py-1"
      >
        <option value="verified">{t.verificationOptions.verified}</option>
        <option value="pending">{t.verificationOptions.pending}</option>
        <option value="unverified">{t.verificationOptions.unverified}</option>
        <option value="rejected">{t.verificationOptions.rejected}</option>
      </Select>
      <Feedback error={error} saved={saved} />
    </div>
  );
}

/** Approve or reject a caretaker's verification application. A note is required when rejecting. */
export function VerificationDecision({ applicationId }: { applicationId: string }) {
  const { pending, error, saved, mutate } = useMutation();
  const [note, setNote] = useState("");
  const t = useMessages(adminMessages).controls;
  const decide = (decision: "approve" | "reject") =>
    mutate(() => apiRequest(`/api/admin/verification/${applicationId}`, "PATCH", { decision, note }));
  return (
    <div className="space-y-2">
      <Label htmlFor={`note-${applicationId}`}>{t.reviewerNote}</Label>
      <Textarea
        id={`note-${applicationId}`}
        value={note}
        maxLength={400}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.reviewerNotePlaceholder}
        className="min-h-16"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="success" size="sm" disabled={pending} onClick={() => decide("approve")} data-testid="approve-verification">
          {t.approve}
        </Button>
        <Button variant="danger" size="sm" disabled={pending} onClick={() => decide("reject")}>
          {t.reject}
        </Button>
        <Feedback error={error} saved={saved} />
      </div>
    </div>
  );
}

export function ActiveToggle({ url, active, label }: { url: string; active: boolean; label: string }) {
  const { pending, error, mutate } = useMutation();
  const t = useMessages(adminMessages).controls;
  return (
    <div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-brand-700"
          checked={active}
          disabled={pending}
          onChange={(e) => mutate(() => apiRequest(url, "PATCH", { active: e.target.checked }))}
          aria-label={label}
        />
        {active ? t.active : t.inactive}
      </label>
      <Feedback error={error} saved={false} />
    </div>
  );
}

export function CategoryEditor({ category }: { category: Category }) {
  const { pending, error, saved, mutate } = useMutation();
  const [description, setDescription] = useState(category.description);
  const t = useMessages(adminMessages).controls;
  const locale = useLocale();
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        mutate(() => apiRequest(`/api/admin/categories/${category.id}`, "PATCH", { description }));
      }}
    >
      <Label htmlFor={`cat-${category.id}`}>{t.categoryDescription(domainMessages[locale].categories[category.id]?.name ?? category.name)}</Label>
      <Textarea id={`cat-${category.id}`} value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {t.save}
        </Button>
        <Feedback error={error} saved={saved} />
      </div>
    </form>
  );
}

export function ServicePriceEditor({ service }: { service: Service }) {
  const { pending, error, saved, mutate } = useMutation();
  const [rupees, setRupees] = useState(String(service.basePriceMinor / 100));
  const t = useMessages(adminMessages).controls;
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        mutate(() => apiRequest(`/api/admin/services/${service.id}`, "PATCH", { basePriceMinor: Math.round(Number(rupees) * 100) }));
      }}
    >
      <span className="text-sm text-ink-muted" aria-hidden>
        ₹
      </span>
      <Input
        aria-label={t.basePriceFor(service.name)}
        type="number"
        min={0}
        step="1"
        value={rupees}
        onChange={(e) => setRupees(e.target.value)}
        className="h-9 w-24 py-1"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {t.save}
      </Button>
      <Feedback error={error} saved={saved} />
    </form>
  );
}

/** Edits one margin rule. Fixed values are entered in rupees, percentages in %. Stored as paise / basis points. */
export function PricingRuleEditor({ rule }: { rule: PricingRule }) {
  const { pending, error, saved, mutate } = useMutation();
  const [mode, setMode] = useState(rule.mode);
  const [amount, setAmount] = useState(String(rule.value / 100));
  const [active, setActive] = useState(rule.active);
  const t = useMessages(adminMessages).controls;

  function submit(e: FormEvent) {
    e.preventDefault();
    mutate(() => apiRequest(`/api/admin/pricing-rules/${rule.id}`, "PATCH", { mode, value: Math.round(Number(amount) * 100), active }));
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 items-end gap-3 rounded-xl border border-line p-4 sm:grid-cols-[1fr_8rem_8rem_auto_auto]">
      <div className="col-span-2 sm:col-span-1">
        <p className="font-semibold text-ink">{rule.label}</p>
        <p className="text-xs text-ink-muted">{t.appliesTo(t.lineItems[rule.itemType])}</p>
      </div>
      <div>
        <Label htmlFor={`${rule.id}-mode`}>{t.mode}</Label>
        <Select id={`${rule.id}-mode`} value={mode} onChange={(e) => setMode(e.target.value as PricingRule["mode"])} className="h-9 py-1">
          <option value="fixed">{t.fixed}</option>
          <option value="percent">{t.percent}</option>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${rule.id}-value`}>{mode === "fixed" ? t.amount : t.percentValue}</Label>
        <Input
          id={`${rule.id}-value`}
          type="number"
          min={0}
          max={mode === "percent" ? 100 : undefined}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-9 py-1"
        />
      </div>
      <label className="flex h-9 items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-700" checked={active} onChange={(e) => setActive(e.target.checked)} />
        {t.active}
      </label>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {t.save}
        </Button>
        <Feedback error={error} saved={saved} />
      </div>
    </form>
  );
}

const TAXABLE: Exclude<LineItemType, "tax">[] = ["visit", "procedure", "medicine", "travel", "platform_fee"];

export function PlatformConfigForm({ config }: { config: PlatformConfig }) {
  const { pending, error, saved, mutate } = useMutation();
  const t = useMessages(adminMessages).controls;
  const [form, setForm] = useState({
    taxLabel: config.taxLabel,
    taxRate: String(config.taxRateBps / 100),
    taxAppliesTo: config.taxAppliesTo.filter((item): item is Exclude<LineItemType, "tax"> => item !== "tax"),
    quoteValidityMinutes: String(config.quoteValidityMinutes),
    refundPolicy: config.refundPolicy,
    prescriptionRequiredForMedicine: config.prescriptionRequiredForMedicine,
    prescriptionNote: config.prescriptionNote,
    licensingNote: config.licensingNote,
    emergencyNumber: config.emergencyNumber,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutate(() =>
          apiRequest("/api/admin/config", "PATCH", {
            taxLabel: form.taxLabel,
            taxRateBps: Math.round(Number(form.taxRate) * 100),
            taxAppliesTo: form.taxAppliesTo,
            quoteValidityMinutes: Number(form.quoteValidityMinutes),
            refundPolicy: form.refundPolicy,
            prescriptionRequiredForMedicine: form.prescriptionRequiredForMedicine,
            prescriptionNote: form.prescriptionNote,
            licensingNote: form.licensingNote,
            emergencyNumber: form.emergencyNumber,
          }),
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <Label htmlFor="taxLabel">{t.taxLabel}</Label>
          <Input id="taxLabel" value={form.taxLabel} onChange={(e) => set("taxLabel", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="taxRate">{t.taxRate}</Label>
          <Input id="taxRate" type="number" min={0} max={50} step="0.01" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="validity">{t.quoteValidity}</Label>
          <Input id="validity" type="number" min={5} max={1440} value={form.quoteValidityMinutes} onChange={(e) => set("quoteValidityMinutes", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="emergency">{t.emergencyNumber}</Label>
          <Input id="emergency" value={form.emergencyNumber} onChange={(e) => set("emergencyNumber", e.target.value)} />
        </div>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">{t.taxAppliesTo}</legend>
        <div className="flex flex-wrap gap-4">
          {TAXABLE.map((item) => (
            <label key={item} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-brand-700"
                checked={form.taxAppliesTo.includes(item)}
                onChange={(e) =>
                  set("taxAppliesTo", e.target.checked ? [...form.taxAppliesTo, item] : form.taxAppliesTo.filter((x) => x !== item))
                }
              />
              {t.taxable[item]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="refund">{t.refundPolicy}</Label>
        <Textarea id="refund" value={form.refundPolicy} onChange={(e) => set("refundPolicy", e.target.value)} />
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="size-4 accent-brand-700"
          checked={form.prescriptionRequiredForMedicine}
          onChange={(e) => set("prescriptionRequiredForMedicine", e.target.checked)}
        />
        {t.requirePrescription}
      </label>
      <div>
        <Label htmlFor="rxNote">{t.prescriptionNote}</Label>
        <Textarea id="rxNote" value={form.prescriptionNote} onChange={(e) => set("prescriptionNote", e.target.value)} className="min-h-16" />
      </div>
      <div>
        <Label htmlFor="licensing">{t.licensingNote}</Label>
        <Textarea id="licensing" value={form.licensingNote} onChange={(e) => set("licensingNote", e.target.value)} className="min-h-16" />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t.saveSettings}
        </Button>
        <Feedback error={error} saved={saved} />
      </div>
    </form>
  );
}
