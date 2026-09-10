import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { canViewBooking, transitionBooking } from "@/lib/services/bookings";
import { bookingStatusUpdateSchema } from "@/lib/validations";

type Context = { params: Promise<{ bookingId: string }> };

export async function GET(request: Request, { params }: Context) {
  return handle(request, LIMITS.read, async () => {
    const { bookingId } = await params;
    const booking = await getRepository().getBooking(bookingId);
    if (!booking || !canViewBooking(await getSession(), booking)) throw notFound("Booking");
    return { booking };
  });
}

/** PATCH { status } — move the booking through the state machine (cancel, accept, decline, progress). */
export async function PATCH(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { bookingId } = await params;
    const { status, note } = bookingStatusUpdateSchema.parse(await readJson(request));
    const booking = await transitionBooking(getRepository(), bookingId, status, await getSession(), { note });
    return { booking };
  });
}
