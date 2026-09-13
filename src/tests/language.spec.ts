import { expect, test } from "@playwright/test";

// The header's English / Hindi switch: the choice re-renders the page in Hindi, survives a reload, and switches back.

test("switches the site between English and Hindi", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
  await expect(page.getByTestId("login-link")).toHaveText("Log in");
  await expect(page.getByTestId("language-en")).toHaveAttribute("aria-pressed", "true");

  await page.getByTestId("language-hi").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi-IN");
  await expect(page.getByTestId("login-link")).toHaveText("लॉग इन");
  await expect(page.getByTestId("language-hi")).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.getByTestId("login-link")).toHaveText("लॉग इन");

  await page.goto("/services");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi-IN");

  await page.getByTestId("language-en").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
  await expect(page.getByTestId("login-link")).toHaveText("Log in");
});
