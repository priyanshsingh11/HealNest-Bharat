import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { clearSessionCookies, setSessionCookies } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { forbidden } from "@/lib/errors";
import { getPasswordAuth } from "@/lib/password-auth";
import { logIn } from "@/lib/services/password-accounts";
import { buildSession } from "@/lib/session";
import { readChallenge, staffLoginConfigured } from "@/lib/staff";
import { STAFF_CHALLENGE_COOKIE } from "@/lib/staff-cookie";
import { checkStaffCode } from "@/lib/staff-otp";
import { loginSchema, staffSessionSchema } from "@/lib/validations";

/**
 * Log in.
 *
 *   customer / caretaker — `{ email, password }`. Which dashboard opens follows from the account.
 *   staff                — `{ role: "admin", email, code }`, two steps: POST /api/staff/code checks ADMIN_PASSCODE and
 *                          emails a one-time code to a listed staff address; this route then takes that code plus the
 *                          challenge cookie it set. The passcode alone never signs anyone in.
 */
export async function POST(request: Request) {
  return handle(request, LIMITS.auth, async () => {
    const body = await readJson(request);

    if ((body as { role?: unknown } | null)?.role === "admin") {
      const input = staffSessionSchema.parse(body);
      if (!staffLoginConfigured()) throw forbidden("Staff sign-in is not set up on this deployment.");
      // The challenge proves the passcode was accepted, for this address, within the last few minutes.
      const challengedEmail = readChallenge((await cookies()).get(STAFF_CHALLENGE_COOKIE)?.value);
      if (!challengedEmail) throw forbidden("That sign-in has expired. Start again with your passcode.");
      const email = (input.email ?? "").trim().toLowerCase();
      if (email !== challengedEmail) throw forbidden("That sign-in has expired. Start again with your passcode.");
      if (!(await checkStaffCode(email, input.code ?? ""))) throw forbidden("That code is not correct, or it has expired.");

      const session = buildSession("admin", undefined);
      const response = setSessionCookies(NextResponse.json({ session }), session);
      response.cookies.delete(STAFF_CHALLENGE_COOKIE);
      return response;
    }

    const { email, password } = loginSchema.parse(body);
    const repo = getRepository();
    const session = await logIn(repo, getPasswordAuth(repo.kind), email, password);
    return setSessionCookies(NextResponse.json({ session }), session);
  });
}

/** Log out: clears the session cookie. Always allowed. */
export async function DELETE(request: Request) {
  return handle(request, LIMITS.write, async () => clearSessionCookies(NextResponse.json({ ok: true })));
}
