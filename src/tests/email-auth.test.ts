import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/repository/memory";
import { checkNewAccount, createDemoAccount, isAuthPlaceholder } from "@/lib/services/accounts";
import { completeEmailSignIn, findAccountByEmail } from "@/lib/services/email-auth";
import { accountCreateSchema } from "@/lib/validations";
import type { Role } from "@/types";
import { createTestData } from "./fixtures";

const NOW = new Date("2026-09-11T06:00:00Z");
const newRepo = () => new MemoryRepository(createTestData(NOW));

const AUTH_ID = "3f8e2c1a-9b7d-4e6f-8a5c-1d2e3f4a5b6c";
const PLACEHOLDER_ID = `user_${AUTH_ID.replace(/-/g, "")}`;

const customerSignup = accountCreateSchema.parse({ type: "customer", name: "Isha Verma", email: "isha@example.com", phone: "9876543210" });

/** What the database's sign-up trigger inserts when Supabase creates the Auth account. */
function addPlaceholder(repo: MemoryRepository, email: string, role: Role = "user") {
  return repo.createUser({ id: PLACEHOLDER_ID, name: email.split("@")[0], email, phone: "", role, createdAt: NOW.toISOString() });
}

describe("completeEmailSignIn", () => {
  it("creates the account from the sign-up and removes the trigger's placeholder row", async () => {
    const repo = newRepo();
    await addPlaceholder(repo, "isha@example.com");
    await expect(checkNewAccount(repo, customerSignup)).resolves.toBeUndefined();

    const session = await completeEmailSignIn(repo, { id: AUTH_ID, email: "isha@example.com" }, customerSignup, NOW);

    expect(session.role).toBe("user");
    expect(await repo.getUser(session.userId)).toMatchObject({ name: "Isha Verma", phone: "9876543210", role: "user" });
    expect(await repo.getUser(PLACEHOLDER_ID)).toBeNull();
    expect((await findAccountByEmail(repo, "isha@example.com"))?.id).toBe(session.userId);
  });

  it("logs into the account that already owns the email", async () => {
    const repo = newRepo();
    const created = await createDemoAccount(repo, customerSignup, NOW);

    const session = await completeEmailSignIn(repo, { id: AUTH_ID, email: "Isha@Example.com" });

    expect(session).toEqual(created);
    await expect(checkNewAccount(repo, customerSignup)).rejects.toMatchObject({ status: 409 });
  });

  it("opens the caretaker's own profile", async () => {
    const repo = newRepo();
    const caretaker = accountCreateSchema.parse({
      type: "caretaker",
      name: "Meera Pillai",
      email: "meera@example.com",
      phone: "9876543210",
      category: "nurse",
      gender: "female",
      localityId: "blr-hsr",
      languages: ["Malayalam"],
      yearsExperience: 4,
    });
    const created = await createDemoAccount(repo, caretaker, NOW);

    const session = await completeEmailSignIn(repo, { id: AUTH_ID, email: "meera@example.com" });

    expect(session).toMatchObject({ role: "provider", providerId: created.providerId });
  });

  it("refuses an email with no account when nothing is being signed up", async () => {
    const repo = newRepo();
    await addPlaceholder(repo, "nobody@example.com");

    await expect(completeEmailSignIn(repo, { id: AUTH_ID, email: "nobody@example.com" })).rejects.toMatchObject({ status: 404 });
  });

  it("treats an admin promoted with SQL as a real account", async () => {
    const repo = newRepo();
    const admin = await addPlaceholder(repo, "staff@example.com", "admin");
    expect(isAuthPlaceholder(admin)).toBe(false);

    const session = await completeEmailSignIn(repo, { id: AUTH_ID, email: "staff@example.com" });

    expect(session.role).toBe("admin");
    expect(await repo.getUser(PLACEHOLDER_ID)).not.toBeNull();
  });
});
