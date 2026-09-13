import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError, forbidden } from "@/lib/errors";
import { staffOtpConfigured } from "@/lib/staff";

// The email half of staff sign-in, backed by Supabase Auth one-time codes.
//
// Setup, once per project:
//   1. Create the staff user in Supabase → Authentication → Users (codes are never sent to an address that
//      has no user: `shouldCreateUser` is false, so a wrong address can't create an account).
//   2. Authentication → Emails → Magic Link template must include {{ .Token }}, otherwise the mail carries
//      only a link and there is no code to type in.
//   3. Set SUPABASE_ANON_KEY, and configure SMTP for anything beyond the project's own members.

/** The browser never sees this client; the anon key is used server-side purely to reach Supabase Auth. */
function authClient(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, (process.env.SUPABASE_ANON_KEY ?? "").trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Emails a one-time code to a staff address that already exists as a Supabase Auth user. */
export async function sendStaffCode(email: string): Promise<void> {
  if (!staffOtpConfigured()) throw forbidden("Staff sign-in is not set up on this deployment.");
  const { error } = await authClient().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (!error) return;
  console.error("[staff] could not send sign-in code", error.message);
  // Supabase rate-limits its mailer (a handful of emails an hour on its built-in SMTP), so "a minute" can be
  // far too short; say so rather than blaming the address.
  if (error.status === 429)
    throw new AppError(
      "Email limit reached for now. Use the latest code already sent to your inbox, or try again later.",
      429,
      "RATE_LIMITED",
    );
  throw new AppError("Could not send the sign-in code. Check that this address is a Supabase Auth user.", 502, "OTP_SEND_FAILED");
}

/** True when the code matches the one Supabase emailed to this address. */
export async function checkStaffCode(email: string, code: string): Promise<boolean> {
  if (!staffOtpConfigured()) return false;
  const { data, error } = await authClient().auth.verifyOtp({ email, token: code, type: "email" });
  if (error) {
    // Wrong or expired codes are the normal case here, so they are not worth logging as failures.
    if (error.status !== 401 && error.status !== 403) console.error("[staff] code check failed", error.message);
    return false;
  }
  return Boolean(data.user);
}
