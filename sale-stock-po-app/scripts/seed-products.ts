/**
 * Seed ~25 Exeol pharmaceutical products into the database.
 * Run: npx tsx scripts/seed-products.ts
 * Requires TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in .env or environment.
 */
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Exeol product catalog (representative sample)
const PRODUCTS = [
  { name: "Exeol OPA 5L",            sku: "EXEOPA005L",   exw: 15.21, packing: 96  },
  { name: "Exeol OPA 1L",            sku: "EXEOPA001L",   exw: 4.80,  packing: 288 },
  { name: "Exeol GTA 2% 5L",         sku: "EXEGTA2%5L",   exw: 12.50, packing: 96  },
  { name: "Exeol GTA 2% 1L",         sku: "EXEGTA2%1L",   exw: 4.10,  packing: 288 },
  { name: "Exeol Surf 30 1L",        sku: "EXESURF301L",  exw: 3.90,  packing: 288 },
  { name: "Exeol Surf 30 5L",        sku: "EXESURF305L",  exw: 14.80, packing: 96  },
  { name: "Exeol Endo San 5L",       sku: "EXEENDO005L",  exw: 18.20, packing: 96  },
  { name: "Exeol Endo San 1L",       sku: "EXEENDO001L",  exw: 5.60,  packing: 288 },
  { name: "Exeol Instrument Spray 500mL", sku: "EXEINSPR500", exw: 6.20, packing: 120 },
  { name: "Exeol Clean & Disinfect 5L",   sku: "EXECLN005L",  exw: 11.40, packing: 96  },
  { name: "Exeol Clean & Disinfect 1L",   sku: "EXECLN001L",  exw: 3.70,  packing: 288 },
  { name: "Exeol HF Disinfectant 5L",     sku: "EXEHFD005L",  exw: 19.30, packing: 96  },
  { name: "Exeol HF Disinfectant 1L",     sku: "EXEHFD001L",  exw: 5.90,  packing: 288 },
  { name: "Exeol Surface Wipes 100pcs",   sku: "EXESRFWP100", exw: 8.50,  packing: 60  },
  { name: "Exeol Surface Wipes 200pcs",  sku: "EXESRFWP200", exw: 14.20, packing: 60  },
  { name: "Exeol Hand Sanitizer 500mL",   sku: "EXEHAND500",  exw: 4.30,  packing: 120 },
  { name: "Exeol Hand Sanitizer 1L",      sku: "EXEHAND001L",  exw: 7.20,  packing: 72  },
  { name: "Exeol Oxygen Plus 5L",         sku: "EXEOXY005L",  exw: 22.10, packing: 96  },
  { name: "Exeol Oxygen Plus 1L",         sku: "EXEOXY001L",  exw: 6.80,  packing: 288 },
  { name: "Exeol Sterilizing Fluid 5L",   sku: "EXEStFL005L", exw: 16.50, packing: 96  },
  { name: "Exeol Sterilizing Fluid 1L",   sku: "EXEStFL001L", exw: 5.10,  packing: 288 },
  { name: "Exeol Alco Clean 5L",          sku: "EXEALC005L",  exw: 9.80,  packing: 96  },
  { name: "Exeol Alco Clean 1L",          sku: "EXEALC001L",  exw: 3.20,  packing: 288 },
  { name: "Exeol Lab Disinfectant 5L",     sku: "EXELAB005L",  exw: 24.60, packing: 96  },
  { name: "Exeol Lab Disinfectant 1L",     sku: "EXELAB001L",  exw: 7.40,  packing: 288 },
];

const CUSTOMERS = [
  { name: "Bệnh viện An Bình",         region: "MB" },
  { name: "Bệnh viện Chợ Rẫy",         region: "MB" },
  { name: "Bệnh viện Bạch Mai",          region: "MB" },
  { name: "Bệnh viện Việt Đức",          region: "MB" },
  { name: "Bệnh viện 108",               region: "MB" },
  { name: "Bệnh viện Đa khoa Trung ương", region: "MN" },
  { name: "Bệnh viện Hữu nghị",          region: "MN" },
  { name: "Bệnh viện Quân y 103",        region: "MN" },
  { name: "Bệnh viện Nhi Trung ương",    region: "MN" },
  { name: "Bệnh viện Chợ Rẫy Miền Trung", region: "MN-South" },
];

async function main() {
  console.log("Seeding database...");

  // Run schema (inline to avoid ?raw TS issue)
  const SCHEMA = `
    CREATE TABLE IF NOT EXISTS app_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sku TEXT UNIQUE NOT NULL, exw_price_eur REAL NOT NULL DEFAULT 0, packing_per_pallet INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT (date('now')));
    CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, region TEXT NOT NULL DEFAULT 'MB', notes TEXT, created_at TEXT DEFAULT (date('now')));
    CREATE TABLE IF NOT EXISTS forecasts (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL, product_id INTEGER NOT NULL, month TEXT NOT NULL, qty_units INTEGER NOT NULL DEFAULT 0, UNIQUE(customer_id, product_id, month));
    CREATE TABLE IF NOT EXISTS stock (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, lot_number TEXT NOT NULL, expiry_date TEXT NOT NULL, qty_units INTEGER NOT NULL DEFAULT 0, updated_at TEXT DEFAULT (date('now')));
    CREATE TABLE IF NOT EXISTS purchase_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, po_number TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'ordered', order_date TEXT NOT NULL, arrival_month TEXT NOT NULL, notes TEXT, created_at TEXT DEFAULT (date('now')));
    CREATE TABLE IF NOT EXISTS po_items (id INTEGER PRIMARY KEY AUTOINCREMENT, po_id INTEGER NOT NULL, product_id INTEGER NOT NULL, qty_pallets INTEGER NOT NULL DEFAULT 1);
    CREATE INDEX IF NOT EXISTS idx_fp ON forecasts(product_id, month);
    CREATE INDEX IF NOT EXISTS idx_fc ON forecasts(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sp ON stock(product_id);
    CREATE INDEX IF NOT EXISTS idx_poi ON po_items(po_id);
  `.trim();
  for (const stmt of SCHEMA.split(";").map((s: string) => s.trim()).filter(Boolean)) {
    await db.execute({ sql: stmt });
  }
  console.log("Schema applied.");

  for (const p of PRODUCTS) {
    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO products (name, sku, exw_price_eur, packing_per_pallet) VALUES (?, ?, ?, ?)`,
        args: [p.name, p.sku, p.exw, p.packing],
      });
      console.log(`✓ Product: ${p.sku}`);
    } catch (e) {
      console.error(`✗ Product ${p.sku}:`, e);
    }
  }

  for (const c of CUSTOMERS) {
    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO customers (name, region) VALUES (?, ?)`,
        args: [c.name, c.region],
      });
      console.log(`✓ Customer: ${c.name}`);
    } catch (e) {
      console.error(`✗ Customer ${c.name}:`, e);
    }
  }

  console.log("Done!");
}

main().catch(console.error);
