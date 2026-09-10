import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canActorTransition,
  canTransition,
  HAPPY_PATH,
  InvalidTransitionError,
  isCancellable,
  isTerminal,
  nextHappyStatus,
} from "@/lib/booking-status";

describe("booking state machine", () => {
  it("allows the full happy path in order", () => {
    for (let i = 0; i < HAPPY_PATH.length - 1; i++) {
      expect(canTransition(HAPPY_PATH[i], HAPPY_PATH[i + 1])).toBe(true);
    }
  });

  it("allows decline only from REQUESTED", () => {
    expect(canTransition("REQUESTED", "DECLINED")).toBe(true);
    expect(canTransition("ACCEPTED", "DECLINED")).toBe(false);
  });

  it("allows cancellation only from REQUESTED or ACCEPTED", () => {
    expect(isCancellable("REQUESTED")).toBe(true);
    expect(isCancellable("ACCEPTED")).toBe(true);
    expect(isCancellable("ON_THE_WAY")).toBe(false);
    expect(isCancellable("COMPLETED")).toBe(false);
  });

  it("rejects skipping steps and moving backwards", () => {
    expect(canTransition("REQUESTED", "COMPLETED")).toBe(false);
    expect(canTransition("ARRIVED", "ACCEPTED")).toBe(false);
  });

  it("treats COMPLETED, DECLINED and CANCELLED as terminal", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("DECLINED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("REQUESTED")).toBe(false);
  });

  it("restricts actors: customers can only cancel, providers run the visit", () => {
    expect(canActorTransition("REQUESTED", "CANCELLED", "user")).toBe(true);
    expect(canActorTransition("REQUESTED", "ACCEPTED", "user")).toBe(false);
    expect(canActorTransition("REQUESTED", "ACCEPTED", "provider")).toBe(true);
    expect(canActorTransition("IN_PROGRESS", "COMPLETED", "provider")).toBe(true);
  });

  it("assertTransition throws a typed error on invalid moves", () => {
    expect(() => assertTransition("COMPLETED", "CANCELLED", "admin")).toThrow(InvalidTransitionError);
    expect(() => assertTransition("REQUESTED", "ACCEPTED", "provider")).not.toThrow();
  });

  it("nextHappyStatus walks the path and stops at the end", () => {
    expect(nextHappyStatus("REQUESTED")).toBe("ACCEPTED");
    expect(nextHappyStatus("IN_PROGRESS")).toBe("COMPLETED");
    expect(nextHappyStatus("COMPLETED")).toBeNull();
    expect(nextHappyStatus("CANCELLED")).toBeNull();
  });
});
