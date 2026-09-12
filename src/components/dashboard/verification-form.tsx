"use client";

import { Camera, CircleCheck, FileCheck2, Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { FieldError, Hint, Input, Label, Select } from "@/components/ui/field";
import { ApiRequestError, apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/formatters";
import {
  DOCUMENT_LABELS,
  GOVT_ID_LABELS,
  QUALIFICATION_OPTIONS,
  REGISTRATION_LABELS,
  VERIFICATION_REQUIREMENTS,
  verificationSchemaFor,
} from "@/lib/verification";
import { GOVT_ID_TYPES, type CategoryId, type DocumentKind, type GovtIdType, type VerificationDetails, type VerificationDocument } from "@/types";

const COMMON_LANGUAGES = [
  "Hindi",
  "English",
  "Bengali",
  "Marathi",
  "Telugu",
  "Tamil",
  "Gujarati",
  "Urdu",
  "Kannada",
  "Malayalam",
  "Odia",
  "Punjabi",
  "Assamese",
  "Konkani",
  "Bhojpuri",
];

const PROFESSION_ROLE_HINT: Record<CategoryId, string> = {
  nurse: "Staff nurse, ICU",
  physiotherapist: "Physiotherapist, OPD",
  phlebotomist: "Lab technician",
  babysitter: "Live-out nanny",
  caregiver: "Elder-care attendant",
};

const PHOTO_SIZE_PX = 320;

/** Centre-crops to a square and downsizes, so the stored photo is a small JPEG data URL. */
async function resizePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file (JPEG, PNG or WebP).");
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(PHOTO_SIZE_PX, side);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't process this photo.");
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-line pt-6 first:border-t-0 first:pt-0 [&>legend+*]:clear-both">
      <legend className="float-left mb-4 w-full text-base font-bold text-ink">{title}</legend>
      {description && <p className="clear-both text-sm text-ink-muted">{description}</p>}
      {children}
    </fieldset>
  );
}

type QualificationRow = { degree: string; institution: string; year: string };

type EmploymentRow = {
  organisation: string;
  role: string;
  city: string;
  current: boolean;
  startYear: string;
  endYear: string;
  contactName: string;
  contactPhone: string;
};

const emptyEmployment = (current: boolean): EmploymentRow => ({
  organisation: "",
  role: "",
  city: "",
  current,
  startYear: "",
  endYear: "",
  contactName: "",
  contactPhone: "",
});

type Props = {
  providerId: string;
  category: CategoryId;
  initial: VerificationDetails;
};

/** Caretaker verification form. Required fields and documents depend on the profession. */
export function VerificationForm({ providerId, category, initial }: Props) {
  const router = useRouter();
  const req = VERIFICATION_REQUIREMENTS[category];
  const [form, setForm] = useState({
    fullName: initial.fullName,
    phone: initial.phone,
    email: initial.email,
    addressText: initial.addressText,
    city: initial.city,
    yearsExperience: String(initial.yearsExperience),
    govtIdType: initial.govtIdType,
    govtIdLast4: initial.govtIdLast4,
    registrationNumber: initial.registrationNumber,
    registrationCouncil: initial.registrationCouncil,
    policeVerificationRef: initial.policeVerificationRef,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const [languages, setLanguages] = useState<string[]>(initial.languages);
  const [otherLanguage, setOtherLanguage] = useState("");
  const [qualifications, setQualifications] = useState<QualificationRow[]>(
    initial.qualifications.length
      ? initial.qualifications.map((q) => ({ degree: q.degree, institution: q.institution, year: String(q.year) }))
      : req.qualifications
        ? [{ degree: "", institution: "", year: "" }]
        : [],
  );
  const [employments, setEmployments] = useState<EmploymentRow[]>(
    initial.employments?.length
      ? initial.employments.map((job) => ({
          organisation: job.organisation,
          role: job.role,
          city: job.city,
          current: job.current,
          startYear: String(job.startYear),
          endYear: job.endYear === null ? "" : String(job.endYear),
          contactName: job.contactName,
          contactPhone: job.contactPhone,
        }))
      : [emptyEmployment(true)],
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial.photoUrl);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Partial<Record<DocumentKind, VerificationDocument>>>({});
  const [confirm, setConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const documentKinds: DocumentKind[] = [...req.documents, ...(["training", "other"] as const).filter((k) => !req.documents.includes(k))];
  const languageOptions = [...new Set([...COMMON_LANGUAGES, ...initial.languages])];
  const documentError = errors.documents ?? Object.entries(errors).find(([key]) => key.startsWith("documents."))?.[1];

  const field = (name: string) => ({
    "aria-invalid": Boolean(errors[name]) || undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    try {
      setPhotoUrl(await resizePhoto(file));
      setPhotoError(null);
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Couldn't read that photo.");
    }
  }

  function addLanguage() {
    const name = otherLanguage.trim();
    if (name && !languages.some((l) => l.toLowerCase() === name.toLowerCase())) setLanguages((l) => [...l, name]);
    setOtherLanguage("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);
    const { yearsExperience, ...rest } = form;
    // Rows the caretaker never filled in are dropped, so error paths are mapped back to the row on screen.
    const filledJobs = employments.filter((job) => job.organisation.trim() || job.role.trim() || job.city.trim() || job.startYear);
    const jobRowIndex = filledJobs.map((job) => employments.indexOf(job));
    const errorPath = (path: string) =>
      path.replace(/^employments\.(\d+)/, (match, index: string) => `employments.${jobRowIndex[Number(index)] ?? index}`);
    const parsed = verificationSchemaFor(category).safeParse({
      ...rest,
      yearsExperience: yearsExperience === "" ? undefined : Number(yearsExperience),
      languages,
      photoUrl: photoUrl ?? undefined,
      qualifications: qualifications.map((q) => ({ degree: q.degree, institution: q.institution, year: q.year === "" ? undefined : Number(q.year) })),
      employments: filledJobs.map((job) => ({
        ...job,
        startYear: job.startYear === "" ? undefined : Number(job.startYear),
        endYear: job.current || job.endYear === "" ? null : Number(job.endYear),
      })),
      documents: Object.values(documents),
      confirmAccurate: confirm,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[errorPath(issue.path.join("."))] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await apiRequest(`/api/providers/${providerId}/verification`, "POST", parsed.data);
      setDone(true);
      startTransition(() => router.refresh());
    } catch (e) {
      if (e instanceof ApiRequestError && e.issues.length) {
        setErrors(Object.fromEntries(e.issues.map((issue) => [errorPath(issue.path), issue.message])));
      }
      setServerError(e instanceof Error ? e.message : "Could not submit your details");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950" data-testid="verification-submitted">
        <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-emerald-700" />
        <div>
          <p className="font-bold">Submitted for review</p>
          <p className="mt-1 text-sm">
            HealNest Bharat staff will check your details against your documents. You&apos;ll see the result on this page, and your
            profile gets the blue verified tick once approved.
          </p>
          <button type="button" className="mt-3 text-sm font-semibold underline underline-offset-2" onClick={() => setDone(false)}>
            Edit and resubmit
          </button>
        </div>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={submit} noValidate className="space-y-6" data-testid="verification-form">
      {(errorCount > 0 || serverError) && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-900">
          {serverError ?? `Please fix ${errorCount} ${errorCount === 1 ? "field" : "fields"} below.`}
        </p>
      )}

      <Section title="Identity & contact" description="As shown on your government ID. We keep only the last 4 characters of your ID number.">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-50 text-xl font-bold text-brand-800">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of a data URL
              <img src={photoUrl} alt="Your profile photo" className="size-full object-cover" />
            ) : (
              <span aria-hidden>{initials(form.fullName || "?")}</span>
            )}
          </div>
          <div>
            <label className={cn(buttonClass({ variant: "secondary", size: "sm" }), "cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600")}>
              <Camera aria-hidden className="size-4" /> {photoUrl ? "Change photo" : "Upload profile photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => choosePhoto(e.target.files?.[0])} />
            </label>
            <Hint>A clear, recent photo of your face. It appears on your profile once approved.</Hint>
            <FieldError id="photoUrl-error" message={photoError ?? errors.photoUrl} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" autoComplete="name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} {...field("fullName")} />
            <FieldError id="fullName-error" message={errors.fullName} />
          </div>
          <div>
            <Label htmlFor="phone">Mobile number</Label>
            <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} {...field("phone")} />
            <FieldError id="phone-error" message={errors.phone} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} {...field("email")} />
            <FieldError id="email-error" message={errors.email} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addressText">Address</Label>
            <Input id="addressText" autoComplete="street-address" value={form.addressText} onChange={(e) => set("addressText", e.target.value)} {...field("addressText")} />
            <FieldError id="addressText-error" message={errors.addressText} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} {...field("city")} />
            <FieldError id="city-error" message={errors.city} />
          </div>
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <div>
              <Label htmlFor="govtIdType">Government ID</Label>
              <Select id="govtIdType" value={form.govtIdType} onChange={(e) => set("govtIdType", e.target.value as GovtIdType)}>
                {GOVT_ID_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {GOVT_ID_LABELS[type]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="govtIdLast4">Last 4</Label>
              <Input
                id="govtIdLast4"
                maxLength={4}
                autoComplete="off"
                value={form.govtIdLast4}
                onChange={(e) => set("govtIdLast4", e.target.value)}
                {...field("govtIdLast4")}
              />
            </div>
            <div className="col-span-2 -mt-2">
              <FieldError id="govtIdLast4-error" message={errors.govtIdLast4} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Professional details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="yearsExperience">Years of experience</Label>
            <Input
              id="yearsExperience"
              type="number"
              min={0}
              max={60}
              value={form.yearsExperience}
              onChange={(e) => set("yearsExperience", e.target.value)}
              {...field("yearsExperience")}
            />
            <FieldError id="yearsExperience-error" message={errors.yearsExperience} />
          </div>
          {req.registration && (
            <>
              <div>
                <Label htmlFor="registrationNumber">{REGISTRATION_LABELS[category]} number</Label>
                <Input
                  id="registrationNumber"
                  autoComplete="off"
                  value={form.registrationNumber}
                  onChange={(e) => set("registrationNumber", e.target.value)}
                  {...field("registrationNumber")}
                />
                <FieldError id="registrationNumber-error" message={errors.registrationNumber} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="registrationCouncil">Registering council</Label>
                <Input
                  id="registrationCouncil"
                  value={form.registrationCouncil}
                  onChange={(e) => set("registrationCouncil", e.target.value)}
                  {...field("registrationCouncil")}
                />
                <FieldError id="registrationCouncil-error" message={errors.registrationCouncil} />
              </div>
            </>
          )}
          {req.police && (
            <div className="sm:col-span-2">
              <Label htmlFor="policeVerificationRef">Police verification certificate number</Label>
              <Input
                id="policeVerificationRef"
                autoComplete="off"
                value={form.policeVerificationRef}
                onChange={(e) => set("policeVerificationRef", e.target.value)}
                {...field("policeVerificationRef")}
              />
              <FieldError id="policeVerificationRef-error" message={errors.policeVerificationRef} />
            </div>
          )}
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-ink">Languages you speak</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {languageOptions.map((language) => {
              const checked = languages.includes(language);
              return (
                <label
                  key={language}
                  className={cn(
                    "inline-flex h-9 cursor-pointer items-center rounded-full border px-3 text-sm font-semibold whitespace-nowrap has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600",
                    checked ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white hover:border-brand-300",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => setLanguages((l) => (checked ? l.filter((x) => x !== language) : [...l, language]))}
                  />
                  {language}
                </label>
              );
            })}
          </div>
          <div className="mt-2 flex max-w-sm gap-2">
            <Input
              aria-label="Add another language"
              placeholder="Another language"
              value={otherLanguage}
              onChange={(e) => setOtherLanguage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLanguage();
                }
              }}
              className="h-9 py-1"
            />
            <Button variant="secondary" size="sm" onClick={addLanguage}>
              Add
            </Button>
          </div>
          <FieldError id="languages-error" message={errors.languages} />
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-ink">
            Qualifications {req.qualifications ? "" : <span className="font-normal text-ink-muted">(optional)</span>}
          </legend>
          <datalist id="qualification-options">
            {QUALIFICATION_OPTIONS[category].map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <ul className="mt-2 space-y-3">
            {qualifications.map((row, index) => {
              const update = (patch: Partial<QualificationRow>) =>
                setQualifications((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
              const key = `qualifications.${index}`;
              return (
                <li key={index} className="grid gap-3 rounded-xl bg-canvas p-3 sm:grid-cols-[10rem_1fr_6rem_auto] sm:items-start">
                  <div>
                    <Label htmlFor={`${key}.degree`}>Qualification</Label>
                    <Input
                      id={`${key}.degree`}
                      list="qualification-options"
                      value={row.degree}
                      onChange={(e) => update({ degree: e.target.value })}
                      placeholder={QUALIFICATION_OPTIONS[category][0]}
                      aria-invalid={Boolean(errors[`${key}.degree`]) || undefined}
                    />
                    <FieldError id={`${key}.degree-error`} message={errors[`${key}.degree`]} />
                  </div>
                  <div>
                    <Label htmlFor={`${key}.institution`}>University / college</Label>
                    <Input
                      id={`${key}.institution`}
                      value={row.institution}
                      onChange={(e) => update({ institution: e.target.value })}
                      aria-invalid={Boolean(errors[`${key}.institution`]) || undefined}
                    />
                    <FieldError id={`${key}.institution-error`} message={errors[`${key}.institution`]} />
                  </div>
                  <div>
                    <Label htmlFor={`${key}.year`}>Year</Label>
                    <Input
                      id={`${key}.year`}
                      type="number"
                      min={1960}
                      max={new Date().getFullYear()}
                      value={row.year}
                      onChange={(e) => update({ year: e.target.value })}
                      aria-invalid={Boolean(errors[`${key}.year`]) || undefined}
                    />
                    <FieldError id={`${key}.year-error`} message={errors[`${key}.year`]} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-self-end text-rose-700 sm:mt-7 sm:justify-self-auto"
                    onClick={() => setQualifications((rows) => rows.filter((_, i) => i !== index))}
                    aria-label={`Remove qualification ${index + 1}`}
                  >
                    <Trash2 aria-hidden className="size-4" />
                    <span className="sm:sr-only">Remove</span>
                  </Button>
                </li>
              );
            })}
          </ul>
          {qualifications.length < 6 && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setQualifications((rows) => [...rows, { degree: "", institution: "", year: "" }])}>
              <Plus aria-hidden className="size-4" /> Add qualification
            </Button>
          )}
          <FieldError id="qualifications-error" message={errors.qualifications} />
        </fieldset>
      </Section>

      <Section
        title="Work history"
        description="Where you work now and where you have worked before. Our team may call the organisation to confirm your role, so give a contact person where you can."
      >
        <ul className="space-y-3">
          {employments.map((row, index) => {
            const update = (patch: Partial<EmploymentRow>) =>
              setEmployments((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
            const key = `employments.${index}`;
            const rowError = errors[key];
            return (
              <li key={index} className="rounded-xl bg-canvas p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{row.current ? "Current workplace" : `Workplace ${index + 1}`}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-700"
                    onClick={() => setEmployments((rows) => rows.filter((_, i) => i !== index))}
                    aria-label={`Remove workplace ${index + 1}`}
                  >
                    <Trash2 aria-hidden className="size-4" />
                    <span className="sm:sr-only">Remove</span>
                  </Button>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor={`${key}.organisation`}>Hospital, clinic, agency or family</Label>
                    <Input
                      id={`${key}.organisation`}
                      value={row.organisation}
                      onChange={(e) => update({ organisation: e.target.value })}
                      placeholder="e.g. Apollo Hospital, Indiranagar"
                      aria-invalid={Boolean(errors[`${key}.organisation`]) || undefined}
                    />
                    <FieldError id={`${key}.organisation-error`} message={errors[`${key}.organisation`]} />
                  </div>
                  <div>
                    <Label htmlFor={`${key}.role`}>Your role there</Label>
                    <Input
                      id={`${key}.role`}
                      value={row.role}
                      onChange={(e) => update({ role: e.target.value })}
                      placeholder={`e.g. ${PROFESSION_ROLE_HINT[category]}`}
                      aria-invalid={Boolean(errors[`${key}.role`]) || undefined}
                    />
                    <FieldError id={`${key}.role-error`} message={errors[`${key}.role`]} />
                  </div>
                  <div>
                    <Label htmlFor={`${key}.city`}>City</Label>
                    <Input
                      id={`${key}.city`}
                      value={row.city}
                      onChange={(e) => update({ city: e.target.value })}
                      aria-invalid={Boolean(errors[`${key}.city`]) || undefined}
                    />
                    <FieldError id={`${key}.city-error`} message={errors[`${key}.city`]} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${key}.startYear`}>From (year)</Label>
                      <Input
                        id={`${key}.startYear`}
                        type="number"
                        min={1960}
                        max={new Date().getFullYear()}
                        value={row.startYear}
                        onChange={(e) => update({ startYear: e.target.value })}
                        aria-invalid={Boolean(errors[`${key}.startYear`]) || undefined}
                      />
                      <FieldError id={`${key}.startYear-error`} message={errors[`${key}.startYear`]} />
                    </div>
                    <div>
                      <Label htmlFor={`${key}.endYear`}>To (year)</Label>
                      <Input
                        id={`${key}.endYear`}
                        type="number"
                        min={1960}
                        max={new Date().getFullYear()}
                        value={row.current ? "" : row.endYear}
                        disabled={row.current}
                        className="disabled:bg-canvas disabled:text-ink-muted"
                        placeholder={row.current ? "Present" : undefined}
                        onChange={(e) => update({ endYear: e.target.value })}
                        aria-invalid={Boolean(errors[`${key}.endYear`]) || undefined}
                      />
                      <FieldError id={`${key}.endYear-error`} message={errors[`${key}.endYear`]} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-ink sm:col-span-2">
                    <input
                      type="checkbox"
                      className="size-4 accent-brand-700"
                      checked={row.current}
                      onChange={(e) => update({ current: e.target.checked, endYear: e.target.checked ? "" : row.endYear })}
                    />
                    I work here now
                  </label>
                  <div>
                    <Label htmlFor={`${key}.contactName`}>
                      Contact person <span className="font-normal text-ink-muted">(optional)</span>
                    </Label>
                    <Input
                      id={`${key}.contactName`}
                      value={row.contactName}
                      onChange={(e) => update({ contactName: e.target.value })}
                      placeholder="Matron, HR or the family member"
                      aria-invalid={Boolean(errors[`${key}.contactName`]) || undefined}
                    />
                    <FieldError id={`${key}.contactName-error`} message={errors[`${key}.contactName`]} />
                  </div>
                  <div>
                    <Label htmlFor={`${key}.contactPhone`}>
                      Their mobile number <span className="font-normal text-ink-muted">(optional)</span>
                    </Label>
                    <Input
                      id={`${key}.contactPhone`}
                      type="tel"
                      value={row.contactPhone}
                      onChange={(e) => update({ contactPhone: e.target.value })}
                      aria-invalid={Boolean(errors[`${key}.contactPhone`]) || undefined}
                    />
                    <FieldError id={`${key}.contactPhone-error`} message={errors[`${key}.contactPhone`]} />
                  </div>
                </div>
                <FieldError id={`${key}-error`} message={rowError} />
              </li>
            );
          })}
        </ul>
        {employments.length < 8 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEmployments((rows) => [...rows, emptyEmployment(rows.length === 0)])}
          >
            <Plus aria-hidden className="size-4" /> Add {employments.length === 0 ? "workplace" : "previous workplace"}
          </Button>
        )}
        <FieldError id="employments-error" message={errors.employments} />
      </Section>

      <Section title="Documents" description="PDF or photo, up to 10 MB each. In this demo only the file name is recorded — files aren't uploaded.">
        <ul className="space-y-2">
          {documentKinds.map((kind) => {
            const doc = documents[kind];
            const required = req.documents.includes(kind);
            return (
              <li key={kind} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {DOCUMENT_LABELS[kind]} {required ? <span className="text-rose-700">*</span> : <span className="text-xs font-normal text-ink-muted">(optional)</span>}
                  </p>
                  {doc ? (
                    <p className="flex items-center gap-1 truncate text-xs text-emerald-800">
                      <FileCheck2 aria-hidden className="size-3.5 shrink-0" /> {doc.fileName} · {formatBytes(doc.sizeBytes)}
                    </p>
                  ) : (
                    <p className="text-xs text-ink-muted">No file chosen</p>
                  )}
                </div>
                <label className={cn(buttonClass({ variant: "secondary", size: "sm" }), "shrink-0 cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sea-600")}>
                  <Upload aria-hidden className="size-4" /> {doc ? "Replace" : "Choose file"}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="sr-only"
                    aria-label={`Upload ${DOCUMENT_LABELS[kind].toLowerCase()}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDocuments((d) => ({ ...d, [kind]: { kind, fileName: file.name.slice(0, 120), sizeBytes: file.size, contentType: file.type } }));
                      }
                    }}
                  />
                </label>
              </li>
            );
          })}
        </ul>
        <FieldError id="documents-error" message={documentError} />
      </Section>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-brand-700"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            aria-describedby={errors.confirmAccurate ? "confirmAccurate-error" : undefined}
          />
          <span className="font-semibold text-ink">
            I confirm these details are accurate, and I consent to HealNest Bharat checking them with the issuing council, police and ID
            records.
          </span>
        </label>
        <FieldError id="confirmAccurate-error" message={errors.confirmAccurate} />
      </div>

      <Button type="submit" size="lg" disabled={submitting || pending} data-testid="submit-verification">
        {submitting ? "Submitting…" : "Submit for verification"}
      </Button>
    </form>
  );
}
