// Tiny fetch wrapper for client components. Throws an Error with the server's user-facing message.

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

export async function apiRequest<T>(url: string, method: "GET" | "POST" | "PATCH" = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError("Network error — check your connection and try again.", 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error;
    throw new ApiRequestError(error?.message ?? `Request failed (${response.status})`, response.status, error?.issues ?? []);
  }
  return data as T;
}
