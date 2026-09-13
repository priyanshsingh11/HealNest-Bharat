import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken, type SessionClaims } from "@/lib/session-token";

const SECRET = "test-session-secret";
const NOW = Date.parse("2026-09-13T06:00:00Z");
const claims: SessionClaims = { role: "user", userId: "user_c123456789ab", providerId: null, exp: NOW + 60_000 };

describe("session tokens", () => {
  it("round-trips the claims it signed", () => {
    expect(verifySessionToken(signSessionToken(claims, SECRET), SECRET, NOW)).toEqual(claims);
  });

  it("rejects edited claims, so nobody can make themselves an admin", () => {
    const [, signature] = signSessionToken(claims, SECRET).split(".");
    const promoted = Buffer.from(JSON.stringify({ ...claims, role: "admin" })).toString("base64url");
    expect(verifySessionToken(`${promoted}.${signature}`, SECRET, NOW)).toBeNull();
  });

  it("rejects another secret, an expired token and junk", () => {
    const token = signSessionToken(claims, SECRET);
    expect(verifySessionToken(token, "some-other-secret", NOW)).toBeNull();
    expect(verifySessionToken(token, SECRET, claims.exp + 1)).toBeNull();
    for (const junk of [undefined, "", "admin", "a.b", "a.b.c", `${token}.extra`]) {
      expect(verifySessionToken(junk, SECRET, NOW)).toBeNull();
    }
  });
});
