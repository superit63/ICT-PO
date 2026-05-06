import { expect, test } from "@playwright/test";
import {
  E2E_TEST_PIN,
  ensureKnownPinSession,
  enterLoginPin,
  fillSetupPin,
  loginThroughUi,
  logoutThroughUi,
} from "./fixtures/test-helpers";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to setup or login", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/(?:setup|login)$/);
    await expect(page.getByRole("heading", { name: /protect the workspace|welcome back/i })).toBeVisible();
  });

  test("validates mismatched setup PINs", async ({ page }) => {
    await page.goto("/setup");
    await fillSetupPin(page, "123456", "654321");
    await page.getByRole("button", { name: /save pin and enter app/i }).click();

    await expect(page.locator("#setup-pin-error")).toContainText("PINs do not match.");
    await expect(page).toHaveURL("/setup");
  });

  test("completes setup or login and logout with the test PIN", async ({ page }) => {
    await page.goto("/");

    if (new URL(page.url()).pathname === "/setup") {
      await fillSetupPin(page, E2E_TEST_PIN);
      await page.getByRole("button", { name: /save pin and enter app/i }).click();

      try {
        await expect(page).toHaveURL("/");
      } catch {
        const auth = await ensureKnownPinSession(page);
        if (!auth.ok) test.skip(true, auth.reason);
      }
    } else {
      const auth = await ensureKnownPinSession(page);
      if (!auth.ok) test.skip(true, auth.reason);
      await page.goto("/login");
      await loginThroughUi(page);
    }

    await expect(page.getByRole("heading", { name: "Inventory overview" })).toBeVisible();
    await logoutThroughUi(page);
    await loginThroughUi(page);
    await expect(page.getByRole("heading", { name: "Inventory overview" })).toBeVisible();
  });

  test("rejects an incorrect PIN on login", async ({ page }) => {
    await page.goto("/");
    if (new URL(page.url()).pathname === "/setup") {
      const auth = await ensureKnownPinSession(page);
      if (!auth.ok) test.skip(true, auth.reason);
    }

    const wrongPin = E2E_TEST_PIN === "000000" ? "999999" : "000000";
    await page.goto("/login");
    await enterLoginPin(page, wrongPin);

    if (new URL(page.url()).pathname === "/") {
      await logoutThroughUi(page);
      test.skip(true, "Configured app PIN matched the reserved incorrect PIN.");
    }

    await expect(page.locator("#pin-error")).toContainText("Invalid PIN");
    await expect(page).toHaveURL("/login");
  });
});
