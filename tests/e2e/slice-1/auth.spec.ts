import { test, expect } from "@playwright/test";

const PROTECTED_ROUTES = ["/", "/traffic", "/visible/1", "/geo", "/recommendations", "/discover", "/settings/connections"];

test.describe("Slice 1 — Auth: unauthenticated routing", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} → redirects to /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Slice 1 — Auth: login page", () => {
  test("renders brand mark and form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Career Site Cockpit")).toBeVisible();
    await expect(page.locator("text=by Joveo")).toBeVisible();
    await expect(page.locator("input[type=email]")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toHaveText("Send magic link");
  });

  test("submit button is enabled by default", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("button[type=submit]")).toBeEnabled();
  });

  test("rejects non-@joveo.com email with inline error", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type=email]", "user@gmail.com");
    await page.click("button[type=submit]");
    await expect(page.locator("text=Only @joveo.com accounts")).toBeVisible();
    // Does NOT navigate away — stays on login
    await expect(page).toHaveURL(/\/login/);
  });

  test("rejects @joveo.com.evil.com subdomain spoof", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type=email]", "raj@joveo.com.evil.com");
    await page.click("button[type=submit]");
    await expect(page.locator("text=Only @joveo.com accounts")).toBeVisible();
  });

  test("?error=domain query param shows error banner", async ({ page }) => {
    await page.goto("/login?error=domain");
    await expect(page.locator("text=Only @joveo.com accounts")).toBeVisible();
  });
});
