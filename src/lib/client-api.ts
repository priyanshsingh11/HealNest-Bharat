// Tiny fetch wrapper for client components. Throws an Error with the server's user-facing message.

import { localeFromCookieHeader } from "@/lib/i18n/config";
import { translateError } from "@/lib/i18n/errors";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly issues: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiRequest<T>(url: string, method: "GET" | "POST" | "PATCH" | "DELETE" = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    const locale = localeFromCookieHeader(typeof document === "undefined" ? null : document.cookie);
    throw new ApiRequestError(translateError("Network error — check your connection and try again.", locale), 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error;
    // The server already translates its messages; only the fallback is written here.
    const message = error?.message ?? translateError(`Request failed (${response.status})`, localeFromCookieHeader(document.cookie));
    throw new ApiRequestError(message, response.status, error?.issues ?? []);
  }
  return data as T;
}
