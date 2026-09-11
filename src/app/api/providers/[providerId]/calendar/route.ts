import { NextResponse } from "next/server";
import { handle, LIMITS } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { appointmentsCalendar } from "@/lib/ics";
import { assertProviderOwns } from "@/lib/services/admin";

type Context = { params: Promise<{ providerId: string }> };

const CLOSED = new Set(["CANCELLED", "DECLINED"]);

/** GET — the provider's upcoming appointments as an .ics file, with a reminder 30 minutes before each. */
export async function GET(request: Request, { params }: Context) {
  return handle(request, LIMITS.read, async () => {
    const { providerId } = await params;
    assertProviderOwns(await getSession(), providerId);
    const repo = getRepository();
    const provider = await repo.getProvider(providerId);
    if (!provider) throw notFound("Provider");

    const now = new Date();
    const since = now.getTime() - 24 * 3600 * 1000;
    const bookings = (await repo.listBookings({ providerId })).filter(
      (b) => !CLOSED.has(b.status) && Date.parse(b.scheduledEnd) >= since,
    );
    const body = appointmentsCalendar(bookings, {
      calendarName: `HealNest — ${provider.name}`,
      baseUrl: new URL(request.url).origin,
      now,
    });
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="healnest-appointments.ics"',
        "Cache-Control": "no-store",
      },
    });
  });
}
