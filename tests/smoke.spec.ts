import { test, expect } from "@playwright/test";

// Smoke test: all top-level pages render without errors (unauthenticated → login redirect)
const TOP_LEVEL_ROUTES = ["/", "/traffic", "/visible/1", "/geo", "/recommendations", "/discover"];

test.describe("Unauthenticated routing", () => {
  for (const route of TOP_LEVEL_ROUTES) {
    test(`${route} redirects to /login when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
      // Login page renders
      await expect(page.locator("text=Sign in")).toBeVisible();
    });
  }
});

test("Login page renders correctly", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("text=Career Site Cockpit")).toBeVisible();
  await expect(page.locator("input[type=email]")).toBeVisible();
  await expect(page.locator("button[type=submit]")).toBeVisible();
});

test("Login rejects non-@joveo.com email", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[type=email]", "user@gmail.com");
  await page.click("button[type=submit]");
  await expect(page.locator("text=Only @joveo.com accounts")).toBeVisible();
});
