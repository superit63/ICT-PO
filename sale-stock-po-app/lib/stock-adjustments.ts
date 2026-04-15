import { executeSql } from "@/lib/db";

type StockAdjustmentInput = {
  stockId?: number | null;
  productId: number;
  lotNumber?: string | null;
  expiryDate?: string | null;
  changeType: "create" | "update" | "delete" | "receipt";
  reason?: string | null;
  qtyDelta: number;
  previousQty?: number | null;
  nextQty?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
};

export async function logStockAdjustment(input: StockAdjustmentInput) {
  await executeSql(
    `INSERT INTO stock_adjustments (
      stock_id, product_id, lot_number, expiry_date, change_type, reason,
      qty_delta, previous_qty, next_qty, reference_type, reference_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.stockId ?? null,
      input.productId,
      input.lotNumber ?? null,
      input.expiryDate ?? null,
      input.changeType,
      input.reason ?? null,
      input.qtyDelta,
      input.previousQty ?? null,
      input.nextQty ?? null,
      input.referenceType ?? null,
      input.referenceId ?? null,
    ]
  );
}
