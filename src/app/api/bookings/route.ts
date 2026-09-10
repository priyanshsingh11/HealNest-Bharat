import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { createBooking } from "@/lib/services/bookings";
import { bookingFormSchema } from "@/lib/validations";

/** GET — bookings visible to the current session (own bookings, provider's requests, or all for admin). */
export async function GET(request: Request) {
  return handle(request, LIMITS.read, async () => {
    const session = await getSession();
    const repo = getRepository();
    const bookings =
      session.role === "admin"
        ? await repo.listBookings()
        : session.role === "provider"
          ? await repo.listBookings({ providerId: session.providerId! })
          : await repo.listBookings({ userId: session.userId });
    return { bookings };
  });
}

/** POST — create a booking request. The server recalculates and snapshots the quote; client prices are ignored. */
export async function POST(request: Request) {
  return handle(request, LIMITS.write, async () => {
    const input = bookingFormSchema.parse(await readJson(request));
    const booking = await createBooking(getRepository(), input, await getSession());
    return NextResponse.json({ booking }, { status: 201 });
  });
}
