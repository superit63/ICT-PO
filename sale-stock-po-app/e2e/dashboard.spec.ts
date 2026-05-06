import { expect, test } from "@playwright/test";
import {
  createProductViaApi,
  deleteProductsBySku,
  ensureKnownPinSession,
  uniqueTestSuffix,
} from "./fixtures/test-helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    const auth = await ensureKnownPinSession(page);
    if (!auth.ok) test.skip(true, auth.reason);
  });

  test("renders the protected inventory overview and status sections", async ({ page }, testInfo) => {
    const suffix = uniqueTestSuffix(testInfo);
    const sku = `E2E-DASH-${suffix}`;

    await deleteProductsBySku(page, sku);
    await createProductViaApi(page, {
      name: `E2E Dashboard Product ${suffix}`,
      sku,
      exw_price_eur: 12.34,
      packing_per_pallet: 100,
    });

    try {
      await page.goto("/");

      await expect(page.getByRole("heading", { name: "Inventory overview" })).toBeVisible();
      await expect(page.getByText("Operational summary")).toBeVisible();
      await expect(page.getByText("Planning month")).toBeVisible();
      await expect(page.getByText("At-risk SKUs")).toBeVisible();
      await expect(page.getByText("Open PO value")).toBeVisible();
      await expect(page.getByText("Inventory detail")).toBeVisible();
      await expect(page.locator("tbody tr").filter({ hasText: sku })).toBeVisible();
    } finally {
      await deleteProductsBySku(page, sku);
    }
  });

  test("exposes primary navigation from the protected layout", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "Master Data" })).toHaveAttribute("href", "/master-data");

    await page.getByRole("link", { name: "Master Data" }).click();
    await expect(page).toHaveURL("/master-data");
    await expect(page.getByRole("heading", { name: "Master Data" })).toBeVisible();

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Inventory overview" })).toBeVisible();
  });
});
