import { AppError, unprocessable } from "@/lib/errors";
import type { CareRepository } from "@/lib/repository/types";
import { createDemoAccount, isAuthPlaceholder } from "@/lib/services/accounts";
import { buildSession, type Session } from "@/lib/session";
import type { AccountCreateInput } from "@/lib/validations";
import type { User } from "@/types";

// Email-code sign-in. Supabase Auth proves the person owns the email; this maps that Auth account to the app's
// own account (app_users) and returns the session to log into it.

export type VerifiedAuthUser = { id: string; email: string };

export const noAccountError = () =>
  new AppError("No account uses this email. Create one with “New account”.", 404, "NOT_FOUND");

/** The account that owns this email, ignoring unfinished sign-ups. */
export async function findAccountByEmail(repo: CareRepository, email: string): Promise<User | null> {
  const users = await repo.listUsers({ email: email.toLowerCase() });
  return users.find((user) => !isAuthPlaceholder(user)) ?? null;
}

async function sessionFor(repo: CareRepository, user: User): Promise<Session> {
  if (user.role === "admin") return buildSession("admin", undefined);
  if (user.role === "provider") {
    const provider = (await repo.listProviders()).find((p) => p.userId === user.id);
    if (!provider) throw unprocessable("This caretaker account has no profile yet. Create one with “New account”.");
    return buildSession("provider", provider.id);
  }
  return buildSession("user", undefined, user.id);
}

/**
 * Called once the email code is verified. Logs into the account that owns the email, or creates it from `signup`,
 * then links it to the Auth account and removes the placeholder row the database's sign-up trigger made.
 */
export async function completeEmailSignIn(
  repo: CareRepository,
  authUser: VerifiedAuthUser,
  signup?: AccountCreateInput,
  now = new Date(),
): Promise<Session> {
  const email = authUser.email.toLowerCase();
  let account = await findAccountByEmail(repo, email);

  if (!account) {
    if (!signup) throw noAccountError();
    if (signup.email !== email) throw unprocessable("The sign-up email doesn't match the verified email.");
    const session = await createDemoAccount(repo, signup, now);
    account = await repo.getUser(session.userId);
    if (!account) throw new Error(`Created account ${session.userId} is missing`);
  }

  await repo.linkAuthUser(account.id, authUser.id);
  for (const user of await repo.listUsers({ email })) {
    if (isAuthPlaceholder(user)) await repo.deleteUser(user.id);
  }
  return sessionFor(repo, account);
}
