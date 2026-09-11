import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { setSessionCookies } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { unprocessable } from "@/lib/errors";
import { completeEmailSignIn } from "@/lib/services/email-auth";
import { emailCodesAvailable, emailCodesUnavailable, verifyEmailCode } from "@/lib/supabase-auth";
import { emailCodeVerifySchema } from "@/lib/validations";

/** Checks the emailed code, finishes a sign-up if one was sent along, and logs in. */
export async function POST(request: Request) {
  return handle(request, LIMITS.write, async () => {
    if (!emailCodesAvailable()) throw emailCodesUnavailable();
    const input = emailCodeVerifySchema.parse(await readJson(request));
    if (input.account && input.account.email !== input.email) throw unprocessable("The sign-up email doesn't match.");

    const authUser = await verifyEmailCode(input.email, input.token);
    const session = await completeEmailSignIn(getRepository(), authUser, input.account);
    return setSessionCookies(NextResponse.json({ session }), session);
  });
}
