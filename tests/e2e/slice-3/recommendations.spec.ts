/**
 * Slice 3 — Recommendations Inbox + Visible-for tests
 *
 * STATUS: Placeholder — these run once Slice 3 is built.
 * Gate: All Slice 2 tests must pass before Slice 3 is merged.
 */
import { test, expect } from "@playwright/test";

test.describe("Slice 3 — Recommendations Inbox", () => {
  test.skip("renders recommendation rows with wave badges", async ({ page }) => {
    await page.goto("/recommendations");
    await expect(page.locator("[data-testid=rec-list]")).toBeVisible();
    await expect(page.locator("[data-testid=wave-badge]").first()).toBeVisible();
  });

  test.skip("wave chip filter works", async ({ page }) => {
    await page.goto("/recommendations");
    await page.click("[data-testid=filter-wave-1]");
    const badges = await page.locator("[data-testid=wave-badge]").allTextContents();
    expect(badges.every((b) => b.includes("1"))).toBe(true);
  });

  test.skip("clicking a rec opens fix detail", async ({ page }) => {
    await page.goto("/recommendations");
    await page.locator("[data-testid=rec-row]").first().click();
    await expect(page).toHaveURL(/\/recommendations\/.+/);
    await expect(page.locator("[data-testid=fix-steps]")).toBeVisible();
  });
});

test.describe("Slice 3 — Visible-for: Wave tower", () => {
  test.skip("Wave 1 tower renders 6 blocks", async ({ page }) => {
    await page.goto("/visible/1");
    const blocks = page.locator("[data-testid=wave-block]");
    await expect(blocks).toHaveCount(6);
  });

  test.skip("Wave tabs switch content", async ({ page }) => {
    await page.goto("/visible/1");
    await page.click("[data-testid=wave-tab-2]");
    await expect(page).toHaveURL("/visible/2");
  });

  test.skip("Issues drawer shows Banfield issues", async ({ page }) => {
    await page.goto("/visible/1");
    await page.click("[data-testid=issues-drawer-toggle]");
    await expect(page.locator("text=client-side rendering")).toBeVisible();
  });
});
