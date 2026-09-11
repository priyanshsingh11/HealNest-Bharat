import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/booking-status";
import { ButtonLink } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { formatMoney, formatTimeRange } from "@/lib/formatters";
import { isGuest } from "@/lib/session";

export const metadata: Metadata = { title: "My bookings" };

export default async function BookingsPage() {
  const session = await getSession();
  if (isGuest(session)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My bookings</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">Log in to see your bookings</p>
          <ButtonLink href="/login?next=/bookings" className="mt-4">
            Log in
          </ButtonLink>
        </div>
      </div>
    );
  }

  const repo = getRepository();
  const bookings =
    session.role === "admin"
      ? await repo.listBookings()
      : session.role === "provider"
        ? await repo.listBookings({ providerId: session.providerId! })
        : await repo.listBookings({ userId: session.userId });

  // Customers are prompted to rate completed visits they haven't reviewed yet.
  const reviewed =
    session.role === "user"
      ? new Set(
          (
            await Promise.all(
              bookings.filter((b) => b.status === "COMPLETED").map(async (b) => ((await repo.getReviewForBooking(b.id)) ? b.id : null)),
            )
          ).filter(Boolean),
        )
      : new Set();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        {session.role === "user" ? "My bookings" : session.role === "provider" ? "Your visit requests" : "All bookings"}
      </h1>
      {bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">No bookings yet</p>
          <ButtonLink href="/discover" className="mt-4">
            Find care nearby
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {bookings.map((booking) => {
            const toRate = session.role === "user" && booking.status === "COMPLETED" && !reviewed.has(booking.id);
            return (
              <li key={booking.id}>
                <Link
                  href={toRate ? `/booking/${booking.id}#review` : `/booking/${booking.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-sm hover:border-brand-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-ink">{booking.serviceName}</p>
                    <p className="text-sm text-ink-muted">
                      {booking.providerName} · {formatTimeRange(booking.scheduledStart, booking.scheduledEnd)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <StatusBadge status={booking.status} />
                    {toRate && <span className="text-sm font-semibold text-brand-700">Rate your visit →</span>}
                    <span className="ml-auto font-bold tabular-nums sm:ml-0 sm:w-24 sm:text-right">{formatMoney(booking.totalAmountMinor)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
