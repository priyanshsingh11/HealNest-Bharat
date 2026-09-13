import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { clearSessionCookies, setSessionCookies } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { deviceOwnsAccount } from "@/lib/devices";
import { forbidden, unprocessable } from "@/lib/errors";
import { buildSession } from "@/lib/session";
import { readChallenge, staffLoginConfigured } from "@/lib/staff";
import { STAFF_CHALLENGE_COOKIE } from "@/lib/staff-cookie";
import { checkStaffCode } from "@/lib/staff-otp";
import { sessionSchema } from "@/lib/validations";

/**
 * Log in.
 *
 *   customer / caretaker — needs the device secret issued when the account was created, so an account can
 *                          only be opened from a device it was registered on (src/lib/devices.ts).
 *   admin                — two steps: POST /api/staff/code checks ADMIN_PASSCODE and emails a one-time code to a
 *                          listed staff address; this route then takes that code plus the challenge cookie it set.
 *                          The passcode alone never signs anyone in.
 *
 * The same wording is used whether the account is unknown or the device is wrong, so this endpoint can't be
 * used to find out which accounts exist.
 */
const WRONG_DEVICE = "This account isn't registered on this device. Log in from the device you created it on, or create a new account.";

export async function POST(request: Request) {
  return handle(request, LIMITS.write, async () => {
    const input = sessionSchema.parse(await readJson(request));
    const repo = getRepository();

    if (input.role === "admin") {
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

    if (!demoToolsEnabled()) throw forbidden("Sign-in is turned off on this deployment.");

    if (input.role === "provider") {
      if (!input.providerId) throw unprocessable("Choose a caretaker profile.");
      const provider = await repo.getProvider(input.providerId);
      // The provider's own user row is what devices are registered against.
      if (!provider || !(await deviceOwnsAccount(repo, input.deviceToken, provider.userId))) throw forbidden(WRONG_DEVICE);
    }

    if (input.role === "user") {
      if (!input.userId) throw unprocessable("Choose a customer account.");
      const user = await repo.getUser(input.userId);
      if (!user || user.role !== "user" || !(await deviceOwnsAccount(repo, input.deviceToken, user.id))) {
        throw forbidden(WRONG_DEVICE);
      }
    }

    const session = buildSession(input.role, input.providerId, input.userId);
    return setSessionCookies(NextResponse.json({ session }), session);
  });
}

/** Log out: clears the session cookies. Always allowed. */
export async function DELETE(request: Request) {
  return handle(request, LIMITS.write, async () => clearSessionCookies(NextResponse.json({ ok: true })));
}
