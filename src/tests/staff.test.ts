import { beforeEach, describe, expect, it } from "vitest";
import {
  CHALLENGE_TTL_MS,
  checkStaffPasscode,
  isStaffEmail,
  issueChallenge,
  passcodeConfigured,
  readChallenge,
  staffLoginConfigured,
  staffLoginSetupGaps,
} from "@/lib/staff";

const NOW = new Date("2026-09-12T06:00:00Z");

describe("staff passcode", () => {
  beforeEach(() => {
    delete process.env.ADMIN_PASSCODE;
  });

  it("is switched off entirely when unset or too short to be worth anything", () => {
    expect(passcodeConfigured()).toBe(false);
    expect(checkStaffPasscode("")).toBe(false);

    process.env.ADMIN_PASSCODE = "short";
    expect(passcodeConfigured()).toBe(false);
    // Even the right value fails while the passcode is too weak to be used.
    expect(checkStaffPasscode("short")).toBe(false);
  });

  it("accepts only the configured passcode", () => {
    process.env.ADMIN_PASSCODE = "a-long-enough-passcode";
    expect(passcodeConfigured()).toBe(true);
    expect(checkStaffPasscode("a-long-enough-passcode")).toBe(true);
    expect(checkStaffPasscode("a-long-enough-passcod")).toBe(false);
    expect(checkStaffPasscode("")).toBe(false);
  });
});

describe("staff sign-in setup", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSCODE = "a-long-enough-passcode";
    process.env.ADMIN_EMAILS = "Ops@healnestbharat.com, second@healnestbharat.com";
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
  });

  it("needs the passcode, the address list and Supabase email together — never the passcode alone", () => {
    expect(staffLoginConfigured()).toBe(true);
    expect(staffLoginSetupGaps()).toEqual([]);

    delete process.env.SUPABASE_ANON_KEY;
    expect(staffLoginConfigured()).toBe(false);
    expect(staffLoginSetupGaps()).toEqual(["SUPABASE_URL and SUPABASE_ANON_KEY"]);

    process.env.SUPABASE_ANON_KEY = "anon-key";
    delete process.env.ADMIN_EMAILS;
    expect(staffLoginConfigured()).toBe(false);
    expect(staffLoginSetupGaps()).toEqual(["ADMIN_EMAILS"]);
  });

  it("matches staff addresses case-insensitively and ignores everyone else", () => {
    expect(isStaffEmail("ops@healnestbharat.com")).toBe(true);
    expect(isStaffEmail("  OPS@healnestbharat.com ")).toBe(true);
    expect(isStaffEmail("second@healnestbharat.com")).toBe(true);
    expect(isStaffEmail("someone@example.com")).toBe(false);
    expect(isStaffEmail("")).toBe(false);
  });
});

describe("staff sign-in challenge", () => {
  const NOW_MS = NOW.getTime();

  beforeEach(() => {
    process.env.ADMIN_PASSCODE = "a-long-enough-passcode";
    process.env.ADMIN_EMAILS = "ops@healnestbharat.com";
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
  });

  it("round-trips the address it was issued for", () => {
    const token = issueChallenge("Ops@healnestbharat.com", NOW_MS);
    expect(readChallenge(token, NOW_MS)).toBe("ops@healnestbharat.com");
  });

  it("expires, and refuses anything tampered with or signed under another passcode", () => {
    const token = issueChallenge("ops@healnestbharat.com", NOW_MS);
    expect(readChallenge(token, NOW_MS + CHALLENGE_TTL_MS + 1)).toBeNull();
    expect(readChallenge(undefined, NOW_MS)).toBeNull();
    expect(readChallenge("not.a.challenge", NOW_MS)).toBeNull();

    // Swapping the address in a valid token breaks the signature.
    const [, expiresAt, signature] = token.split(".");
    const forged = `${Buffer.from("attacker@example.com").toString("base64url")}.${expiresAt}.${signature}`;
    expect(readChallenge(forged, NOW_MS)).toBeNull();

    // Changing the passcode invalidates every challenge signed under the old one.
    process.env.ADMIN_PASSCODE = "a-different-long-passcode";
    expect(readChallenge(token, NOW_MS)).toBeNull();
  });

  it("stops honouring a challenge once the address leaves the staff list", () => {
    const token = issueChallenge("ops@healnestbharat.com", NOW_MS);
    process.env.ADMIN_EMAILS = "someone-else@healnestbharat.com";
    expect(readChallenge(token, NOW_MS)).toBeNull();
  });
});
