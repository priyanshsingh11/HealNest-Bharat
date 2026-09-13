import { expect, test, type APIResponse, type Page } from "@playwright/test";
import { STAFF_EMAIL, STAFF_PASSCODE } from "../../playwright.config";

// End-to-end smoke test: location → category → provider → booking → confirmation.
// Runs against the in-memory data source (see playwright.config.ts), which starts with no providers, so the suite first
// signs up a nurse, opens her availability and has the admin verify her — all through the public API.

const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";
/** `token` is the device secret sign-up issued for this nurse; logging in as her requires presenting it. */
let nurse: { id: string; name: string; token: string };

/** IST calendar date, `days` from today. */
function istDate(days: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(Date.now() + days * 24 * 3600 * 1000));
}

/** An admin session is just the role cookie; see src/lib/session.ts. */
const ADMIN_COOKIE = {
  name: "hn_role",
  value: "admin",
  domain: "localhost",
  path: "/",
  expires: -1,
  httpOnly: true,
  secure: false,
  sameSite: "Lax",
} as const;
const ADMIN_STATE = { cookies: [ADMIN_COOKIE], origins: [] };

async function json(response: APIResponse) {
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}

test.beforeAll(async ({ playwright }, testInfo) => {
  const api = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
  const name = "Test Nurse";
  const email = `nurse-${Date.now()}@example.test`;
  const phone = "9876543210";

  const { session, account } = await json(
    await api.post("/api/accounts", {
      data: { type: "caretaker", name, email, phone, category: "nurse", gender: "female", localityId: "del-cp", languages: ["Hindi", "English"], yearsExperience: 6 },
    }),
  );
  const providerId: string = session.providerId;

  await json(await api.post(`/api/providers/${providerId}/slots`, { data: { dates: [istDate(1), istDate(2)], startTime: "10:00", durationMinutes: 120 } }));

  const { application } = await json(
    await api.post(`/api/providers/${providerId}/verification`, {
      data: {
        fullName: name,
        phone,
        email,
        addressText: "House 4, Barakhamba Road, Connaught Place",
        city: "New Delhi",
        languages: ["Hindi", "English"],
        yearsExperience: 6,
        govtIdType: "aadhaar",
        govtIdLast4: "1234",
        photoUrl: PHOTO,
        registrationNumber: "DNC-12345",
        registrationCouncil: "Delhi Nursing Council",
        qualifications: [{ degree: "B.Sc Nursing", institution: "Test College of Nursing", year: 2018 }],
        employments: [
          {
            organisation: "City Hospital, Connaught Place",
            role: "Staff nurse, ICU",
            city: "New Delhi",
            current: true,
            startYear: 2020,
            endYear: null,
            contactName: "Matron Sunita Rao",
            contactPhone: "+91 98100 55667",
          },
        ],
        policeVerificationRef: "",
        documents: ["photo_id", "degree", "registration"].map((kind) => ({ kind, fileName: `${kind}.pdf`, sizeBytes: 1000, contentType: "application/pdf" })),
        confirmAccurate: true,
      },
    }),
  );

  // Staff sign-in needs a code emailed by Supabase, which this server can't do; the admin session cookie is
  // set directly instead. The sign-in gate itself is covered by its own test below.
  const admin = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL, storageState: ADMIN_STATE });
  await json(await admin.patch(`/api/admin/verification/${application.id}`, { data: { decision: "approve" } }));
  await admin.dispose();
  await api.dispose();
  nurse = { id: providerId, name, token: account.token };
});

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    // Map SDK/tiles come from Mappls or OpenStreetMap; ignore network failures for them in offline CI.
    if (message.type() === "error" && !/openstreetmap|mappls/.test(message.location().url)) errors.push(message.text());
  });
  return errors;
}

test("customer books a home nurse from the homepage", async ({ page, isMobile }) => {
  const errors = collectConsoleErrors(page);

  // Booking needs a customer account. The demo sign-up logs this browser into a fresh one.
  await json(
    await page.request.post("/api/accounts", {
      data: { type: "customer", name: "Test Customer", email: `customer-${Date.now()}@example.test`, phone: "9876543210" },
    }),
  );

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Trusted Care at Your Doorstep/i })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Emergency notice" })).toBeVisible();

  // 1. Location
  await page.getByRole("combobox", { name: "Where do you need care?" }).fill("Connaught");
  await page.getByRole("option", { name: /Connaught Place/ }).click();

  // 2. Category
  await page.getByTestId("category-nurse").click();
  await expect(page).toHaveURL(/\/discover\?.*category=nurse/);

  // 3. Provider cards show distance, availability and price
  const firstCard = page.getByTestId("provider-card").first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard).toContainText("away");
  await expect(firstCard).toContainText("Next:");
  await expect(firstCard.getByTestId("starting-price")).toContainText("₹");
  await firstCard.getByRole("link").first().click();

  // 4. Provider profile
  await expect(page).toHaveURL(/\/providers\/prov_/);
  await expect(page.getByRole("heading", { name: "Credentials & verification" })).toBeVisible();
  await page.getByTestId("request-visit").click();
  await expect(page).toHaveURL(/\/booking\/new\?/);

  const confirm = page.getByTestId(isMobile ? "confirm-booking-mobile" : "confirm-booking");

  // 5. Validation blocks an incomplete request
  await confirm.click();
  await expect(page.getByText("Choose a date and time window")).toBeVisible();
  await expect(page.getByText("You must agree to share the visit address with this provider")).toBeVisible();

  // 6. Complete the form
  await page.locator("label:has([data-testid=slot-option])").first().click();
  await page.getByLabel("Full address").fill("Flat 4B, Barakhamba Road, Connaught Place");
  await page.getByLabel(/I agree to share this visit address/).check();
  await page.getByLabel(/I have reviewed the itemised price/).check();

  // Every cost component is a separate row.
  const quote = page.getByTestId("quote-breakdown");
  await expect(quote.getByTestId("quote-line-visit")).toBeVisible();
  await expect(quote.getByTestId("quote-line-travel")).toBeVisible();
  await expect(quote.getByTestId("quote-line-platform_fee")).toBeVisible();
  await expect(quote.getByTestId("quote-line-tax")).toBeVisible();

  await confirm.click();

  // 7. Confirmation with price snapshot and status
  await expect(page).toHaveURL(/\/booking\/bk_/);
  await expect(page.getByTestId("booking-confirmation")).toBeVisible();
  await expect(page.getByTestId("booking-status")).toContainText("Requested");
  await expect(page.getByText("Price snapshot recorded")).toBeVisible();
  await expect(page.getByTestId("quote-total")).toContainText("₹");

  expect(errors).toEqual([]);
});

test("provider profile opens directly by URL", async ({ page }) => {
  await page.goto(`/providers/${nurse.id}`);
  await expect(page.getByRole("heading", { level: 1, name: nurse.name })).toBeVisible();
  await expect(page.getByText("Medical service", { exact: true }).first()).toBeVisible();
});

test("a caretaker dashboard needs this device's account", async ({ page }) => {
  // No account registered in this browser: the dashboard offers nothing to open.
  await page.goto("/dashboard/provider");
  await expect(page.getByRole("heading", { name: "Provider dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open provider dashboard" })).toHaveCount(0);

  // The device secret from sign-up is what opens it.
  await page.request.post("/api/session", { data: { role: "provider", providerId: nurse.id, deviceToken: nurse.token } });
  await page.goto("/dashboard/provider");
  await expect(page.getByRole("heading", { name: /Incoming requests/ })).toBeVisible();

  await page.context().clearCookies();
});

test("logging in as another account needs that account's device secret", async ({ page }) => {
  // A well-formed secret that was never issued for this account, and the account id on its own, both fail.
  const forged = "x".repeat(43);
  for (const data of [
    { role: "provider", providerId: nurse.id, deviceToken: forged },
    { role: "provider", providerId: nurse.id },
  ]) {
    const response = await page.request.post("/api/session", { data });
    expect(response.status()).toBe(403);
  }

  await page.goto("/dashboard/provider");
  await expect(page.getByRole("heading", { name: "Provider dashboard" })).toBeVisible();
  await page.context().clearCookies();
});

test("the login page never lists accounts", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("No customer account on this device")).toBeVisible();
  await expect(page.getByText(nurse.name)).toHaveCount(0);

  // The radio itself is sr-only, so click its card, the way a sighted user does.
  await page.locator("label:has([data-testid=login-as-caretaker])").click();
  await expect(page.getByText("No caretaker account on this device")).toBeVisible();
  await expect(page.getByText(nurse.name)).toHaveCount(0);
});

test("staff sign-in needs the passcode and a listed staff address", async ({ page }) => {
  // The dashboard itself hands out no way in.
  await page.goto("/dashboard/admin");
  await expect(page.getByRole("heading", { name: "Provider verification" })).toHaveCount(0);

  // The login page carries the staff entry, closed until asked for.
  await page.goto("/login");
  await expect(page.getByLabel("Staff passcode")).toHaveCount(0);
  await page.getByTestId("staff-sign-in-toggle").click();

  await page.getByLabel("Staff email").fill(STAFF_EMAIL);
  await page.getByLabel("Staff passcode").fill("wrong-passcode");
  await page.getByRole("button", { name: "Send sign-in code" }).click();
  // Not getByRole("alert"): Next's route announcer is one too.
  await expect(page.getByText("That passcode is not correct.")).toBeVisible();

  // Right passcode, but an address that isn't staff: no code is sent.
  await page.getByLabel("Staff email").fill("someone@example.com");
  await page.getByLabel("Staff passcode").fill(STAFF_PASSCODE);
  await page.getByRole("button", { name: "Send sign-in code" }).click();
  await expect(page.getByText("That address is not on the staff list.")).toBeVisible();

  // Both gates passed, so it tries to email a code — this server has no reachable Supabase to send it.
  await page.getByLabel("Staff email").fill(STAFF_EMAIL);
  await page.getByRole("button", { name: "Send sign-in code" }).click();
  await expect(page.getByText(/Could not send the sign-in code/)).toBeVisible();

  // The passcode alone never opens a session, however it is presented.
  const refused = await page.request.post("/api/session", { data: { role: "admin", passcode: STAFF_PASSCODE } });
  expect(refused.status()).toBe(403);
  await page.goto("/dashboard/admin");
  await expect(page.getByRole("heading", { name: "Provider verification" })).toHaveCount(0);
});

test("the admin dashboard renders for an admin session", async ({ page, context }) => {
  await context.addCookies([ADMIN_COOKIE]);
  await page.goto("/dashboard/admin");
  await expect(page.getByRole("heading", { name: "Provider verification" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pricing rules & platform margin" })).toBeVisible();

  // Log out so other tests start as a guest.
  await context.clearCookies();
});

test("provider dashboard pages load", async ({ page }) => {
  await page.request.post("/api/session", { data: { role: "provider", providerId: nurse.id, deviceToken: nurse.token } });

  await page.goto("/dashboard/provider");
  await expect(page.getByRole("heading", { name: "Today's patient queue" })).toBeVisible();

  await page.goto("/dashboard/provider/calendar");
  await expect(page.getByRole("link", { name: /Download calendar/ })).toBeVisible();

  await page.goto("/dashboard/provider/schedule");
  await expect(page.getByRole("heading", { name: "Add availability" })).toBeVisible();

  await page.goto("/dashboard/provider/verification");
  await expect(page.getByTestId("verification-form")).toBeVisible();

  const calendar = await page.request.get(`/api/providers/${nurse.id}/calendar`);
  expect(calendar.headers()["content-type"]).toContain("text/calendar");

  await page.context().clearCookies();
});
