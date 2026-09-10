import type { BookingStatus, Role } from "@/types";

/**
 * Explicit booking state machine:
 *   REQUESTED → ACCEPTED → ON_THE_WAY → ARRIVED → IN_PROGRESS → COMPLETED
 *   REQUESTED → DECLINED
 *   REQUESTED/ACCEPTED → CANCELLED
 */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ["ACCEPTED", "DECLINED", "CANCELLED"],
  ACCEPTED: ["ON_THE_WAY", "CANCELLED"],
  ON_THE_WAY: ["ARRIVED"],
  ARRIVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  DECLINED: [],
  CANCELLED: [],
};

/** Which roles may move a booking into a given status. */
const ALLOWED_ACTORS: Record<BookingStatus, Role[]> = {
  REQUESTED: [],
  ACCEPTED: ["provider", "admin"],
  DECLINED: ["provider", "admin"],
  ON_THE_WAY: ["provider", "admin"],
  ARRIVED: ["provider", "admin"],
  IN_PROGRESS: ["provider", "admin"],
  COMPLETED: ["provider", "admin"],
  CANCELLED: ["user", "provider", "admin"],
};

export const HAPPY_PATH: BookingStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "ON_THE_WAY",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  ON_THE_WAY: "On the way",
  ARRIVED: "Arrived",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}

export function canActorTransition(from: BookingStatus, to: BookingStatus, role: Role): boolean {
  return canTransition(from, to) && ALLOWED_ACTORS[to].includes(role);
}

export function isTerminal(status: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[status].length === 0;
}

export function isCancellable(status: BookingStatus): boolean {
  return canTransition(status, "CANCELLED");
}

/** Next step on the happy path, used by providers to advance a visit. */
export function nextHappyStatus(status: BookingStatus): BookingStatus | null {
  const index = HAPPY_PATH.indexOf(status);
  if (index < 0 || index === HAPPY_PATH.length - 1) return null;
  return HAPPY_PATH[index + 1];
}

export class InvalidTransitionError extends Error {
  constructor(from: BookingStatus, to: BookingStatus) {
    super(`Cannot move booking from ${from} to ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: BookingStatus, to: BookingStatus, role: Role): void {
  if (!canActorTransition(from, to, role)) throw new InvalidTransitionError(from, to);
}
