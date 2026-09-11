import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repository/memory";
import { createSeedData } from "@/lib/seed";
import { createDemoAccount } from "@/lib/services/accounts";
import { buildSession, GUEST_USER_ID, isGuest } from "@/lib/session";
import { accountCreateSchema } from "@/lib/validations";
import { createTestData } from "./fixtures";

const NOW = new Date("2026-09-11T06:00:00Z");
const newRepo = () => new MemoryRepository(createTestData(NOW));

const caretakerInput = {
  type: "caretaker",
  name: "Meera Pillai",
  email: "meera@example.com",
  phone: "9876543210",
  category: "nurse",
  gender: "female",
  localityId: "blr-hsr",
  languages: ["Malayalam", "English"],
  yearsExperience: 4,
};

describe("createDemoAccount", () => {
  it("creates a customer and logs into it", async () => {
    const repo = newRepo();
    const input = accountCreateSchema.parse({ type: "customer", name: "Isha Verma", email: " Isha@Example.com", phone: "+91 98765 43210" });
    const session = await createDemoAccount(repo, input, NOW);

    expect(session.role).toBe("user");
    expect(session.userId).not.toBe(GUEST_USER_ID);
    expect(await repo.getUser(session.userId)).toMatchObject({ name: "Isha Verma", email: "isha@example.com", role: "user" });
  });

  it("creates an unverified caretaker with starter services", async () => {
    const repo = newRepo();
    const lastNumber = Math.max(...(await repo.listProviders()).map((p) => Number(p.id.slice(5))));
    const session = await createDemoAccount(repo, accountCreateSchema.parse(caretakerInput), NOW);

    expect(session.role).toBe("provider");
    expect(session.providerId).toBe(`prov_${String(lastNumber + 1).padStart(2, "0")}`);
    const provider = await repo.getProvider(session.providerId!);
    expect(provider).toMatchObject({ userId: session.userId, category: "nurse", verificationStatus: "unverified" });
    expect(provider?.baseLocation).toMatchObject({ locality: "HSR Layout", city: "Bengaluru" });
    expect(await repo.getUser(session.userId)).toMatchObject({ role: "provider", email: "meera@example.com" });

    const services = await repo.listServices({ providerId: session.providerId! });
    expect(services.length).toBeGreaterThan(0);
    expect(services.every((s) => s.category === "nurse" && s.active)).toBe(true);
  });

  it("starts provider numbers at prov_01 in an empty store", async () => {
    const session = await createDemoAccount(new MemoryRepository(createSeedData(NOW)), accountCreateSchema.parse(caretakerInput), NOW);
    expect(session.providerId).toBe("prov_01");
  });

  it("gives each caretaker the next provider number", async () => {
    const repo = newRepo();
    const first = await createDemoAccount(repo, accountCreateSchema.parse(caretakerInput), NOW);
    const second = await createDemoAccount(repo, accountCreateSchema.parse({ ...caretakerInput, email: "other@example.com" }), NOW);
    expect(Number(second.providerId!.slice(5))).toBe(Number(first.providerId!.slice(5)) + 1);
  });

  it("rejects an email that already has an account", async () => {
    const input = accountCreateSchema.parse({ type: "customer", name: "Kavya", email: "Customer@example.test", phone: "+91 90000 00009" });
    await expect(createDemoAccount(newRepo(), input, NOW)).rejects.toThrow(/already exists/);
  });

  it("validates contact details", () => {
    expect(accountCreateSchema.safeParse({ type: "customer", name: "A", email: "nope", phone: "12345" }).error?.issues.map((i) => i.path[0])).toEqual([
      "name",
      "email",
      "phone",
    ]);
  });
});

describe("buildSession", () => {
  it("logs customers into their own account", () => {
    expect(buildSession("user", undefined, "user_cabc123").userId).toBe("user_cabc123");
  });

  it("never lets a provider login act as a customer", () => {
    expect(buildSession("user", undefined, "user_prov_01").userId).toBe(GUEST_USER_ID);
    expect(buildSession("user", undefined, "admin_demo").userId).toBe(GUEST_USER_ID);
  });

  it("treats a provider login without a profile id as a guest", () => {
    expect(buildSession("provider", undefined)).toEqual({ role: "user", userId: GUEST_USER_ID, providerId: null });
  });

  it("browses as a guest when nobody is logged in", () => {
    expect(isGuest(buildSession(undefined, undefined))).toBe(true);
  });
});
