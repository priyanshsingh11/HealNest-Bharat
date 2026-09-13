import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { setSessionCookies } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { getPasswordAuth } from "@/lib/password-auth";
import { signUp } from "@/lib/services/password-accounts";
import { signUpSchema } from "@/lib/validations";

/** Sign-up: creates a customer or caretaker account with an email + password login, and logs straight into it. */
export async function POST(request: Request) {
  return handle(request, LIMITS.auth, async () => {
    const { password, ...input } = signUpSchema.parse(await readJson(request));
    const repo = getRepository();
    const session = await signUp(repo, getPasswordAuth(repo.kind), input, password);
    return setSessionCookies(NextResponse.json({ session }, { status: 201 }), session);
  });
}
