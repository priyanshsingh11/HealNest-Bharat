import { handle, LIMITS } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { nextHappyStatus } from "@/lib/booking-status";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { conflict, forbidden, notFound } from "@/lib/errors";
import { canViewBooking, transitionBooking } from "@/lib/services/bookings";

type Context = { params: Promise<{ bookingId: string }> };

/** Demo only: advances the booking one step as if the provider did it. Logged as simulated in the audit trail. */
export async function POST(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    if (!demoToolsEnabled()) throw forbidden("Demo tools are disabled.");
    const { bookingId } = await params;
    const session = await getSession();
    const repo = getRepository();
    const booking = await repo.getBooking(bookingId);
    if (!booking || !canViewBooking(session, booking)) throw notFound("Booking");
    const next = nextHappyStatus(booking.status);
    if (!next) throw conflict("This booking has no further steps.");
    const updated = await transitionBooking(repo, bookingId, next, session, { simulateAs: "provider", note: "Simulated update (demo)" });
    return { booking: updated };
  });
}
