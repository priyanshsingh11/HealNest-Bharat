import { expect, test, type Page } from "@playwright/test";

// End-to-end smoke test: location → category → provider → booking → confirmation.
// Runs against the in-memory data source (see playwright.config.ts).

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    // Map tiles come from OpenStreetMap; ignore network failures for them in offline CI.
    if (message.type() === "error" && !message.location().url.includes("openstreetmap")) errors.push(message.text());
  });
  return errors;
}

test("customer books a home nurse from the homepage", async ({ page, isMobile }) => {
  const errors = collectConsoleErrors(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Trusted care, at your doorstep/ })).toBeVisible();
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
  await page.goto("/providers/prov_03");
  await expect(page.getByRole("heading", { level: 1, name: "Dr. Kavita Suri" })).toBeVisible();
  await expect(page.getByText("Medical service", { exact: true }).first()).toBeVisible();
});

test("provider and admin dashboard demo routes load", async ({ page }) => {
  await page.goto("/dashboard/provider");
  await expect(page.getByRole("heading", { name: "Provider dashboard" })).toBeVisible();
  await page.getByRole("button", { name: "Open provider dashboard" }).click();
  await expect(page.getByRole("heading", { name: /Incoming requests/ })).toBeVisible();

  await page.goto("/dashboard/admin");
  await page.getByRole("button", { name: "Continue as admin" }).click();
  await expect(page.getByRole("heading", { name: "Provider verification" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pricing rules & platform margin" })).toBeVisible();

  // Reset to the customer role so other tests start from the default session.
  await page.context().clearCookies();
});
