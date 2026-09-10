import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { InvalidTransitionError } from "@/lib/booking-status";
import { AppError } from "@/lib/errors";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export type ApiErrorBody = { error: { code: string; message: string; issues?: { path: string; message: string }[] } };

export function errorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message ?? "Invalid request",
          issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400 },
    );
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof InvalidTransitionError) {
    return NextResponse.json({ error: { code: "INVALID_TRANSITION", message: error.message } }, { status: 409 });
  }
  console.error("[api] unexpected error", error);
  return NextResponse.json({ error: { code: "INTERNAL", message: "Something went wrong. Please try again." } }, { status: 500 });
}

type Limit = { name: string; limit: number; windowMs: number };

export const LIMITS = {
  read: { name: "read", limit: 120, windowMs: 60_000 },
  write: { name: "write", limit: 30, windowMs: 60_000 },
} satisfies Record<string, Limit>;

/** Wraps a route handler with rate limiting and uniform error handling. */
export async function handle<T>(request: Request, limit: Limit, fn: () => Promise<T>): Promise<NextResponse> {
  const result = rateLimit(`${limit.name}:${clientKey(request)}`, limit.limit, limit.windowMs);
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment and try again." } },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
    );
  }
  try {
    const body = await fn();
    return body instanceof NextResponse ? body : NextResponse.json(body);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON", 400, "INVALID_JSON");
  }
}
