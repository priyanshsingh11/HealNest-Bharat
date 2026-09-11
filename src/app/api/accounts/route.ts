import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { setSessionCookies } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { forbidden } from "@/lib/errors";
import { createDemoAccount } from "@/lib/services/accounts";
import { accountCreateSchema } from "@/lib/validations";

/** Demo sign-up: creates a customer or caretaker account and logs straight into it. */
export async function POST(request: Request) {
  return handle(request, LIMITS.write, async () => {
    if (!demoToolsEnabled()) throw forbidden("Creating demo accounts is disabled.");
    const input = accountCreateSchema.parse(await readJson(request));
    const session = await createDemoAccount(getRepository(), input);
    return setSessionCookies(NextResponse.json({ session }, { status: 201 }), session);
  });
}
