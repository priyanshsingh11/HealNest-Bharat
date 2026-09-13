import { CircleAlert, Hourglass, ShieldQuestion } from "lucide-react";
import type { Metadata } from "next";
import { VerifiedTick } from "@/components/category-meta";
import { ProviderDashboardHeader, ProviderGate } from "@/components/dashboard/provider-header";
import { VerificationForm } from "@/components/dashboard/verification-form";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeading } from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";
import { domainMessages } from "@/lib/i18n/messages/domain";
import { verificationMessages } from "@/lib/i18n/messages/verification";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { getProviderDashboard } from "@/lib/provider-dashboard";
import { VERIFICATION_REQUIREMENTS } from "@/lib/verification";
import type { ApplicationStatus, ProviderProfile, User, VerificationApplication, VerificationDetails } from "@/types";

type PageMessages = (typeof verificationMessages)["en"]["page"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(verificationMessages);
  return { title: t.page.title };
}

const APPLICATION_TONE: Record<ApplicationStatus, "warning" | "success" | "danger" | "neutral"> = {
  submitted: "warning",
  approved: "success",
  rejected: "danger",
  superseded: "neutral",
};

/** Prefills the form from the latest application, or from the current profile for a first submission. */
function initialDetails(provider: ProviderProfile, user: User | null, latest: VerificationApplication | null): VerificationDetails {
  if (latest) return latest.details;
  const registration = provider.credentials.find((c) => c.reference && /registration/i.test(c.label));
  return {
    fullName: provider.name,
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    addressText: "",
    city: provider.baseLocation.city,
    languages: provider.languages,
    yearsExperience: provider.yearsExperience,
    govtIdType: "aadhaar",
    govtIdLast4: "",
    photoUrl: provider.photoUrl,
    registrationNumber: registration?.reference ?? "",
    registrationCouncil: registration?.issuer ?? "",
    qualifications: [],
    employments: [],
    policeVerificationRef: "",
  };
}

function StatusPanel({ provider, latest, t }: { provider: ProviderProfile; latest: VerificationApplication | null; t: PageMessages }) {
  const underReview = latest?.status === "submitted";
  if (provider.verificationStatus === "verified") {
    return (
      <div className="flex items-start gap-3">
        <VerifiedTick className="mt-0.5 size-7" />
        <div>
          <h2 className="text-lg font-bold">{t.verifiedTitle}</h2>
          <p className="text-sm text-ink-muted">
            {t.verifiedBody} {underReview ? t.verifiedUnderReview : t.verifiedResubmit}
          </p>
        </div>
      </div>
    );
  }
  const [Icon, title, body, tone] = underReview
    ? [Hourglass, t.reviewTitle, t.reviewBody, "text-amber-700"]
    : provider.verificationStatus === "rejected"
      ? [CircleAlert, t.rejectedTitle, t.rejectedBody, "text-rose-700"]
      : [ShieldQuestion, t.unverifiedTitle, t.unverifiedBody, "text-ink-muted"];
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden className={`mt-0.5 size-6 shrink-0 ${tone}`} />
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-ink-muted">{body}</p>
      </div>
    </div>
  );
}

/** "What we check" content — shown in the sidebar on desktop and as a disclosure above the form on phones. */
function CheckList({ checks, footer }: { checks: string[]; footer: string }) {
  return (
    <>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
        {checks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">{footer}</p>
    </>
  );
}

export default async function ProviderVerificationPage() {
  const { session, repo, provider } = await getProviderDashboard();
  if (!provider) return <ProviderGate missing={session.role === "provider"} />;

  const [applications, user] = await Promise.all([repo.listVerificationApplications({ providerId: provider.id }), repo.getUser(provider.userId)]);
  const latest = applications[0] ?? null;
  const locale = await getLocale();
  const t = verificationMessages[locale].page;
  const domain = domainMessages[locale];
  const req = VERIFICATION_REQUIREMENTS[provider.category];
  const checks = [
    t.checks.photoId,
    req.registration && t.checks.registration(domain.registration[provider.category]),
    req.qualifications && t.checks.qualifications,
    t.checks.work,
    req.police && t.checks.police,
    t.checks.documents(req.documents.map((kind) => domain.documents[kind])),
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProviderDashboardHeader provider={provider} eyebrow={t.title} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <StatusPanel provider={provider} latest={latest} t={t} />
            {latest?.status === "rejected" && latest.reviewerNote && (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                <strong>{t.reviewerNote}</strong> {latest.reviewerNote}
              </p>
            )}
            {applications.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-bold">{t.yourApplications}</h3>
                <ul className="mt-2 divide-y divide-line text-sm">
                  {applications.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="text-ink-muted">
                        {t.submittedAt(formatDateTime(a.submittedAt, locale))}
                        {a.reviewedAt && a.status !== "superseded" && t.reviewedAt(formatDateTime(a.reviewedAt, locale))}
                      </span>
                      <Badge tone={APPLICATION_TONE[a.status]}>{t.applicationStatus[a.status]}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <details className="rounded-2xl border border-line bg-white p-4 lg:hidden">
            <summary className="cursor-pointer font-bold text-ink">{t.whatWeCheck}</summary>
            <CheckList checks={checks} footer={t.checksFooter} />
          </details>

          <Card className="p-4 sm:p-6">
            <SectionHeading
              title={t.formTitle(domain.professions[provider.category])}
              description={t.formDescription}
            />
            <VerificationForm providerId={provider.id} category={provider.category} initial={initialDetails(provider, user, latest)} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="hidden p-5 lg:sticky lg:top-24 lg:block">
            <h2 className="font-bold">{t.whatWeCheck}</h2>
            <CheckList checks={checks} footer={t.checksFooter} />
          </Card>
        </div>
      </div>
    </div>
  );
}
