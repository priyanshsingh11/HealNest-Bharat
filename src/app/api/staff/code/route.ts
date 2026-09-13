import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { forbidden } from "@/lib/errors";
import { checkStaffPasscode, CHALLENGE_TTL_MS, isStaffEmail, issueChallenge, staffLoginConfigured } from "@/lib/staff";
import { STAFF_CHALLENGE_COOKIE } from "@/lib/staff-cookie";
import { sendStaffCode } from "@/lib/staff-otp";
import { staffCodeSchema } from "@/lib/validations";

/**
 * Step one of staff sign-in: check the passcode, then email a one-time code to a listed staff address.
 * The reply carries a signed challenge cookie that step two (POST /api/session, role "admin") must present,
 * so a code can only be spent for the address it was sent to, and only within a few minutes.
 */
export async function POST(request: Request) {
  return handle(request, LIMITS.staff, async () => {
    if (!staffLoginConfigured()) throw forbidden("Staff sign-in is not set up on this deployment.");
    const { passcode, email } = staffCodeSchema.parse(await readJson(request));
    // The passcode is checked first so a wrong one tells you nothing about which addresses are staff.
    if (!checkStaffPasscode(passcode)) throw forbidden("That passcode is not correct.");
    if (!isStaffEmail(email)) throw forbidden("That address is not on the staff list.");

    await sendStaffCode(email);
    const response = NextResponse.json({ sent: true, expiresInSeconds: CHALLENGE_TTL_MS / 1000 });
    response.cookies.set(STAFF_CHALLENGE_COOKIE, issueChallenge(email), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: CHALLENGE_TTL_MS / 1000,
    });
    return response;
  });
}
