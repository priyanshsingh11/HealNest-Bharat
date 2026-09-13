import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { setSessionCookies } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { getPasswordAuth } from "@/lib/password-auth";
import { completePasswordReset } from "@/lib/services/password-accounts";
import { passwordResetSchema } from "@/lib/validations";

/**
 * Forgot password, step two: checks the emailed code, saves the new password and logs in. `session` is null when the
 * email has no HealNest account yet — the password is saved, and signing up with it finishes the account.
 */
export async function POST(request: Request) {
  return handle(request, LIMITS.auth, async () => {
    const { email, code, password } = passwordResetSchema.parse(await readJson(request));
    const repo = getRepository();
    const session = await completePasswordReset(repo, getPasswordAuth(repo.kind), email, code, password);
    return session ? setSessionCookies(NextResponse.json({ session }), session) : NextResponse.json({ session: null });
  });
}
