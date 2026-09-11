import { chromium } from "@playwright/test";
const browser = await chromium.launch();
for (const [name, url] of [["live", "https://heal-nest-bharat.vercel.app/"], ["local", "http://localhost:3000/"]]) {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator("#hero-heading").evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().bottom + window.scrollY));
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/private/tmp/claude-501/-Users-priyanshsingh-Desktop-HealNest-Bharat/6af36674-b6e9-448d-9480-2aed0baa35e3/scratchpad/" + name + "-stats.png" });
  await page.close();
}
await browser.close();
