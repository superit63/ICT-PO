-- Sale-Stock-PO App — SQLite Schema
-- Target: Turso (libSQL-compatible)

-- App config (PIN hash, settings)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Products master list
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  exw_price_eur REAL NOT NULL DEFAULT 0,
  packing_per_pallet INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (date('now'))
);

-- Customers (hospitals)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'MB',
  notes TEXT,
  created_at TEXT DEFAULT (date('now'))
);

-- Monthly forecasts: one row per (customer × product × month)
CREATE TABLE IF NOT EXISTS forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  month TEXT NOT NULL,
  qty_units INTEGER NOT NULL DEFAULT 0,
  UNIQUE(customer_id, product_id, month)
);

-- Current physical stock with LOT/expiry
CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  lot_number TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  qty_units INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT (date('now'))
);

-- Purchase orders (header)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ordered',
  order_date TEXT NOT NULL,
  arrival_month TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (date('now'))
);

-- PO line items (product × pallets)
CREATE TABLE IF NOT EXISTS po_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty_pallets INTEGER NOT NULL DEFAULT 1
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_forecasts_product_month ON forecasts(product_id, month);
CREATE INDEX IF NOT EXISTS idx_forecasts_customer ON forecasts(customer_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_month ON forecasts(month);
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON po_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product ON po_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_arrival ON purchase_orders(arrival_month);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
