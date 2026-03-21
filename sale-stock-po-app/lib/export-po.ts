/**
 * Excel export utilities for PO Suggestion and PO List pages.
 * Uses xlsx (SheetJS) loaded dynamically on the client side.
 */

type POSuggestion = {
  productId: number;
  productName: string;
  sku: string;
  packingPerPallet: number;
  exwPriceEur: number;
  firstStockoutMonth: string;
  shortfallUnits: number;
  palletsNeeded: number;
  containerConfig: 22 | 44 | "mixed";
  poValueEur: number;
  urgency: "critical" | "warning";
};

type POListRow = {
  po_number: string;
  status: string;
  order_date: string;
  arrival_month: string;
  items_summary: string;
  total_pallets: number;
  po_value_eur: number;
};

function monthLabel(ym: string): string {
  const names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [, m, y] = ym.match(/(\d{4})-(\d{2})/)?.slice(1) ?? [];
  return `${names[parseInt(m ?? "1")]} ${y ?? ""}`;
}

function containerLabel(config: 22 | 44 | "mixed"): string {
  if (config === "mixed") return "Mixed (multiple containers)";
  return `${config} pallets`;
}

/** Export PO suggestions to .xlsx */
export function exportPOSuggestions(data: POSuggestion[], filename: string): void {
  // Dynamically import xlsx to avoid SSR issues
  import("xlsx").then((XLSX) => {
    const rows = data.map((s) => ({
      "Product": s.productName,
      "SKU": s.sku,
      "First Stockout": monthLabel(s.firstStockoutMonth),
      "Shortfall (units)": s.shortfallUnits,
      "Pallets Needed": s.palletsNeeded,
      "Container": containerLabel(s.containerConfig),
      "PO Value (€)": s.poValueEur,
      "Urgency": s.urgency === "critical" ? "CRITICAL — Order Now" : "Warning — Plan Soon",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto column widths
    const colWidths = [
      { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
      { wch: 14 }, { wch: 26 }, { wch: 14 }, { wch: 28 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PO Suggestions");
    XLSX.writeFile(wb, filename);
  });
}

/** Export PO list to .xlsx */
export function exportPOList(data: POListRow[], filename: string): void {
  import("xlsx").then((XLSX) => {
    const rows = data.map((po) => ({
      "PO#": po.po_number,
      "Status": po.status,
      "Order Date": po.order_date,
      "Arrival Month": po.arrival_month,
      "Items": po.items_summary,
      "Total Pallets": po.total_pallets,
      "PO Value (€)": po.po_value_eur,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = [
      { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
      { wch: 50 }, { wch: 14 }, { wch: 14 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Orders");
    XLSX.writeFile(wb, filename);
  });
}
