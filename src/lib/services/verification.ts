import { conflict, notFound } from "@/lib/errors";
import type { CareRepository, ProviderPatch } from "@/lib/repository/types";
import { assertAdmin, assertProviderOwns, audit } from "@/lib/services/admin";
import type { Session } from "@/lib/session";
import { GOVT_ID_LABELS, REGISTRATION_LABELS, type VerificationSubmission } from "@/lib/verification";
import type { CategoryId, Credential, ProviderProfile, VerificationApplication, VerificationDetails } from "@/types";

// Caretaker verification: providers submit identity, qualifications and registration; admins approve or reject.
// Approval is what earns the verified tick.

const newApplicationId = () => `vapp_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

export async function submitVerification(
  repo: CareRepository,
  session: Session,
  providerId: string,
  input: VerificationSubmission,
  now = new Date(),
): Promise<VerificationApplication> {
  assertProviderOwns(session, providerId);
  const provider = await repo.getProvider(providerId);
  if (!provider) throw notFound("Provider");

  const details: VerificationDetails = {
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    addressText: input.addressText,
    city: input.city,
    languages: input.languages,
    yearsExperience: input.yearsExperience,
    govtIdType: input.govtIdType,
    govtIdLast4: input.govtIdLast4.toUpperCase(),
    photoUrl: input.photoUrl,
    registrationNumber: input.registrationNumber,
    registrationCouncil: input.registrationCouncil,
    qualifications: input.qualifications,
    employments: (input.employments ?? []).map((job) => ({ ...job, endYear: job.current ? null : job.endYear })),
    policeVerificationRef: input.policeVerificationRef,
  };

  // A newer submission replaces one still waiting for review.
  for (const pending of await repo.listVerificationApplications({ providerId, status: "submitted" })) {
    await repo.updateVerificationApplication(pending.id, {
      status: "superseded",
      reviewedAt: now.toISOString(),
      reviewerNote: "Replaced by a newer application.",
    });
  }

  const application = await repo.createVerificationApplication({
    id: newApplicationId(),
    providerId,
    category: provider.category,
    status: "submitted",
    details,
    documents: input.documents,
    submittedAt: now.toISOString(),
    reviewedAt: null,
    reviewerNote: "",
  });

  // Verified providers stay bookable while updated details are reviewed.
  if (provider.verificationStatus !== "verified") {
    await repo.updateProvider(providerId, { verificationStatus: "pending" });
  }
  await audit(repo, session, "verification.submitted", "verification", application.id, {
    providerId,
    documents: input.documents.length,
  });
  return application;
}

export async function reviewVerification(
  repo: CareRepository,
  session: Session,
  applicationId: string,
  decision: "approve" | "reject",
  note: string,
  now = new Date(),
): Promise<VerificationApplication> {
  assertAdmin(session);
  const application = await repo.getVerificationApplication(applicationId);
  if (!application) throw notFound("Verification application");
  if (application.status !== "submitted") throw conflict("This application has already been reviewed.");
  const provider = await repo.getProvider(application.providerId);
  if (!provider) throw notFound("Provider");

  const reviewed = await repo.updateVerificationApplication(applicationId, {
    status: decision === "approve" ? "approved" : "rejected",
    reviewedAt: now.toISOString(),
    reviewerNote: note,
  });

  const before = provider.verificationStatus;
  let after = before;
  if (decision === "approve") {
    await repo.updateProvider(provider.id, approvedProfilePatch(provider, application.details));
    after = "verified";
  } else if (before !== "verified") {
    await repo.updateProvider(provider.id, { verificationStatus: "rejected" });
    after = "rejected";
  }

  await audit(repo, session, decision === "approve" ? "verification.approved" : "verification.rejected", "verification", applicationId, {
    providerId: provider.id,
    ...(note ? { note } : {}),
  });
  if (after !== before) {
    await audit(repo, session, "provider.verification_changed", "provider", provider.id, { from: before, to: after });
  }
  return reviewed;
}

/** Profile changes applied on approval: verified identity and credentials. */
export function approvedProfilePatch(provider: ProviderProfile, details: VerificationDetails): ProviderPatch {
  return {
    verificationStatus: "verified",
    name: details.fullName,
    photoUrl: details.photoUrl ?? provider.photoUrl,
    languages: details.languages,
    yearsExperience: details.yearsExperience,
    credentials: credentialsFromDetails(provider.category, details),
  };
}

export function credentialsFromDetails(category: CategoryId, details: VerificationDetails): Credential[] {
  const credentials: Credential[] = details.qualifications.map((q) => ({
    label: q.degree,
    issuer: `${q.institution}, ${q.year}`,
    verified: true,
  }));
  if (details.registrationNumber) {
    credentials.push({
      label: REGISTRATION_LABELS[category],
      issuer: details.registrationCouncil,
      reference: details.registrationNumber,
      verified: true,
    });
  }
  if (details.policeVerificationRef) {
    credentials.push({ label: "Police verification", issuer: "Local police", reference: details.policeVerificationRef, verified: true });
  }
  credentials.push({ label: "Identity check", issuer: `${GOVT_ID_LABELS[details.govtIdType]} checked by HealNest Bharat`, verified: true });
  return credentials;
}
