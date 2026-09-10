import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./src/tests",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Force the in-memory data source so the smoke test never touches a real database.
    command: `DATA_SOURCE=memory npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
