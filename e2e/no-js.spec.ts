import { test, expect } from "@playwright/test";

// No-JS fallback: SSG/SSR content renders without JavaScript.
test.use({ javaScriptEnabled: false });

test("docs home renders without JS", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main").first()).toBeVisible();
});

test("a docs page renders without JS", async ({ page }) => {
  await page.goto("/docs/getting-started/introduction");
  await expect(page.locator("main h1").first()).toBeVisible();
});
