/**
 * Auto-run migrations on Next.js app startup.
 * Import this in a Next.js API route or layout that always runs first.
 */
import { getDbClient } from "@/lib/db";

let initPromise: Promise<void> | null = null;
let hasInitialized = false;

// Inline schema to avoid ?raw import issues with TypeScript
const SCHEMA = `
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  exw_price_eur REAL NOT NULL DEFAULT 0,
  packing_per_pallet INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (date('now'))
);
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'MB',
  notes TEXT,
  created_at TEXT DEFAULT (date('now'))
);
CREATE TABLE IF NOT EXISTS forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  month TEXT NOT NULL,
  qty_units INTEGER NOT NULL DEFAULT 0,
  UNIQUE(customer_id, product_id, month)
);
CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  lot_number TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  qty_units INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT (date('now'))
);
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_id INTEGER REFERENCES stock(id) ON DELETE SET NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  lot_number TEXT,
  expiry_date TEXT,
  change_type TEXT NOT NULL,
  reason TEXT,
  qty_delta INTEGER NOT NULL DEFAULT 0,
  previous_qty INTEGER,
  next_qty INTEGER,
  reference_type TEXT,
  reference_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ordered',
  order_date TEXT NOT NULL,
  arrival_month TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (date('now'))
);
CREATE TABLE IF NOT EXISTS po_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty_pallets INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_forecasts_product_month ON forecasts(product_id, month);
CREATE INDEX IF NOT EXISTS idx_forecasts_customer ON forecasts(customer_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_month ON forecasts(month);
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_created ON stock_adjustments(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_stock ON stock_adjustments(stock_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON po_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product ON po_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_arrival ON purchase_orders(arrival_month);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
`.trim();

export async function initDb() {
  if (hasInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = getDbClient();
      const statements = SCHEMA.split(";").map((s: string) => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await db.execute({ sql: stmt });
      }
      hasInitialized = true;
      if (process.env.NEXT_PHASE !== "phase-production-build") {
        console.log("[initDb] Schema applied successfully");
      }
    } catch (err) {
      initPromise = null;
      console.error("[initDb] Migration failed:", err);
      throw err;
    }
  })();

  return initPromise;
}
