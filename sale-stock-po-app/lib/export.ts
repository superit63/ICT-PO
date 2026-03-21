/**
 * Export utilities — client-side Excel generation via xlsx.
 */

import * as XLSX from "xlsx";

/** Export a flat array of objects to an Excel file. */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1"
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ---------------------------------------------------------------------------
// Rollforward export
// ---------------------------------------------------------------------------

export interface RfEntry {
  month: string;
  currentStock: number;
  incomingPOUnits: number;
  forecastUnits: number;
  balance: number;
  status: string;
}

export interface RfResult {
  productId: number;
  productName: string;
  sku: string;
  packingPerPallet: number;
  exwPriceEur: number;
  entries: RfEntry[];
}

/** Export rollforward data to Excel. One sheet per product. */
export function exportRollforward(results: RfResult[], filename: string): void {
  const wb = XLSX.utils.book_new();

  for (const r of results) {
    const rows: Record<string, string | number>[] = [
      { Product: r.productName, SKU: r.sku, "Packing/pallet": r.packingPerPallet, "EXW (EUR)": r.exwPriceEur },
      {} as Record<string, string | number>,
      { Metric: "Stock", ...Object.fromEntries(r.entries.map((e) => [fmtMonth(e.month), e.currentStock])) },
      { Metric: "+ InPO", ...Object.fromEntries(r.entries.map((e) => [fmtMonth(e.month), e.incomingPOUnits])) },
      { Metric: "- Forecast", ...Object.fromEntries(r.entries.map((e) => [fmtMonth(e.month), e.forecastUnits])) },
      { Metric: "= Balance", ...Object.fromEntries(r.entries.map((e) => [fmtMonth(e.month), e.balance])) },
      { Metric: "Status", ...Object.fromEntries(r.entries.map((e) => [fmtMonth(e.month), e.status])) },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, r.productName.slice(0, 31));
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ---------------------------------------------------------------------------
// Forecast export
// ---------------------------------------------------------------------------

export interface ForecastRow {
  customerId: number;
  customerName: string;
  productId: number;
  productName: string;
  region: string;
  [month: string]: number | string;
}

/** Export forecast data to Excel. */
export function exportForecasts(rows: ForecastRow[], months: string[], filename: string): void {
  const header = [
    "Customer",
    "Product",
    "Region",
    ...months.map(fmtMonth),
    "Total",
  ];
  const data = rows.map((r) => {
    const rowTotal = months.reduce((s, m) => s + (Number(r[m]) || 0), 0);
    return [
      r.customerName,
      r.productName,
      r.region,
      ...months.map((m) => Number(r[m]) || 0),
      rowTotal,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  // Auto-width
  const colWidths = header.map((h, i) => ({
    wch: Math.max(h.length, ...data.map((r) => String(r[i] ?? "").length)) + 2,
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Forecasts");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}
