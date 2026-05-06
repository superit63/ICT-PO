import { expect, type APIResponse, type Page, type TestInfo } from "@playwright/test";

export const E2E_TEST_PIN = process.env["E2E_TEST_PIN"] ?? "123456";

export type AuthResult =
  | { ok: true }
  | { ok: false; reason: string };

export type ProductPayload = {
  name: string;
  sku: string;
  exw_price_eur: number;
  packing_per_pallet: number;
};

type ProductRecord = ProductPayload & { id: number };
type CustomerRecord = { id: number; name: string; region: string; notes: string | null };

export function uniqueTestSuffix(testInfo: TestInfo) {
  const titleSlug = testInfo.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  return `${Date.now()}-${testInfo.workerIndex}-${testInfo.retry}-${titleSlug}`;
}

export async function enterLoginPin(page: Page, pin: string) {
  for (let index = 0; index < pin.length; index += 1) {
    await page.getByLabel(`PIN digit ${index + 1}`).fill(pin[index]);
  }
}

export async function fillSetupPin(page: Page, pin: string, confirmPin = pin) {
  await page.getByLabel("New PIN").fill(pin);
  await page.getByLabel("Confirm PIN").fill(confirmPin);
}

export async function loginThroughUi(page: Page, pin = E2E_TEST_PIN) {
  await page.goto("/login");
  await enterLoginPin(page, pin);
  await expect(page).toHaveURL("/");
}

export async function logoutThroughUi(page: Page) {
  await page.getByRole("button", { name: /logout/i }).click();
  await expect(page).toHaveURL("/login");
}

export async function ensureKnownPinSession(page: Page, pin = E2E_TEST_PIN): Promise<AuthResult> {
  await page.goto("/");

  if (new URL(page.url()).pathname === "/") {
    return { ok: true };
  }

  if (new URL(page.url()).pathname === "/setup") {
    const setupResponse = await page.request.post("/api/auth/setup", { data: { pin } });
    if (setupResponse.ok()) {
      await page.goto("/");
      return { ok: true };
    }
    if (![409, 500].includes(setupResponse.status())) {
      return { ok: false, reason: `Setup failed: ${await responseSummary(setupResponse)}` };
    }
  }

  const verifyResponse = await page.request.post("/api/auth/verify", { data: { pin } });
  if (verifyResponse.ok()) {
    await page.goto("/");
    return { ok: true };
  }

  if (verifyResponse.status() === 401) {
    return {
      ok: false,
      reason: "Existing app PIN differs from E2E_TEST_PIN; no reset endpoint exists for isolated auth setup.",
    };
  }

  return { ok: false, reason: `Login failed: ${await responseSummary(verifyResponse)}` };
}

export async function createProductViaApi(page: Page, product: ProductPayload): Promise<ProductRecord> {
  const response = await page.request.post("/api/products", { data: product });
  expect(response.ok(), await responseSummary(response)).toBe(true);
  return response.json() as Promise<ProductRecord>;
}

export async function deleteProductsBySku(page: Page, sku: string) {
  try {
    const response = await page.request.get("/api/products", { timeout: 5_000 });
    if (!response.ok()) return;
    const products = (await response.json()) as ProductRecord[];
    await Promise.all(
      products
        .filter((product) => product.sku === sku)
        .map((product) => page.request.delete(`/api/products/${product.id}`, { timeout: 5_000 }))
    );
  } catch {
    // Best-effort cleanup; unique SKUs keep tests isolated if cleanup cannot complete.
  }
}

export async function deleteCustomersByName(page: Page, name: string) {
  try {
    const response = await page.request.get("/api/customers", { timeout: 5_000 });
    if (!response.ok()) return;
    const customers = (await response.json()) as CustomerRecord[];
    await Promise.all(
      customers
        .filter((customer) => customer.name === name)
        .map((customer) => page.request.delete(`/api/customers/${customer.id}`, { timeout: 5_000 }))
    );
  } catch {
    // Best-effort cleanup; unique names keep tests isolated if cleanup cannot complete.
  }
}

export function tableRowContaining(page: Page, text: string) {
  return page.locator("tbody tr").filter({ hasText: text }).first();
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).toBeVisible();
}

async function responseSummary(response: APIResponse) {
  const body = await response.json().catch(() => null);
  if (body && typeof body === "object" && "error" in body) {
    return `${response.status()} ${String(body.error)}`;
  }
  return `${response.status()} ${response.statusText()}`;
}
