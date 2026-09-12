import { beforeEach, describe, expect, it } from "vitest";
import { deviceOwnsAccount, describeDevice, DEVICE_TOKEN_PATTERN, hashDeviceToken, registerDevice } from "@/lib/devices";
import { MemoryRepository } from "@/lib/repository/memory";
import { createDemoAccount } from "@/lib/services/accounts";
import { checkStaffPasscode, staffLoginConfigured } from "@/lib/staff";
import { accountCreateSchema } from "@/lib/validations";
import { createTestData } from "./fixtures";

const NOW = new Date("2026-09-12T06:00:00Z");
const newRepo = () => new MemoryRepository(createTestData(NOW));
const MAC_CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

const customer = (email: string) => accountCreateSchema.parse({ type: "customer", name: "Isha Verma", email, phone: "+91 98765 43210" });

describe("device tokens", () => {
  it("issues a secret that only matches the account it was registered for", async () => {
    const repo = newRepo();
    const mine = await createDemoAccount(repo, customer("isha@example.com"), NOW);
    const theirs = await createDemoAccount(repo, customer("other@example.com"), NOW);

    const token = await registerDevice(repo, mine.userId, MAC_CHROME, NOW);

    expect(token).toMatch(DEVICE_TOKEN_PATTERN);
    expect(await deviceOwnsAccount(repo, token, mine.userId)).toBe(true);
    // The same secret must not open anyone else's account.
    expect(await deviceOwnsAccount(repo, token, theirs.userId)).toBe(false);
  });

  it("rejects a missing, forged or malformed secret", async () => {
    const repo = newRepo();
    const { userId } = await createDemoAccount(repo, customer("isha@example.com"), NOW);
    await registerDevice(repo, userId, MAC_CHROME, NOW);

    for (const attempt of [undefined, "", "x".repeat(43), "too-short", "!".repeat(43), userId]) {
      expect(await deviceOwnsAccount(repo, attempt, userId)).toBe(false);
    }
  });

  it("stores only a hash of the secret, never the secret itself", async () => {
    const repo = newRepo();
    const { userId } = await createDemoAccount(repo, customer("isha@example.com"), NOW);
    const token = await registerDevice(repo, userId, MAC_CHROME, NOW);

    const [device] = await repo.listDevices(userId);
    expect(device.tokenHash).toBe(hashDeviceToken(token));
    expect(device.tokenHash).not.toContain(token);
    expect(device.label).toBe("Mac · Chrome");
  });

  it("issues a separate secret per device, and both keep working", async () => {
    const repo = newRepo();
    const { userId } = await createDemoAccount(repo, customer("isha@example.com"), NOW);
    const mac = await registerDevice(repo, userId, MAC_CHROME, NOW);
    const phone = await registerDevice(repo, userId, "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile Safari/604.1", NOW);

    expect(phone).not.toBe(mac);
    expect(await deviceOwnsAccount(repo, mac, userId)).toBe(true);
    expect(await deviceOwnsAccount(repo, phone, userId)).toBe(true);
    expect((await repo.listDevices(userId)).map((d) => d.label)).toContain("iPhone/iPad · Safari");
  });

  it("names common devices and copes with a missing user agent", () => {
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/141.0 Safari/537.36 Edg/141.0")).toBe("Windows · Edge");
    expect(describeDevice("Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0")).toBe("Linux · Firefox");
    expect(describeDevice(null)).toBe("Unknown device");
  });
});

describe("staff passcode", () => {
  beforeEach(() => {
    delete process.env.ADMIN_PASSCODE;
  });

  it("is switched off entirely when unset or too short to be worth anything", () => {
    expect(staffLoginConfigured()).toBe(false);
    expect(checkStaffPasscode("")).toBe(false);

    process.env.ADMIN_PASSCODE = "short";
    expect(staffLoginConfigured()).toBe(false);
    // Even the right value fails while the passcode is too weak to be used.
    expect(checkStaffPasscode("short")).toBe(false);
  });

  it("accepts only the configured passcode", () => {
    process.env.ADMIN_PASSCODE = "a-long-enough-passcode";
    expect(staffLoginConfigured()).toBe(true);
    expect(checkStaffPasscode("a-long-enough-passcode")).toBe(true);
    expect(checkStaffPasscode("a-long-enough-passcod")).toBe(false);
    expect(checkStaffPasscode("")).toBe(false);
  });
});
