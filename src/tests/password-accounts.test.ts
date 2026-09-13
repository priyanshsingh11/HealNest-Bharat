import { describe, expect, it } from "vitest";
import { MemoryPasswordAuth } from "@/lib/password-auth";
import { MemoryRepository } from "@/lib/repository/memory";
import { completePasswordReset, logIn, requestPasswordReset, signUp } from "@/lib/services/password-accounts";
import { accountCreateSchema, signUpSchema } from "@/lib/validations";
import { createTestData } from "./fixtures";

const NOW = new Date("2026-09-13T06:00:00Z");
const PASSWORD = "correct-horse-battery";

function setup() {
  return { repo: new MemoryRepository(createTestData(NOW)), auth: new MemoryPasswordAuth() };
}

const customer = (email = "isha@example.com") =>
  accountCreateSchema.parse({ type: "customer", name: "Isha Verma", email, phone: "+91 98765 43210" });

const caretaker = (email = "meera@example.com") =>
  accountCreateSchema.parse({
    type: "caretaker",
    name: "Meera Pillai",
    email,
    phone: "9876543210",
    category: "nurse",
    gender: "female",
    localityId: "blr-hsr",
    languages: ["Malayalam", "English"],
    yearsExperience: 4,
  });

describe("sign-up and log in", () => {
  it("signs up a customer and logs back in with the same email and password", async () => {
    const { repo, auth } = setup();
    const created = await signUp(repo, auth, customer(), PASSWORD, NOW);
    expect(created.role).toBe("user");

    // Email case and surrounding spaces don't matter for logging in.
    const session = await logIn(repo, auth, "Isha@Example.com", PASSWORD);
    expect(session).toEqual(created);
  });

  it("opens the caretaker dashboard session for a caretaker", async () => {
    const { repo, auth } = setup();
    const created = await signUp(repo, auth, caretaker(), PASSWORD, NOW);
    expect(created.role).toBe("provider");
    expect(await logIn(repo, auth, "meera@example.com", PASSWORD)).toEqual(created);
  });

  it("refuses a wrong password or an unknown email with the same message", async () => {
    const { repo, auth } = setup();
    await signUp(repo, auth, customer(), PASSWORD, NOW);

    await expect(logIn(repo, auth, "isha@example.com", "wrong-password")).rejects.toThrow("Email or password is incorrect.");
    await expect(logIn(repo, auth, "nobody@example.com", PASSWORD)).rejects.toThrow("Email or password is incorrect.");
  });

  it("won't create a second account for the same email", async () => {
    const { repo, auth } = setup();
    await signUp(repo, auth, customer(), PASSWORD, NOW);
    await expect(signUp(repo, auth, customer(), "another-password", NOW)).rejects.toThrow(/already exists/);
    // The original password still works.
    expect((await logIn(repo, auth, "isha@example.com", PASSWORD)).role).toBe("user");
  });

  it("doesn't leave a login behind when the account can't be created", async () => {
    const { repo, auth } = setup();
    const unknownPlace = { ...caretaker(), localityId: "nowhere" };
    await expect(signUp(repo, auth, unknownPlace, PASSWORD, NOW)).rejects.toThrow(/Choose where you are based/);

    // The email is still free: a corrected sign-up goes through.
    expect((await signUp(repo, auth, caretaker(), PASSWORD, NOW)).role).toBe("provider");
  });

  it("requires a password of at least 8 characters", () => {
    const base = { type: "customer", name: "Isha Verma", email: "isha@example.com", phone: "9876543210" };
    expect(signUpSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, password: PASSWORD }).success).toBe(true);
  });
});

describe("password reset", () => {
  it("sets a new password with the emailed code and logs in", async () => {
    const { repo, auth } = setup();
    const created = await signUp(repo, auth, customer(), PASSWORD, NOW);

    await requestPasswordReset(repo, auth, "isha@example.com");
    const code = auth.peekResetCode("isha@example.com")!;
    expect(code).toMatch(/^\d{8}$/);

    const session = await completePasswordReset(repo, auth, "isha@example.com", code, "a-brand-new-password");
    expect(session).toEqual(created);
    await expect(logIn(repo, auth, "isha@example.com", PASSWORD)).rejects.toThrow("Email or password is incorrect.");
    expect(await logIn(repo, auth, "isha@example.com", "a-brand-new-password")).toEqual(created);
  });

  it("rejects a wrong code, and a code can only be used once", async () => {
    const { repo, auth } = setup();
    await signUp(repo, auth, customer(), PASSWORD, NOW);
    await requestPasswordReset(repo, auth, "isha@example.com");
    const code = auth.peekResetCode("isha@example.com")!;
    const wrong = code === "00000000" ? "11111111" : "00000000";

    await expect(completePasswordReset(repo, auth, "isha@example.com", wrong, "a-brand-new-password")).rejects.toThrow(/wrong or has expired/);
    await completePasswordReset(repo, auth, "isha@example.com", code, "a-brand-new-password");
    await expect(completePasswordReset(repo, auth, "isha@example.com", code, "yet-another-password")).rejects.toThrow(/wrong or has expired/);
  });

  it("lets an account made before passwords existed set one", async () => {
    const { repo, auth } = setup();
    // An app account with no login, like those created by the old device-bound sign-up.
    await repo.createUser({ id: "user_clegacy01", name: "Old Account", email: "old@example.com", phone: "9876543210", role: "user", createdAt: NOW.toISOString() });
    await expect(logIn(repo, auth, "old@example.com", PASSWORD)).rejects.toThrow("Email or password is incorrect.");

    await requestPasswordReset(repo, auth, "old@example.com");
    const session = await completePasswordReset(repo, auth, "old@example.com", auth.peekResetCode("old@example.com")!, PASSWORD);
    expect(session?.userId).toBe("user_clegacy01");
    expect((await logIn(repo, auth, "old@example.com", PASSWORD)).userId).toBe("user_clegacy01");
  });

  it("sends nothing for an email with no account, without saying so", async () => {
    const { repo, auth } = setup();
    await expect(requestPasswordReset(repo, auth, "nobody@example.com")).resolves.toBeUndefined();
    expect(auth.peekResetCode("nobody@example.com")).toBeUndefined();
  });
});
