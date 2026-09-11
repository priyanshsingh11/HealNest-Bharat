import { CircleAlert, Hourglass, ShieldQuestion } from "lucide-react";
import type { Metadata } from "next";
import { VerifiedTick } from "@/components/category-meta";
import { ProviderDashboardHeader, ProviderGate } from "@/components/dashboard/provider-header";
import { VerificationForm } from "@/components/dashboard/verification-form";
import { Badge } from "@/components/ui/badge";
import { Card, SectionHeading } from "@/components/ui/card";
import { PROFESSION_LABELS } from "@/lib/categories";
import { formatDateTime } from "@/lib/formatters";
import { getProviderDashboard } from "@/lib/provider-dashboard";
import { DOCUMENT_LABELS, REGISTRATION_LABELS, VERIFICATION_REQUIREMENTS } from "@/lib/verification";
import type { ApplicationStatus, ProviderProfile, User, VerificationApplication, VerificationDetails } from "@/types";

export const metadata: Metadata = { title: "Profile & verification" };

const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: "warning" | "success" | "danger" | "neutral" }> = {
  submitted: { label: "Under review", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Not approved", tone: "danger" },
  superseded: { label: "Replaced", tone: "neutral" },
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
    policeVerificationRef: "",
  };
}

function StatusPanel({ provider, latest }: { provider: ProviderProfile; latest: VerificationApplication | null }) {
  const underReview = latest?.status === "submitted";
  if (provider.verificationStatus === "verified") {
    return (
      <div className="flex items-start gap-3">
        <VerifiedTick className="mt-0.5 size-7" />
        <div>
          <h2 className="text-lg font-bold">You&apos;re verified</h2>
          <p className="text-sm text-ink-muted">
            Your profile shows the blue verified tick and customers can book you.{" "}
            {underReview
              ? "Your updated details are under review — you stay bookable meanwhile."
              : "If your details change, submit them again below — you stay bookable while we review."}
          </p>
        </div>
      </div>
    );
  }
  const [Icon, title, body, tone] = underReview
    ? [Hourglass, "Verification under review", "HealNest Bharat staff are checking your details. You'll get the blue tick once approved.", "text-amber-700"]
    : provider.verificationStatus === "rejected"
      ? [CircleAlert, "Verification not approved", "Please fix the issue noted below and resubmit.", "text-rose-700"]
      : [ShieldQuestion, "Not verified yet", "Submit your details to get the blue verified tick. Only verified caretakers can be booked.", "text-ink-muted"];
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
function CheckList({ checks }: { checks: string[] }) {
  return (
    <>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
        {checks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">Once approved, your profile gets the blue verified tick.</p>
    </>
  );
}

export default async function ProviderVerificationPage() {
  const { session, repo, provider, pickerOptions } = await getProviderDashboard();
  if (!provider) return <ProviderGate pickerOptions={pickerOptions} missing={session.role === "provider"} />;

  const [applications, user] = await Promise.all([repo.listVerificationApplications({ providerId: provider.id }), repo.getUser(provider.userId)]);
  const latest = applications[0] ?? null;
  const req = VERIFICATION_REQUIREMENTS[provider.category];
  const checks = [
    "Government photo ID — we keep only the last 4 characters",
    req.registration && `${REGISTRATION_LABELS[provider.category]} with your council`,
    req.qualifications && "Your qualifications and where you studied",
    req.police && "Police verification certificate",
    `Documents: ${req.documents.map((kind) => DOCUMENT_LABELS[kind].toLowerCase()).join(", ")}`,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProviderDashboardHeader provider={provider} pickerOptions={pickerOptions} eyebrow="Profile & verification" />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <StatusPanel provider={provider} latest={latest} />
            {latest?.status === "rejected" && latest.reviewerNote && (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                <strong>Reviewer&apos;s note:</strong> {latest.reviewerNote}
              </p>
            )}
            {applications.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-bold">Your applications</h3>
                <ul className="mt-2 divide-y divide-line text-sm">
                  {applications.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="text-ink-muted">
                        Submitted {formatDateTime(a.submittedAt)}
                        {a.reviewedAt && a.status !== "superseded" && ` · reviewed ${formatDateTime(a.reviewedAt)}`}
                      </span>
                      <Badge tone={APPLICATION_STATUS[a.status].tone}>{APPLICATION_STATUS[a.status].label}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <details className="rounded-2xl border border-line bg-white p-4 lg:hidden">
            <summary className="cursor-pointer font-bold text-ink">What we check</summary>
            <CheckList checks={checks} />
          </details>

          <Card className="p-4 sm:p-6">
            <SectionHeading
              title={`${PROFESSION_LABELS[provider.category]} verification`}
              description="Fields marked by your profession are required. HealNest Bharat staff check them against your documents before approving."
            />
            <VerificationForm providerId={provider.id} category={provider.category} initial={initialDetails(provider, user, latest)} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="hidden p-5 lg:sticky lg:top-24 lg:block">
            <h2 className="font-bold">What we check</h2>
            <CheckList checks={checks} />
          </Card>
        </div>
      </div>
    </div>
  );
}
