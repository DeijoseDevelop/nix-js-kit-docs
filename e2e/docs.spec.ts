import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (/Failed to load resource: the server responded with a status of (4\d\d)/.test(text)) return;
    errors.push(text);
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  (page as unknown as { __errors?: string[] }).__errors = errors;
});

test.afterEach(async ({ page }) => {
  const errors = (page as unknown as { __errors?: string[] }).__errors ?? [];
  expect(errors, `console/page errors: ${errors.join(" | ")}`).toEqual([]);
});

test("docs home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1, main h1").first()).toBeVisible();
  await expect(page.locator("main").first()).toBeVisible();
});

test("a docs page renders its content", async ({ page }) => {
  await page.goto("/docs/getting-started/introduction");
  await expect(page.locator("main h1").first()).toBeVisible();
  await expect(page.locator("main article, main .prose, main").first()).toBeVisible();
  // Breadcrumb / title present.
  await expect(page.locator("body")).toContainText(/Nix\.js Kit|Getting Started/i);
});

test("islands hydrate (ThemeToggle, MobileDrawer, Search)", async ({ page }) => {
  await page.goto("/docs/getting-started/introduction");
  await page.waitForTimeout(1000);
  const hydrated = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-nix-js-island]")).filter(
      (el) => (el as HTMLElement).__nix_js_island_dispose,
    ).length,
  );
  expect(hydrated).toBeGreaterThanOrEqual(2);

  // ThemeToggle works: clicking toggles data-theme.
  const themeBtn = page.getByRole("button", { name: "Toggle theme" });
  await themeBtn.click();
  const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(theme).toBeTruthy();
});

test("sidebar navigation is present", async ({ page }) => {
  await page.goto("/docs/getting-started/introduction");
  await expect(page.locator("aside, .sidebar, nav").first()).toBeVisible();
  await expect(page.locator("a[href*='/docs/']").first()).toBeVisible();
});

test("404 page renders", async ({ page }) => {
  await page.goto("/ruta-que-no-existe");
  await expect(page.locator("h1").first()).toContainText(/404|Not Found/i);
});
