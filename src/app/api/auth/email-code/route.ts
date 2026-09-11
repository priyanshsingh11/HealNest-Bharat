import { handle, LIMITS, readJson } from "@/lib/api";
import { getRepository } from "@/lib/db";
import { checkNewAccount } from "@/lib/services/accounts";
import { findAccountByEmail, noAccountError } from "@/lib/services/email-auth";
import { emailCodesAvailable, emailCodesUnavailable, sendEmailCode } from "@/lib/supabase-auth";
import { emailCodeRequestSchema } from "@/lib/validations";

/** Emails a one-time sign-in code. Logging in needs an existing account; signing up needs an unused email. */
export async function POST(request: Request) {
  return handle(request, LIMITS.write, async () => {
    if (!emailCodesAvailable()) throw emailCodesUnavailable();
    const input = emailCodeRequestSchema.parse(await readJson(request));
    const repo = getRepository();

    if (input.intent === "login") {
      if (!(await findAccountByEmail(repo, input.email))) throw noAccountError();
      await sendEmailCode(input.email);
    } else {
      await checkNewAccount(repo, input.account);
      await sendEmailCode(input.account.email, { full_name: input.account.name, account_type: input.account.type });
    }
    return { sent: true };
  });
}
