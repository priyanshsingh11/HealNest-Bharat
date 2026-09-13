import "server-only";
import { randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { createClient, type AuthError, type SupabaseClient } from "@supabase/supabase-js";
import { AppError, conflict, unprocessable } from "@/lib/errors";

// Email + password credentials. Supabase Auth holds them when the app's data lives in Supabase; the in-memory data
// source (development and tests) gets an in-memory stand-in with the same behaviour. Either way this module only
// answers "who owns this email and password" — the app's own account (app_users) and session live elsewhere.

export interface PasswordAuth {
  /** Creates the login and returns its id. Throws a 409 when the email already has one. */
  createLogin(email: string, password: string): Promise<string>;
  /** Removes a login, used to undo a sign-up that failed half-way. */
  deleteLogin(id: string): Promise<void>;
  /** The login id when the email and password match, otherwise null. */
  verifyPassword(email: string, password: string): Promise<string | null>;
  /** Emails a code for choosing a new password. Does nothing, silently, for an email with no login. */
  sendResetCode(email: string): Promise<void>;
  /** Checks the emailed code, sets the new password and returns the login id. */
  resetPassword(email: string, code: string, password: string): Promise<string>;
}

export const EXISTING_EMAIL_MESSAGE =
  "An account with this email already exists. Log in, or use “Forgot password?” if you don't know the password.";
export const WRONG_CODE_MESSAGE = "That code is wrong or has expired. Check the latest email, or request a new code.";
export const RESET_RATE_LIMITED_MESSAGE = "Too many attempts. Please wait a few minutes and try again.";

// ---------------------------------------------------------------------------
// Supabase Auth

class SupabasePasswordAuth implements PasswordAuth {
  constructor(
    private readonly url: string,
    private readonly serviceKey: string,
  ) {}

  /** A fresh client per call: signing in stores a session on the client, which must never leak between requests. */
  private client(): SupabaseClient {
    return createClient(this.url, this.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  private fail(context: string, error: AuthError): never {
    if (error.status === 429 || error.code?.startsWith("over_")) throw new AppError(RESET_RATE_LIMITED_MESSAGE, 429, "RATE_LIMITED");
    if (error.code === "weak_password") throw unprocessable("Choose a stronger password: at least 8 characters, not a common one.");
    throw new Error(`Supabase ${context} failed: ${error.code ?? error.status} ${error.message}`);
  }

  async createLogin(email: string, password: string) {
    // Pre-confirmed: the app asks for a password, not a confirmation click, and the reset flow proves the email later.
    const { data, error } = await this.client().auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      if (error.code === "email_exists" || error.code === "user_already_exists" || /already (been )?registered/i.test(error.message)) {
        throw conflict(EXISTING_EMAIL_MESSAGE);
      }
      this.fail("createUser", error);
    }
    return data.user.id;
  }

  async deleteLogin(id: string) {
    const { error } = await this.client().auth.admin.deleteUser(id);
    if (error) this.fail("deleteUser", error);
  }

  async verifyPassword(email: string, password: string) {
    const { data, error } = await this.client().auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status === 429) this.fail("signInWithPassword", error);
      // Wrong password, unknown email, unconfirmed email: all just "no".
      if (error.status && error.status < 500) return null;
      this.fail("signInWithPassword", error);
    }
    return data.user?.id ?? null;
  }

  async sendResetCode(email: string) {
    const { error } = await this.client().auth.resetPasswordForEmail(email);
    if (error) this.fail("resetPasswordForEmail", error);
  }

  async resetPassword(email: string, code: string, password: string) {
    const client = this.client();
    const { data, error } = await client.auth.verifyOtp({ email, token: code, type: "recovery" });
    if (error) {
      if (error.status === 429) this.fail("verifyOtp", error);
      if (error.status && error.status < 500) throw new AppError(WRONG_CODE_MESSAGE, 400, "INVALID_CODE");
      this.fail("verifyOtp", error);
    }
    const id = data.user?.id;
    if (!id) throw new Error("Supabase verifyOtp returned no user");
    const updated = await client.auth.admin.updateUserById(id, { password });
    if (updated.error) this.fail("updateUserById", updated.error);
    return id;
  }
}

// ---------------------------------------------------------------------------
// In memory

type MemoryLogin = { id: string; salt: string; hash: string };
const RESET_CODE_TTL_MS = 10 * 60 * 1000;

const hashPassword = (password: string, salt: string) => scryptSync(password, salt, 32).toString("hex");

export class MemoryPasswordAuth implements PasswordAuth {
  private readonly logins = new Map<string, MemoryLogin>();
  private readonly resetCodes = new Map<string, { code: string; expiresAt: number }>();

  async createLogin(email: string, password: string) {
    const key = email.toLowerCase();
    if (this.logins.has(key)) throw conflict(EXISTING_EMAIL_MESSAGE);
    const salt = randomBytes(16).toString("hex");
    const id = randomUUID();
    this.logins.set(key, { id, salt, hash: hashPassword(password, salt) });
    return id;
  }

  async deleteLogin(id: string) {
    for (const [email, login] of this.logins) if (login.id === id) this.logins.delete(email);
  }

  async verifyPassword(email: string, password: string) {
    const login = this.logins.get(email.toLowerCase());
    if (!login) return null;
    const given = Buffer.from(hashPassword(password, login.salt), "hex");
    return timingSafeEqual(given, Buffer.from(login.hash, "hex")) ? login.id : null;
  }

  async sendResetCode(email: string) {
    const key = email.toLowerCase();
    if (!this.logins.has(key)) return;
    const code = String(randomInt(0, 100_000_000)).padStart(8, "0");
    this.resetCodes.set(key, { code, expiresAt: Date.now() + RESET_CODE_TTL_MS });
    // There is no mailer in memory mode; the server log stands in for the inbox.
    console.info(`[auth:memory] password reset code for ${key}: ${code}`);
  }

  async resetPassword(email: string, code: string, password: string) {
    const key = email.toLowerCase();
    const pending = this.resetCodes.get(key);
    const login = this.logins.get(key);
    if (!pending || !login || pending.expiresAt <= Date.now() || pending.code !== code.trim()) {
      throw new AppError(WRONG_CODE_MESSAGE, 400, "INVALID_CODE");
    }
    this.resetCodes.delete(key);
    login.salt = randomBytes(16).toString("hex");
    login.hash = hashPassword(password, login.salt);
    return login.id;
  }

  /** Tests only: the code a reset would have emailed. */
  peekResetCode(email: string): string | undefined {
    return this.resetCodes.get(email.toLowerCase())?.code;
  }
}

// ---------------------------------------------------------------------------

type GlobalWithAuth = typeof globalThis & { __healnestPasswordAuth?: PasswordAuth };

/** Matches the data source: Supabase Auth alongside the Supabase repository, the in-memory stand-in otherwise. */
export function getPasswordAuth(kind: "memory" | "supabase"): PasswordAuth {
  const store = globalThis as GlobalWithAuth;
  store.__healnestPasswordAuth ??=
    kind === "supabase"
      ? new SupabasePasswordAuth(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : new MemoryPasswordAuth();
  return store.__healnestPasswordAuth;
}
