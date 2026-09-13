import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { InvalidTransitionError } from "@/lib/booking-status";
import { AppError } from "@/lib/errors";
import { DEFAULT_LOCALE, localeFromCookieHeader, type Locale } from "@/lib/i18n/config";
import { translateError } from "@/lib/i18n/errors";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export type ApiErrorBody = { error: { code: string; message: string; issues?: { path: string; message: string }[] } };

/** User-facing messages are translated into the caller's language; codes stay stable for programs. */
export function errorResponse(error: unknown, locale: Locale = DEFAULT_LOCALE): NextResponse<ApiErrorBody> {
  const t = (message: string) => translateError(message, locale);
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: t(error.issues[0]?.message ?? "Invalid request"),
          issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: t(issue.message) })),
        },
      },
      { status: 400 },
    );
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: { code: error.code, message: t(error.message) } }, { status: error.status });
  }
  if (error instanceof InvalidTransitionError) {
    return NextResponse.json({ error: { code: "INVALID_TRANSITION", message: t(error.message) } }, { status: 409 });
  }
  console.error("[api] unexpected error", error);
  return NextResponse.json({ error: { code: "INTERNAL", message: t("Something went wrong. Please try again.") } }, { status: 500 });
}

type Limit = { name: string; limit: number; windowMs: number };

export const LIMITS = {
  read: { name: "read", limit: 120, windowMs: 60_000 },
  write: { name: "write", limit: 30, windowMs: 60_000 },
  /** Log in, sign-up and password reset: each attempt guesses a password or can send an email. */
  auth: { name: "auth", limit: 30, windowMs: 10 * 60_000 },
  /** Staff sign-in: strict, because each attempt can send an email and guesses a shared secret. */
  staff: { name: "staff", limit: 6, windowMs: 10 * 60_000 },
} satisfies Record<string, Limit>;

/** Wraps a route handler with rate limiting and uniform error handling. */
export async function handle<T>(request: Request, limit: Limit, fn: () => Promise<T>): Promise<NextResponse> {
  const locale = localeFromCookieHeader(request.headers.get("cookie"));
  const result = rateLimit(`${limit.name}:${clientKey(request)}`, limit.limit, limit.windowMs);
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: translateError("Too many requests. Please wait a moment and try again.", locale) } },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
    );
  }
  try {
    const body = await fn();
    return body instanceof NextResponse ? body : NextResponse.json(body);
  } catch (error) {
    return errorResponse(error, locale);
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON", 400, "INVALID_JSON");
  }
}
