import { handle, LIMITS, readJson } from "@/lib/api";
import { getRepository } from "@/lib/db";
import { getPasswordAuth } from "@/lib/password-auth";
import { requestPasswordReset } from "@/lib/services/password-accounts";
import { passwordResetRequestSchema } from "@/lib/validations";

/**
 * Forgot password, step one: emails a code for choosing a new password. The reply is the same whether or not the
 * email has an account. Step two is POST /api/password-reset/confirm.
 */
export async function POST(request: Request) {
  return handle(request, LIMITS.auth, async () => {
    const { email } = passwordResetRequestSchema.parse(await readJson(request));
    const repo = getRepository();
    await requestPasswordReset(repo, getPasswordAuth(repo.kind), email);
    return { sent: true };
  });
}
