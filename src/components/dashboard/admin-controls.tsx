"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { apiRequest } from "@/lib/client-api";
import type { Category, LineItemType, PlatformConfig, PricingRule, Service, VerificationStatus } from "@/types";

function useMutation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  async function mutate(fn: () => Promise<unknown>) {
    setError(null);
    setSaved(false);
    try {
      await fn();
      setSaved(true);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }
  return { pending, error, saved, mutate };
}

function Feedback({ error, saved }: { error: string | null; saved: boolean }) {
  return (
    <>
      {error && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}
      <span aria-live="polite" className="text-xs text-emerald-800">
        {saved && !error ? "Saved" : ""}
      </span>
    </>
  );
}

export function VerificationSelect({ providerId, status, name }: { providerId: string; status: VerificationStatus; name: string }) {
  const { pending, error, saved, mutate } = useMutation();
  return (
    <div>
      <Select
        aria-label={`Verification status for ${name}`}
        value={status}
        disabled={pending}
        onChange={(e) => mutate(() => apiRequest(`/api/providers/${providerId}`, "PATCH", { verificationStatus: e.target.value }))}
        className="h-9 py-1"
      >
        <option value="verified">Verified</option>
        <option value="pending">Pending</option>
        <option value="unverified">Unverified</option>
        <option value="rejected">Rejected</option>
      </Select>
      <Feedback error={error} saved={saved} />
    </div>
  );
}

/** Approve or reject a caretaker's verification application. A note is required when rejecting. */
export function VerificationDecision({ applicationId }: { applicationId: string }) {
  const { pending, error, saved, mutate } = useMutation();
  const [note, setNote] = useState("");
  const decide = (decision: "approve" | "reject") =>
    mutate(() => apiRequest(`/api/admin/verification/${applicationId}`, "PATCH", { decision, note }));
  return (
    <div className="space-y-2">
      <Label htmlFor={`note-${applicationId}`}>Reviewer note</Label>
      <Textarea
        id={`note-${applicationId}`}
        value={note}
        maxLength={400}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Required when rejecting — tell the caretaker what to fix."
        className="min-h-16"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="success" size="sm" disabled={pending} onClick={() => decide("approve")} data-testid="approve-verification">
          Approve & verify
        </Button>
        <Button variant="danger" size="sm" disabled={pending} onClick={() => decide("reject")}>
          Reject
        </Button>
        <Feedback error={error} saved={saved} />
      </div>
    </div>
  );
}

export function ActiveToggle({ url, active, label }: { url: string; active: boolean; label: string }) {
  const { pending, error, mutate } = useMutation();
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
        {active ? "Active" : "Inactive"}
      </label>
      <Feedback error={error} saved={false} />
    </div>
  );
}

export function CategoryEditor({ category }: { category: Category }) {
  const { pending, error, saved, mutate } = useMutation();
  const [description, setDescription] = useState(category.description);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        mutate(() => apiRequest(`/api/admin/categories/${category.id}`, "PATCH", { description }));
      }}
    >
      <Label htmlFor={`cat-${category.id}`}>{category.name} — description</Label>
      <Textarea id={`cat-${category.id}`} value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          Save
        </Button>
        <Feedback error={error} saved={saved} />
      </div>
    </form>
  );
}

export function ServicePriceEditor({ service }: { service: Service }) {
  const { pending, error, saved, mutate } = useMutation();
  const [rupees, setRupees] = useState(String(service.basePriceMinor / 100));
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
        aria-label={`Base price in rupees for ${service.name}`}
        type="number"
        min={0}
        step="1"
        value={rupees}
        onChange={(e) => setRupees(e.target.value)}
        className="h-9 w-24 py-1"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        Save
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

  function submit(e: FormEvent) {
    e.preventDefault();
    mutate(() => apiRequest(`/api/admin/pricing-rules/${rule.id}`, "PATCH", { mode, value: Math.round(Number(amount) * 100), active }));
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 items-end gap-3 rounded-xl border border-line p-4 sm:grid-cols-[1fr_8rem_8rem_auto_auto]">
      <div className="col-span-2 sm:col-span-1">
        <p className="font-semibold text-ink">{rule.label}</p>
        <p className="text-xs text-ink-muted">Applies to: {rule.itemType.replace("_", " ")} line</p>
      </div>
      <div>
        <Label htmlFor={`${rule.id}-mode`}>Mode</Label>
        <Select id={`${rule.id}-mode`} value={mode} onChange={(e) => setMode(e.target.value as PricingRule["mode"])} className="h-9 py-1">
          <option value="fixed">Fixed ₹</option>
          <option value="percent">Percent %</option>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${rule.id}-value`}>{mode === "fixed" ? "Amount (₹)" : "Percent (%)"}</Label>
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
        Active
      </label>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
        <Feedback error={error} saved={saved} />
      </div>
    </form>
  );
}

const TAXABLE: { value: Exclude<LineItemType, "tax">; label: string }[] = [
  { value: "visit", label: "Visit fee" },
  { value: "procedure", label: "Procedure fee" },
  { value: "medicine", label: "Medicines" },
  { value: "travel", label: "Travel fee" },
  { value: "platform_fee", label: "Platform fee" },
];

export function PlatformConfigForm({ config }: { config: PlatformConfig }) {
  const { pending, error, saved, mutate } = useMutation();
  const [form, setForm] = useState({
    taxLabel: config.taxLabel,
    taxRate: String(config.taxRateBps / 100),
    taxAppliesTo: config.taxAppliesTo.filter((t): t is Exclude<LineItemType, "tax"> => t !== "tax"),
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
          <Label htmlFor="taxLabel">Tax label</Label>
          <Input id="taxLabel" value={form.taxLabel} onChange={(e) => set("taxLabel", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="taxRate">Tax rate (%)</Label>
          <Input id="taxRate" type="number" min={0} max={50} step="0.01" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="validity">Quote validity (min)</Label>
          <Input id="validity" type="number" min={5} max={1440} value={form.quoteValidityMinutes} onChange={(e) => set("quoteValidityMinutes", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="emergency">Emergency number</Label>
          <Input id="emergency" value={form.emergencyNumber} onChange={(e) => set("emergencyNumber", e.target.value)} />
        </div>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Tax applies to</legend>
        <div className="flex flex-wrap gap-4">
          {TAXABLE.map((item) => (
            <label key={item.value} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-brand-700"
                checked={form.taxAppliesTo.includes(item.value)}
                onChange={(e) =>
                  set("taxAppliesTo", e.target.checked ? [...form.taxAppliesTo, item.value] : form.taxAppliesTo.filter((t) => t !== item.value))
                }
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="refund">Refund policy</Label>
        <Textarea id="refund" value={form.refundPolicy} onChange={(e) => set("refundPolicy", e.target.value)} />
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="size-4 accent-brand-700"
          checked={form.prescriptionRequiredForMedicine}
          onChange={(e) => set("prescriptionRequiredForMedicine", e.target.checked)}
        />
        Require a prescription for medicines
      </label>
      <div>
        <Label htmlFor="rxNote">Prescription note</Label>
        <Textarea id="rxNote" value={form.prescriptionNote} onChange={(e) => set("prescriptionNote", e.target.value)} className="min-h-16" />
      </div>
      <div>
        <Label htmlFor="licensing">Licensing note</Label>
        <Textarea id="licensing" value={form.licensingNote} onChange={(e) => set("licensingNote", e.target.value)} className="min-h-16" />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          Save settings
        </Button>
        <Feedback error={error} saved={saved} />
      </div>
    </form>
  );
}
