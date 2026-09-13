import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
/** Staff passcode for the test server — step one of staff sign-in. */
export const STAFF_PASSCODE = "test-staff-passcode";
/** The only address the test server will email a sign-in code to. */
export const STAFF_EMAIL = "staff@healnest.test";

export default defineConfig({
  testDir: "./src/tests",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  // Every test shares one in-memory server, so parallel workers would race for the same slots.
  workers: 1,
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
    // Production build + in-memory data source, so the smoke test never touches a real database
    // and doesn't clash with a `next dev` server already running in this folder.
    // Staff sign-in needs all three settings before it will run at all. The Supabase values are deliberately
    // unreachable: the suite checks the passcode and staff-list gates, and never that a real code is emailed.
    command:
      `npm run build && DATA_SOURCE=memory ADMIN_PASSCODE=${STAFF_PASSCODE} ADMIN_EMAILS=${STAFF_EMAIL} ` +
      `SUPABASE_ANON_KEY=test-anon-key SUPABASE_URL=https://unreachable.supabase.test npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
