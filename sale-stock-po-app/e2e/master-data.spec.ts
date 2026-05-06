import { expect, test } from "@playwright/test";
import {
  deleteCustomersByName,
  deleteProductsBySku,
  ensureKnownPinSession,
  expectToast,
  tableRowContaining,
  uniqueTestSuffix,
} from "./fixtures/test-helpers";

test.describe("Master data", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    const auth = await ensureKnownPinSession(page);
    if (!auth.ok) test.skip(true, auth.reason);
    await page.goto("/master-data");
    await expect(page.getByRole("heading", { name: "Master Data" })).toBeVisible();
  });

  test("creates, edits, rejects duplicate SKU, and deletes a product", async ({ page }, testInfo) => {
    const suffix = uniqueTestSuffix(testInfo);
    const sku = `E2E-PROD-${suffix}`;
    const productName = `E2E Product ${suffix}`;
    const updatedProductName = `${productName} Updated`;

    await deleteProductsBySku(page, sku);

    try {
      await page.getByLabel("Product name").fill(productName);
      await page.getByLabel("SKU").fill(sku);
      await page.getByLabel("EXW price (EUR)").fill("15.5");
      await page.getByLabel("Units per pallet").fill("120");
      await page.getByRole("button", { name: "Add product" }).click();

      await expectToast(page, "Product added");
      await page.getByPlaceholder("Search product or SKU").fill(sku);
      await expect(tableRowContaining(page, sku)).toBeVisible();

      await page.getByLabel("Product name").fill(productName);
      await page.getByLabel("SKU").fill(sku);
      await page.getByRole("button", { name: "Add product" }).click();
      await expectToast(page, "SKU already exists");

      await tableRowContaining(page, sku).getByRole("button", { name: "Edit" }).click();
      const dialog = page.getByRole("dialog", { name: "Edit Product" });
      await expect(dialog).toBeVisible();
      await dialog.locator("input").first().fill(updatedProductName);
      await dialog.getByRole("button", { name: "Save changes" }).click();
      await expectToast(page, "Product updated");
      await expect(tableRowContaining(page, updatedProductName)).toBeVisible();

      await tableRowContaining(page, sku).locator("button").last().click();
      await expectToast(page, `Deleted ${updatedProductName}`);
      await expect(tableRowContaining(page, sku)).toBeHidden();
    } finally {
      await deleteProductsBySku(page, sku);
    }
  });

  test("creates, edits, validates, and deletes a customer", async ({ page }, testInfo) => {
    const suffix = uniqueTestSuffix(testInfo);
    const customerName = `E2E Customer ${suffix}`;
    const updatedCustomerName = `${customerName} Updated`;

    await deleteCustomersByName(page, customerName);
    await deleteCustomersByName(page, updatedCustomerName);

    try {
      await page.getByRole("tab", { name: "Customers" }).click();
      await expect(page.getByText("Customer List")).toBeVisible();

      await page.getByRole("button", { name: "Add customer" }).click();
      await expect(page.getByLabel("Customer name")).toBeFocused();
      await expect(
        page.getByLabel("Customer name").evaluate((element) => (element as HTMLInputElement).validity.valueMissing)
      ).resolves.toBe(true);

      await page.getByLabel("Customer name").fill(customerName);
      await page.getByLabel("Region").fill("MB");
      await page.getByLabel("Notes").fill("E2E planning customer");
      await page.getByRole("button", { name: "Add customer" }).click();

      await expectToast(page, "Customer added");
      await page.getByRole("tab", { name: "Customers" }).click();
      await expect(page.getByText("Customer List")).toBeVisible();
      await page.getByPlaceholder("Search customers").fill(customerName);
      await expect(tableRowContaining(page, customerName)).toBeVisible();

      await tableRowContaining(page, customerName).getByRole("button", { name: "Edit" }).click();
      const dialog = page.getByRole("dialog", { name: "Edit Customer" });
      await expect(dialog).toBeVisible();
      await dialog.locator("input").nth(0).fill(updatedCustomerName);
      await dialog.locator("input").nth(2).fill("Updated by E2E");
      await dialog.getByRole("button", { name: "Save changes" }).click();
      await expectToast(page, "Customer updated");
      await page.getByRole("tab", { name: "Customers" }).click();
      await expect(page.getByText("Customer List")).toBeVisible();
      await expect(tableRowContaining(page, updatedCustomerName)).toBeVisible();

      await tableRowContaining(page, updatedCustomerName).locator("button").last().click();
      await expectToast(page, `Deleted ${updatedCustomerName}`);
      await expect(tableRowContaining(page, updatedCustomerName)).toBeHidden();
    } finally {
      await deleteCustomersByName(page, customerName);
      await deleteCustomersByName(page, updatedCustomerName);
    }
  });

  test("shows product and customer import/export controls", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Export sheet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Import sheet" })).toBeVisible();

    await page.getByRole("tab", { name: "Customers" }).click();

    await expect(page.getByRole("button", { name: "Export sheet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Import sheet" })).toBeVisible();
  });
});
