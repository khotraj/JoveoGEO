/**
 * Slice 2 — Connections page + OAuth flow tests
 *
 * STATUS: Placeholder — these run once Slice 2 is built.
 * Gate: All Slice 1 tests must pass before Slice 2 is merged.
 */
import { test, expect } from "@playwright/test";

test.describe("Slice 2 — Settings: Connections page", () => {
  test.skip("shows GSC and GA4 connection cards", async ({ page }) => {
    // Requires: authenticated session
    await page.goto("/settings/connections");
    await expect(page.locator("text=Google Search Console")).toBeVisible();
    await expect(page.locator("text=Google Analytics 4")).toBeVisible();
  });

  test.skip("GSC 'Connect' button redirects to Google OAuth", async ({ page }) => {
    await page.goto("/settings/connections");
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.click("button:has-text('Connect GSC')"),
    ]);
    await expect(popup.url()).toContain("accounts.google.com");
  });

  test.skip("connected status shows after OAuth callback", async ({ page }) => {
    // Simulated with a test token inserted by test fixture
    await page.goto("/settings/connections");
    await expect(page.locator("[data-testid=gsc-status]")).toHaveText("Connected");
    await expect(page.locator("[data-testid=gsc-last-sync]")).toBeVisible();
  });
});

test.describe("Slice 2 — Overview: KPI strip", () => {
  test.skip("renders 4 KPI tiles with real numbers", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-testid=kpi-organic-visits]")).toBeVisible();
    await expect(page.locator("[data-testid=kpi-ai-visibility]")).toBeVisible();
    await expect(page.locator("[data-testid=kpi-branded-split]")).toBeVisible();
    await expect(page.locator("[data-testid=kpi-paid-leak]")).toBeVisible();
  });

  test.skip("organic visits shows a positive integer", async ({ page }) => {
    await page.goto("/");
    const text = await page.locator("[data-testid=kpi-organic-visits]").textContent();
    expect(Number(text?.replace(/,/g, ""))).toBeGreaterThan(0);
  });
});

test.describe("Slice 2 — Traffic: Human lane", () => {
  test.skip("renders impressions, clicks, and position metrics", async ({ page }) => {
    await page.goto("/traffic");
    await expect(page.locator("[data-testid=lane-human]")).toBeVisible();
    await expect(page.locator("text=Impressions")).toBeVisible();
    await expect(page.locator("text=Clicks")).toBeVisible();
  });

  test.skip("Insights Band shows at least 1 card", async ({ page }) => {
    await page.goto("/traffic");
    await expect(page.locator("[data-testid=insights-band]")).toBeVisible();
    const cards = page.locator("[data-testid=insight-card]");
    await expect(cards).toHaveCount(3);
  });
});
