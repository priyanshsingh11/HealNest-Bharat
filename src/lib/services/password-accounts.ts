import { randomBytes } from "node:crypto";
import { AppError, conflict, forbidden, unprocessable } from "@/lib/errors";
import { EXISTING_EMAIL_MESSAGE, type PasswordAuth } from "@/lib/password-auth";
import type { CareRepository } from "@/lib/repository/types";
import { checkNewAccount, createAppAccount, isAuthPlaceholder } from "@/lib/services/accounts";
import { buildSession, type Session } from "@/lib/session";
import type { AccountCreateInput } from "@/lib/validations";
import type { User } from "@/types";

// Email + password accounts. PasswordAuth proves who owns an email; this maps that login to the app's own account
// (app_users) and returns the session to open it.

export const WRONG_PASSWORD_MESSAGE = "Email or password is incorrect.";
export const NO_ACCOUNT_MESSAGE = "No HealNest account uses this email yet. Sign up to create one.";
export const STAFF_ACCOUNT_MESSAGE = "Staff accounts sign in from “HealNest Admin sign-in” at the bottom of this page.";

const isConflict = (error: unknown) => error instanceof AppError && error.status === 409;

/** The account that owns this email, ignoring rows left by unfinished sign-ups. */
async function findAccountByEmail(repo: CareRepository, email: string): Promise<User | null> {
  return (await repo.listUsers({ email: email.toLowerCase() })).find((user) => !isAuthPlaceholder(user)) ?? null;
}

/** Ties the account to its login and clears the placeholder row the database's sign-up trigger may have made. */
async function link(repo: CareRepository, account: User, loginId: string): Promise<void> {
  await repo.linkAuthUser(account.id, loginId);
  for (const user of await repo.listUsers({ email: account.email.toLowerCase() })) {
    if (isAuthPlaceholder(user)) await repo.deleteUser(user.id);
  }
}

/** Admins never get in with a password: staff sign-in has its own two-step flow. */
async function sessionFor(repo: CareRepository, account: User): Promise<Session> {
  if (account.role === "admin") throw forbidden(STAFF_ACCOUNT_MESSAGE);
  if (account.role === "provider") {
    const provider = (await repo.listProviders()).find((p) => p.userId === account.id);
    if (!provider) throw unprocessable("This caretaker account has no profile. Please contact HealNest support.");
    return buildSession("provider", provider.id);
  }
  return buildSession("user", undefined, account.id);
}

/**
 * Creates the account and its login, and returns the session to open it. If anything fails after the login was made,
 * the login is removed again so the email isn't left taken by an account that doesn't exist.
 */
export async function signUp(
  repo: CareRepository,
  auth: PasswordAuth,
  input: AccountCreateInput,
  password: string,
  now = new Date(),
): Promise<Session> {
  // Validate first, so no login is created for a sign-up that can't succeed.
  await checkNewAccount(repo, input);

  let loginId: string;
  let createdLogin = true;
  try {
    loginId = await auth.createLogin(input.email, password);
  } catch (error) {
    if (!isConflict(error)) throw error;
    // The email already has a login but no app account (e.g. a staff address, or a password reset done before
    // sign-up). Knowing its password proves it's theirs, so the sign-up can carry on.
    const existing = await auth.verifyPassword(input.email, password);
    if (!existing) throw conflict(EXISTING_EMAIL_MESSAGE);
    loginId = existing;
    createdLogin = false;
  }

  try {
    const session = await createAppAccount(repo, input, now);
    const account = await repo.getUser(session.userId);
    if (!account) throw new Error(`Created account ${session.userId} is missing`);
    await link(repo, account, loginId);
    return session;
  } catch (error) {
    if (createdLogin) await auth.deleteLogin(loginId).catch(() => undefined);
    throw error;
  }
}

export async function logIn(repo: CareRepository, auth: PasswordAuth, email: string, password: string): Promise<Session> {
  const loginId = await auth.verifyPassword(email, password);
  if (!loginId) throw new AppError(WRONG_PASSWORD_MESSAGE, 401, "UNAUTHORIZED");

  const account = (await repo.findUserByAuthId(loginId)) ?? (await findAccountByEmail(repo, email));
  if (!account) throw new AppError(NO_ACCOUNT_MESSAGE, 404, "NOT_FOUND");
  const session = await sessionFor(repo, account);
  await link(repo, account, loginId);
  return session;
}

/**
 * Emails a code for choosing a new password. Accounts made before passwords existed have no login yet, so one is
 * created first (with a random password nobody knows) for the code to belong to. The response is the same whether
 * or not the email has an account, so this can't be used to find out who is registered.
 */
export async function requestPasswordReset(repo: CareRepository, auth: PasswordAuth, email: string): Promise<void> {
  if (await findAccountByEmail(repo, email)) {
    await auth.createLogin(email, randomBytes(24).toString("base64url")).catch((error) => {
      if (!isConflict(error)) throw error;
    });
  }
  await auth.sendResetCode(email);
}

/**
 * Sets the new password and logs in. Returns null when the email has a login but no app account yet — the password
 * is saved, and signing up with it finishes the account.
 */
export async function completePasswordReset(
  repo: CareRepository,
  auth: PasswordAuth,
  email: string,
  code: string,
  password: string,
): Promise<Session | null> {
  const loginId = await auth.resetPassword(email, code, password);
  const account = (await repo.findUserByAuthId(loginId)) ?? (await findAccountByEmail(repo, email));
  if (!account) return null;
  const session = await sessionFor(repo, account);
  await link(repo, account, loginId);
  return session;
}
