import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { setSessionCookies } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { registerDevice } from "@/lib/devices";
import { forbidden } from "@/lib/errors";
import { createDemoAccount } from "@/lib/services/accounts";
import { accountCreateSchema } from "@/lib/validations";

/**
 * Sign-up: creates a customer or caretaker account, registers the calling browser as the account's device and
 * logs straight into it.
 *
 * The `account` in the response — the device secret included — is what the browser stores so it can offer this
 * account at /login later. It is returned exactly once, here; the server keeps only a hash of the secret.
 */
export async function POST(request: Request) {
  return handle(request, LIMITS.write, async () => {
    if (!demoToolsEnabled()) throw forbidden("Creating accounts is disabled.");
    const input = accountCreateSchema.parse(await readJson(request));
    const repo = getRepository();
    const session = await createDemoAccount(repo, input);
    const token = await registerDevice(repo, session.userId, request.headers.get("user-agent"));

    const provider = session.providerId ? await repo.getProvider(session.providerId) : null;
    const account = {
      id: session.userId,
      role: session.role,
      providerId: session.providerId,
      category: provider?.category ?? null,
      name: input.name,
      detail: provider ? `${provider.baseLocation.locality}, ${provider.baseLocation.city}` : input.email,
      token,
      addedAt: new Date().toISOString(),
    };
    return setSessionCookies(NextResponse.json({ session, account }, { status: 201 }), session);
  });
}
