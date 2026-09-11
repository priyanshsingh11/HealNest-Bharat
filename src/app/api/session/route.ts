import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { clearSessionCookies, setSessionCookies } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { forbidden, notFound, unprocessable } from "@/lib/errors";
import { buildSession } from "@/lib/session";
import { sessionSchema } from "@/lib/validations";

/** Mock login: switches the demo role and account. Replace with real authentication before launch. */
export async function POST(request: Request) {
  return handle(request, LIMITS.write, async () => {
    if (!demoToolsEnabled()) throw forbidden("Role switching is disabled.");
    const input = sessionSchema.parse(await readJson(request));
    const repo = getRepository();
    if (input.role === "provider") {
      if (!input.providerId) throw unprocessable("Choose a provider profile.");
      const provider = await repo.getProvider(input.providerId);
      if (!provider) throw notFound("Provider");
    }
    if (input.role === "user" && input.userId) {
      const user = await repo.getUser(input.userId);
      if (!user || user.role !== "user") throw notFound("Customer account");
    }
    const session = buildSession(input.role, input.providerId, input.userId);
    return setSessionCookies(NextResponse.json({ session }), session);
  });
}

/** Log out: clears the mock session cookies. Always allowed, even when demo tools are off. */
export async function DELETE(request: Request) {
  return handle(request, LIMITS.write, async () => clearSessionCookies(NextResponse.json({ ok: true })));
}
