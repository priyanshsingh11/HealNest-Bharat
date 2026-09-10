import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/booking-status";
import { KindBadge } from "@/components/category-meta";
import {
  ActiveToggle,
  CategoryEditor,
  PlatformConfigForm,
  PricingRuleEditor,
  ServicePriceEditor,
  VerificationSelect,
} from "@/components/dashboard/admin-controls";
import { SwitchRole } from "@/components/dashboard/switch-role";
import { Card, SectionHeading } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/booking-status";
import { categoryName } from "@/lib/categories";
import { getRepository } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { BOOKING_STATUSES } from "@/types";

export const metadata: Metadata = { title: "Admin" };

const SECTIONS = [
  { id: "providers", label: "Providers" },
  { id: "bookings", label: "Bookings" },
  { id: "pricing", label: "Pricing & margins" },
  { id: "settings", label: "Settings" },
  { id: "catalogue", label: "Categories & services" },
  { id: "audit", label: "Audit log" },
];

const th = "px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-ink-muted";
const td = "px-3 py-2.5 align-top";

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
  const [providers, bookings, rules, config, categories, services, auditLogs] = await Promise.all([
    repo.listProviders(),
    repo.listBookings(),
    repo.listPricingRules(),
    repo.getPlatformConfig(),
    repo.listCategories(),
    repo.listServices(),
    repo.listAuditLogs(50),
  ]);

  const providerNames = new Map(providers.map((p) => [p.id, p.name]));
  const counts = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, bookings.filter((b) => b.status === s).length]));
  const live = bookings.filter((b) => b.status !== "CANCELLED" && b.status !== "DECLINED");
  const platformEarnings = live.reduce((sum, b) => sum + b.quote.platformEarningsMinor, 0);
  const pendingVerification = providers.filter((p) => p.verificationStatus === "pending").length;

  const stats = [
    { label: "Providers", value: String(providers.length) },
    { label: "Awaiting verification", value: String(pendingVerification) },
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

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-sm text-ink-muted">{s.label}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-8">
        <Card className="scroll-mt-24 p-6" id="providers">
          <SectionHeading title="Provider verification" description="Only verified providers can receive bookings. Every change is written to the audit log." />
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="border-y border-line bg-slate-50">
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
                      <Link href={`/providers/${p.id}`} className="font-semibold text-brand-700 hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-xs text-ink-muted">{p.id}</p>
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
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="border-y border-line bg-slate-50">
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

          <h3 className="mt-8 mb-3 font-bold">Services ({services.length})</h3>
          <div className="-mx-6 max-h-[36rem] overflow-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="sticky top-0 border-y border-line bg-slate-50">
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
                    <td className={td}>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-ink-muted">{categoryName(s.category)}</p>
                    </td>
                    <td className={td}>{providerNames.get(s.providerId)}</td>
                    <td className={td}>
                      <ServicePriceEditor service={s} />
                    </td>
                    <td className={td}>
                      <ActiveToggle url={`/api/admin/services/${s.id}`} active={s.active} label={`${s.name} active`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="scroll-mt-24 p-6" id="audit">
          <SectionHeading title="Audit log" description="Quote snapshots, booking status changes, verification and pricing changes." />
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
