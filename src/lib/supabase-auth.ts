import "server-only";
import { createClient, type AuthError } from "@supabase/supabase-js";
import { getRepository } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { VerifiedAuthUser } from "@/lib/services/email-auth";

// One-time email codes through Supabase Auth. Supabase only proves who owns the email;
// the app keeps its own cookie session (src/lib/auth.ts).

/** Email codes create Supabase Auth accounts, so they're offered only when app accounts live in Supabase too. */
export function emailCodesAvailable(): boolean {
  return getRepository().kind === "supabase";
}

export const emailCodesUnavailable = () =>
  new AppError("Email sign-in needs the Supabase data source.", 503, "UNAVAILABLE");

/** A fresh client per call: verifyOtp stores the signed-in session on the client, which must not leak between requests. */
function authClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function sendError(error: AuthError): Error {
  if (error.status === 429 || error.code === "over_email_send_rate_limit") {
    return new AppError("Too many codes requested. Wait a minute, then try again.", 429, "RATE_LIMITED");
  }
  if (error.code === "email_address_invalid") return new AppError("Enter a valid email address.", 422, "UNPROCESSABLE");
  if (error.code === "email_address_not_authorized") {
    // Supabase's built-in mailer only emails the project's team members until custom SMTP is set up.
    return new AppError("We can't send email to this address yet. Please try again later.", 503, "UNAVAILABLE");
  }
  return new Error(`Supabase signInWithOtp failed: ${error.code ?? error.status} ${error.message}`);
}

/** Emails a one-time code. Creates the Auth account if it doesn't exist yet; `metadata` is stored on a new account. */
export async function sendEmailCode(email: string, metadata?: Record<string, string>): Promise<void> {
  const { error } = await authClient().auth.signInWithOtp({ email, options: { shouldCreateUser: true, data: metadata } });
  if (error) throw sendError(error);
}

/** Checks the code and returns the Auth account it belongs to. */
export async function verifyEmailCode(email: string, token: string): Promise<VerifiedAuthUser> {
  const { data, error } = await authClient().auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    if (error.status === 429) throw sendError(error);
    if (error.status && error.status < 500) {
      throw new AppError("That code is wrong or has expired. Check the latest email, or request a new code.", 400, "INVALID_CODE");
    }
    throw new Error(`Supabase verifyOtp failed: ${error.code ?? error.status} ${error.message}`);
  }
  if (!data.user?.email) throw new Error("Supabase verifyOtp returned no user");
  return { id: data.user.id, email: data.user.email };
}
