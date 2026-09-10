/** Error carrying an HTTP status and a safe, user-facing message. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
    public readonly code: string = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what: string) => new AppError(`${what} not found`, 404, "NOT_FOUND");
export const forbidden = (message = "You are not allowed to do that") => new AppError(message, 403, "FORBIDDEN");
export const conflict = (message: string) => new AppError(message, 409, "CONFLICT");
export const unprocessable = (message: string) => new AppError(message, 422, "UNPROCESSABLE");
