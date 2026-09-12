import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { clearSessionCookies, setSessionCookies } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { deviceOwnsAccount } from "@/lib/devices";
import { forbidden, notFound, unprocessable } from "@/lib/errors";
import { buildSession } from "@/lib/session";
import { checkStaffPasscode, staffLoginConfigured } from "@/lib/staff";
import { sessionSchema } from "@/lib/validations";

/**
 * Log in.
 *
 *   customer / caretaker — needs the device secret issued when the account was created, so an account can
 *                          only be opened from a device it was registered on (src/lib/devices.ts).
 *   admin                — needs ADMIN_PASSCODE. Reached only through /staff; nothing on the site links there.
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
      if (!staffLoginConfigured()) throw forbidden("Staff login is not set up on this deployment.");
      if (!checkStaffPasscode(input.passcode ?? "")) throw forbidden("That passcode is not correct.");
      const session = buildSession("admin", undefined);
      return setSessionCookies(NextResponse.json({ session }), session);
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
