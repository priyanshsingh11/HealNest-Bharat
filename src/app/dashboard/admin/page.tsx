import { FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/booking-status";
import { KindBadge, VerificationBadge, VerifiedTick } from "@/components/category-meta";
import {
  ActiveToggle,
  CategoryEditor,
  PlatformConfigForm,
  PricingRuleEditor,
  ServicePriceEditor,
  VerificationDecision,
  VerificationSelect,
} from "@/components/dashboard/admin-controls";
import { SwitchRole } from "@/components/dashboard/switch-role";
import { ProviderAvatar } from "@/components/provider-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeading } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/booking-status";
import { categoryName, PROFESSION_LABELS } from "@/lib/categories";
import { getRepository } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { DOCUMENT_LABELS, GOVT_ID_LABELS } from "@/lib/verification";
import { BOOKING_STATUSES, type VerificationApplication } from "@/types";

export const metadata: Metadata = { title: "Admin" };

const SECTIONS = [
  { id: "verification", label: "Verification requests" },
  { id: "providers", label: "Providers" },
  { id: "bookings", label: "Bookings" },
  { id: "pricing", label: "Pricing & margins" },
  { id: "settings", label: "Settings" },
  { id: "catalogue", label: "Categories & services" },
  { id: "audit", label: "Audit log" },
];

const th = "px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-ink-muted";
const td = "px-3 py-2.5 align-top";

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** The submitted details an admin checks against the documents. */
function applicationRows(application: VerificationApplication): [string, string][] {
  const d = application.details;
  const rows: [string, string][] = [
    ["Mobile", d.phone],
    ["Email", d.email],
    ["Address", d.addressText.toLowerCase().includes(d.city.toLowerCase()) ? d.addressText : `${d.addressText}, ${d.city}`],
    ["Languages", d.languages.join(", ")],
    ["Experience", `${d.yearsExperience} years`],
    ["Government ID", `${GOVT_ID_LABELS[d.govtIdType]} ending ${d.govtIdLast4}`],
  ];
  if (d.registrationNumber) rows.push(["Registration", `${d.registrationNumber} · ${d.registrationCouncil}`]);
  if (d.policeVerificationRef) rows.push(["Police verification", d.policeVerificationRef]);
  return rows;
}

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (session.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-extrabold">Admin</h1>
        <p className="mt-2 text-ink-muted">This area requires the admin role. The demo uses mock login.</p>
        <Card className="mt-6 p-6">
          <SwitchRole role="admin" label="Continue as admin" />
        </Card>
      </div>
    );
  }

  const repo = getRepository();
  const [providers, bookings, rules, config, categories, services, auditLogs, applications] = await Promise.all([
    repo.listProviders(),
    repo.listBookings(),
    repo.listPricingRules(),
    repo.getPlatformConfig(),
    repo.listCategories(),
    repo.listServices(),
    repo.listAuditLogs(50),
    repo.listVerificationApplications(),
  ]);

  const providerById = new Map(providers.map((p) => [p.id, p]));
  const counts = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, bookings.filter((b) => b.status === s).length]));
  const live = bookings.filter((b) => b.status !== "CANCELLED" && b.status !== "DECLINED");
  const platformEarnings = live.reduce((sum, b) => sum + b.quote.platformEarningsMinor, 0);
  const submitted = applications.filter((a) => a.status === "submitted");
  const reviewed = applications.filter((a) => a.status === "approved" || a.status === "rejected").slice(0, 5);

  const stats = [
    { label: "Providers", value: String(providers.length) },
    { label: "Verification requests waiting", value: String(submitted.length) },
    { label: "Bookings", value: String(bookings.length) },
    { label: "Platform earnings (live bookings)", value: formatMoney(platformEarnings) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Admin</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Operations</h1>

      <nav aria-label="Admin sections" className="mt-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="inline-flex h-9 items-center rounded-full border border-line bg-white px-3 text-sm font-semibold whitespace-nowrap hover:border-brand-300">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-ink-muted sm:text-sm">{s.label}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-8">
        <Card className="scroll-mt-24 p-6" id="verification">
          <SectionHeading
            title={`Verification requests (${submitted.length})`}
            description="Check each caretaker's identity, qualifications and registration against their documents before approving. Approval gives them the blue verified tick and makes them bookable."
          />
          {submitted.length === 0 ? (
            <p className="text-sm text-ink-muted">No applications waiting for review.</p>
          ) : (
            <ul className="space-y-4">
              {submitted.map((application) => {
                const provider = providerById.get(application.providerId);
                return (
                  <li key={application.id} className="rounded-xl border border-line p-4" data-testid="verification-request">
                    <div className="flex flex-wrap items-start gap-4">
                      <ProviderAvatar provider={{ name: application.details.fullName, category: application.category, photoUrl: application.details.photoUrl }} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-ink">
                          {application.details.fullName} <span className="font-medium text-ink-muted">· {PROFESSION_LABELS[application.category]}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          Submitted {formatDateTime(application.submittedAt)} ·{" "}
                          {provider ? (
                            <Link href={`/providers/${provider.id}`} className="font-semibold text-brand-700 hover:underline">
                              {provider.id}
                            </Link>
                          ) : (
                            application.providerId
                          )}
                        </p>
                        {provider && (
                          <div className="mt-1.5">
                            <VerificationBadge status={provider.verificationStatus} />
                          </div>
                        )}
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      {applicationRows(application).map(([label, value]) => (
                        <div key={label} className="min-w-0">
                          <dt className="text-xs font-bold uppercase tracking-wide text-ink-muted">{label}</dt>
                          <dd className="break-words">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted">Qualifications</h3>
                        {application.details.qualifications.length === 0 ? (
                          <p className="text-sm text-ink-muted">None listed</p>
                        ) : (
                          <ul className="mt-1 space-y-1 text-sm">
                            {application.details.qualifications.map((q) => (
                              <li key={`${q.degree}-${q.year}`}>
                                <span className="font-semibold">{q.degree}</span> — {q.institution}, {q.year}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted">Documents</h3>
                        <ul className="mt-1 space-y-1 text-sm">
                          {application.documents.map((doc) => (
                            <li key={`${doc.kind}-${doc.fileName}`} className="flex items-start gap-1.5">
                              <FileText aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                              <span>
                                {DOCUMENT_LABELS[doc.kind]}: <span className="text-ink-muted">{doc.fileName} · {formatBytes(doc.sizeBytes)}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1 text-xs text-ink-muted">Demo: file names only — connect document storage before going live.</p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-line pt-4">
                      <VerificationDecision applicationId={application.id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {reviewed.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 font-bold">Recently reviewed</h3>
              <ul className="divide-y divide-line text-sm">
                {reviewed.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <Badge tone={a.status === "approved" ? "success" : "danger"}>{a.status === "approved" ? "Approved" : "Rejected"}</Badge>
                    <span className="font-semibold">{a.details.fullName}</span>
                    <span className="text-ink-muted">{PROFESSION_LABELS[a.category]}</span>
                    {a.reviewedAt && <span className="text-xs text-ink-muted">{formatDateTime(a.reviewedAt)}</span>}
                    {a.reviewerNote && <span className="w-full text-ink-muted">“{a.reviewerNote}”</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card className="scroll-mt-24 p-6" id="providers">
          <SectionHeading title="Provider verification" description="Only verified providers can receive bookings. Every change is written to the audit log." />
          <ul className="-mx-6 divide-y divide-line border-y border-line md:hidden">
            {providers.map((p) => (
              <li key={p.id} className="space-y-2 px-6 py-3">
                <div>
                  <span className="flex items-center gap-1">
                    <Link href={`/providers/${p.id}`} className="font-semibold text-brand-700 hover:underline">
                      {p.name}
                    </Link>
                    {p.verificationStatus === "verified" && <VerifiedTick className="size-4" />}
                  </span>
                  <p className="text-xs text-ink-muted">
                    {p.id}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <KindBadge category={p.category} />
                  <span className="text-ink-muted">{p.baseLocation.city}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-3">
                  <VerificationSelect providerId={p.id} status={p.verificationStatus} name={p.name} />
                  <ActiveToggle url={`/api/providers/${p.id}`} active={p.active} label={`${p.name} listing active`} />
                </div>
              </li>
            ))}
          </ul>
          <div className="-mx-6 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="border-y border-line bg-canvas">
                <tr>
                  <th className={th}>Provider</th>
                  <th className={th}>Category</th>
                  <th className={th}>City</th>
                  <th className={th}>Credentials</th>
                  <th className={th}>Verification</th>
                  <th className={th}>Listing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {providers.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>
                      <span className="flex items-center gap-1">
                        <Link href={`/providers/${p.id}`} className="font-semibold text-brand-700 hover:underline">
                          {p.name}
                        </Link>
                        {p.verificationStatus === "verified" && <VerifiedTick className="size-4" />}
                      </span>
                      <p className="text-xs text-ink-muted">
                        {p.id}
                      </p>
                    </td>
                    <td className={td}>
                      <p>{categoryName(p.category)}</p>
                      <KindBadge category={p.category} />
                    </td>
                    <td className={td}>{p.baseLocation.city}</td>
                    <td className={td}>
                      <ul className="text-xs text-ink-muted">
                        {p.credentials.map((c) => (
                          <li key={c.label}>
                            {c.label} — {c.issuer}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className={td}>
                      <VerificationSelect providerId={p.id} status={p.verificationStatus} name={p.name} />
                    </td>
                    <td className={td}>
                      <ActiveToggle url={`/api/providers/${p.id}`} active={p.active} label={`${p.name} listing active`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="scroll-mt-24 p-6" id="bookings">
          <SectionHeading title="Bookings by status" />
          <ul className="mb-4 flex flex-wrap gap-2">
            {BOOKING_STATUSES.map((s) => (
              <li key={s} className="rounded-full border border-line px-3 py-1 text-sm">
                {STATUS_LABELS[s]} <span className="font-bold">{counts[s]}</span>
              </li>
            ))}
          </ul>
          <ul className="-mx-6 divide-y divide-line border-y border-line text-sm md:hidden">
            {bookings.map((b) => (
              <li key={b.id} className="space-y-1 px-6 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/booking/${b.id}`} className="min-w-0 truncate font-semibold text-brand-700 hover:underline">
                    {b.id}
                  </Link>
                  <StatusBadge status={b.status} />
                </div>
                <p>
                  {b.providerName} <span className="text-xs text-ink-muted">· {b.serviceName}</span>
                </p>
                <p className="flex flex-wrap gap-x-3 text-xs text-ink-muted">
                  <span>
                    Total <span className="font-semibold text-ink">{formatMoney(b.totalAmountMinor)}</span>
                  </span>
                  <span>Payout {formatMoney(b.quote.providerPayoutMinor)}</span>
                  <span>{formatDateTime(b.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
          <div className="-mx-6 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="border-y border-line bg-canvas">
                <tr>
                  <th className={th}>Booking</th>
                  <th className={th}>Provider / service</th>
                  <th className={th}>Status</th>
                  <th className={th}>Total</th>
                  <th className={th}>Payout</th>
                  <th className={th}>Platform</th>
                  <th className={th}>Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className={td}>
                      <Link href={`/booking/${b.id}`} className="font-semibold text-brand-700 hover:underline">
                        {b.id}
                      </Link>
                    </td>
                    <td className={td}>
                      <p>{b.providerName}</p>
                      <p className="text-xs text-ink-muted">{b.serviceName}</p>
                    </td>
                    <td className={td}>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className={`${td} font-semibold`}>{formatMoney(b.totalAmountMinor)}</td>
                    <td className={td}>{formatMoney(b.quote.providerPayoutMinor)}</td>
                    <td className={td}>{formatMoney(b.quote.platformEarningsMinor)}</td>
                    <td className={`${td} text-xs text-ink-muted`}>{formatDateTime(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="scroll-mt-24 p-6" id="pricing">
          <SectionHeading
            title="Pricing rules & platform margin"
            description="Margins are always disclosed to customers as separate amounts. Changes apply to new quotes only — booked price snapshots never change."
          />
          <div className="space-y-3">
            {rules.map((rule) => (
              <PricingRuleEditor key={rule.id} rule={rule} />
            ))}
          </div>
        </Card>

        <Card className="scroll-mt-24 p-6" id="settings">
          <SectionHeading title="Country settings" description="Tax, refunds, prescription and licensing are configurable — nothing is hardcoded for one country." />
          <PlatformConfigForm config={config} />
        </Card>

        <Card className="scroll-mt-24 p-6" id="catalogue">
          <SectionHeading title="Categories" />
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((c) => (
              <div key={c.id} className="space-y-2 rounded-xl border border-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <KindBadge category={c.id} />
                  <ActiveToggle url={`/api/admin/categories/${c.id}`} active={c.active} label={`${c.name} category active`} />
                </div>
                <CategoryEditor category={c} />
              </div>
            ))}
          </div>

          <h3 className="mt-8 mb-1 font-bold">Services ({services.length})</h3>
          <p className="mb-3 text-xs text-ink-muted md:hidden">Swipe sideways to see all columns.</p>
          <div className="-mx-6 max-h-[36rem] overflow-auto border-b border-line md:mt-3">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="sticky top-0 z-10 border-t border-line bg-canvas shadow-[0_1px_0_var(--color-line)]">
                <tr>
                  <th className={th}>Service</th>
                  <th className={th}>Provider</th>
                  <th className={th}>Base price</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className={`${td} whitespace-nowrap`}>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-ink-muted">{categoryName(s.category)}</p>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{providerById.get(s.providerId)?.name}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      <ServicePriceEditor service={s} />
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <ActiveToggle url={`/api/admin/services/${s.id}`} active={s.active} label={`${s.name} active`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="scroll-mt-24 p-6" id="audit">
          <SectionHeading title="Audit log" description="Quote snapshots, booking status changes, verification, reviews and pricing changes." />
          {auditLogs.length === 0 ? (
            <p className="text-sm text-ink-muted">No changes recorded yet in this session.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {auditLogs.map((log) => (
                <li key={log.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:gap-4">
                  <span className="w-44 shrink-0 text-xs text-ink-muted">{formatDateTime(log.at)}</span>
                  <span className="font-semibold">{log.action}</span>
                  <span className="text-ink-muted">
                    {log.entityType} {log.entityId} · by {log.actorRole}
                  </span>
                  <code className="min-w-0 truncate text-xs text-ink-muted">{JSON.stringify(log.details)}</code>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
