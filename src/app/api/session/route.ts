import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { forbidden, notFound } from "@/lib/errors";
import { buildSession, PROVIDER_COOKIE, ROLE_COOKIE } from "@/lib/session";
import { sessionSchema } from "@/lib/validations";

const COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 };

/** Mock login: switches the demo role. Replace with real authentication before launch. */
export async function POST(request: Request) {
  return handle(request, LIMITS.write, async () => {
    if (!demoToolsEnabled()) throw forbidden("Role switching is disabled.");
    const input = sessionSchema.parse(await readJson(request));
    if (input.role === "provider" && input.providerId) {
      const provider = await getRepository().getProvider(input.providerId);
      if (!provider) throw notFound("Provider");
    }
    const session = buildSession(input.role, input.providerId);
    const response = NextResponse.json({ session });
    response.cookies.set(ROLE_COOKIE, session.role, COOKIE_OPTIONS);
    if (session.providerId) response.cookies.set(PROVIDER_COOKIE, session.providerId, COOKIE_OPTIONS);
    return response;
  });
}
