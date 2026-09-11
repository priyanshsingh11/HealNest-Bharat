import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { assertProviderOwns } from "@/lib/services/admin";
import { submitVerification } from "@/lib/services/verification";
import { verificationSchemaFor } from "@/lib/verification";

type Context = { params: Promise<{ providerId: string }> };

/** GET — the provider's own verification applications, newest first (admins can read any). */
export async function GET(request: Request, { params }: Context) {
  return handle(request, LIMITS.read, async () => {
    const { providerId } = await params;
    assertProviderOwns(await getSession(), providerId);
    const applications = await getRepository().listVerificationApplications({ providerId });
    return { applications };
  });
}

/** POST — submit identity, qualifications, registration and documents for review. Required fields depend on the profession. */
export async function POST(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { providerId } = await params;
    const session = await getSession();
    // Check ownership before revealing anything about the profile.
    assertProviderOwns(session, providerId);
    const repo = getRepository();
    const provider = await repo.getProvider(providerId);
    if (!provider) throw notFound("Provider");
    const input = verificationSchemaFor(provider.category).parse(await readJson(request));
    const application = await submitVerification(repo, session, providerId, input);
    return NextResponse.json({ application }, { status: 201 });
  });
}
