/**
 * Shared calculation types and functions for rollforward + PO engine.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Month = string; // "YYYY-MM"
export type Units = number;
export type Pallets = number;

export type StockStatus = "ok" | "low" | "critical" | "stockout";

export interface RollforwardEntry {
  month: Month;
  currentStock: Units;
  incomingPOUnits: Units;
  forecastUnits: Units;
  balance: Units;
  status: StockStatus;
}

export interface RollforwardResult {
  productId: number;
  productName: string;
  sku: string;
  packingPerPallet: number;
  currentStock: Units;
  exwPriceEur: number;
  entries: RollforwardEntry[];
}

export interface DashboardRow {
  productId: number;
  productName: string;
  sku: string;
  packingPerPallet: number;
  currentStock: Units;
  status8Months: StockStatus;
  criticalMonths: Month[];
  lowestBalance: Units;
  openPOUnits: Units;
}

export interface POSuggestion {
  productId: number;
  productName: string;
  sku: string;
  packingPerPallet: number;
  exwPriceEur: number;
  firstStockoutMonth: Month;
  shortfallUnits: Units;
  palletsNeeded: Pallets;
  containerConfig: 22 | 44 | "mixed";
  poValueEur: number;
  urgency: "critical" | "warning";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Status thresholds based on balance vs pallet packing. */
export function getStatus(balance: Units, packing: number): StockStatus {
  if (balance < 0) return "stockout";
  if (balance < packing * 1) return "critical";
  if (balance < packing * 3) return "low";
  return "ok";
}

/** Status badge color class names (Tailwind). */
export const statusColors: Record<StockStatus, string> = {
  ok: "bg-green-100 text-green-800",
  low: "bg-yellow-100 text-yellow-800",
  critical: "bg-orange-100 text-orange-800",
  stockout: "bg-red-100 text-red-800",
};

/** Status icon (emoji). */
export const statusIcon: Record<StockStatus, string> = {
  ok: "🟢",
  low: "🟡",
  critical: "🟠",
  stockout: "🔴",
};

/** Add months to a YYYY-MM string. */
export function addMonths(yearMonth: Month, count: number): Month {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + count, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Format month for display (YYYY-MM → "Apr 2026"). */
const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
export function formatMonth(yearMonth: Month): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** PO lead time in months. */
export const PO_LEAD_TIME_MONTHS = 5;

/** Compute the arrival month when ordering in `orderMonth`. */
export function getArrivalMonth(orderMonth: Month): Month {
  return addMonths(orderMonth, PO_LEAD_TIME_MONTHS);
}

// ---------------------------------------------------------------------------
// PO Suggestion Engine
// ---------------------------------------------------------------------------

/**
 * Given a rollforward result, calculate the PO suggestion.
 * Returns null if the product has no stockout in the 8-month horizon.
 */
export function suggestPO(
  rollforward: RollforwardResult,
  currentMonth: Month
): POSuggestion | null {
  const firstDeficit = rollforward.entries.find((e) => e.balance < 0);
  if (!firstDeficit) return null;

  const shortfallUnits = Math.abs(firstDeficit.balance);
  const palletsNeeded = Math.ceil(shortfallUnits / rollforward.packingPerPallet);

  let containerConfig: 22 | 44 | "mixed" = 22;
  if (palletsNeeded > 44) containerConfig = "mixed";
  else if (palletsNeeded > 22) containerConfig = 44;

  const poValueEur =
    palletsNeeded * rollforward.packingPerPallet * rollforward.exwPriceEur;

  const urgency: "critical" | "warning" =
    firstDeficit.month <= addMonths(currentMonth, 2) ? "critical" : "warning";

  return {
    productId: rollforward.productId,
    productName: rollforward.productName,
    sku: rollforward.sku,
    packingPerPallet: rollforward.packingPerPallet,
    exwPriceEur: rollforward.exwPriceEur,
    firstStockoutMonth: firstDeficit.month,
    shortfallUnits,
    palletsNeeded,
    containerConfig,
    poValueEur,
    urgency,
  };
}
