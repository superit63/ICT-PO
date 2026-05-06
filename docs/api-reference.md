# API Reference

**Project:** ICT-PO — Sale Stock & Purchase Order Management  
**Last Updated:** 2026-05-05  
**Scope:** Current Next.js production API routes only

---

## Overview

- **Base URL:** Same origin as app. Local dev example: `http://localhost:3000`.
- **API prefix:** `/api`.
- **Body format:** JSON. Send `Content-Type: application/json` for request bodies.
- **Success format:** JSON objects or arrays, endpoint-specific.
- **Error format:** Usually `{ "error": "message" }`.
- **Pagination:** Not implemented, except `/api/stock/adjustments` has `limit`.
- **Rate limiting:** Not implemented in route code.
- **Production route files documented:** 15.

### Authentication

Most endpoints require a valid `session_pin` httpOnly cookie. The cookie is set by `POST /api/auth/setup` or `POST /api/auth/verify`, and refreshed by `POST /api/auth/reset-pin`.

Unauthenticated requests to protected endpoints return:

```json
{ "error": "Unauthorized" }
```

Status: `401`.

Unauthenticated endpoints:

- `GET /api/init`
- `POST /api/auth/setup`
- `POST /api/auth/verify`

Protected endpoints:

- `POST /api/auth/reset-pin`
- All product, customer, forecast, stock, purchase order, and rollforward endpoints.

### Common Response Types

- `Product`: `id`, `name`, `sku`, `exw_price_eur`, `packing_per_pallet`, `created_at`.
- `Customer`: `id`, `name`, `region`, `notes`, `created_at`.
- `Forecast`: `id`, `customer_id`, `product_id`, `month`, `qty_units`.
- `StockLot`: `id`, `product_id`, `lot_number`, `expiry_date`, `qty_units`, `updated_at`.
- `PurchaseOrderStatus`: `ordered`, `confirmed`, `in_transit`, `received`.
- `StockStatus`: `ok`, `low`, `critical`, `stockout`.

---

## Endpoint Index

| Route file | Methods | Path |
|---|---:|---|
| `app/api/init/route.ts` | `GET` | `/api/init` |
| `app/api/auth/setup/route.ts` | `POST` | `/api/auth/setup` |
| `app/api/auth/verify/route.ts` | `POST` | `/api/auth/verify` |
| `app/api/auth/reset-pin/route.ts` | `POST` | `/api/auth/reset-pin` |
| `app/api/products/route.ts` | `GET`, `POST` | `/api/products` |
| `app/api/products/[id]/route.ts` | `GET`, `PUT`, `DELETE` | `/api/products/{id}` |
| `app/api/customers/route.ts` | `GET`, `POST` | `/api/customers` |
| `app/api/customers/[id]/route.ts` | `GET`, `PUT`, `DELETE` | `/api/customers/{id}` |
| `app/api/forecasts/route.ts` | `GET`, `POST` | `/api/forecasts` |
| `app/api/stock/route.ts` | `GET`, `POST` | `/api/stock` |
| `app/api/stock/[id]/route.ts` | `GET`, `PUT`, `DELETE` | `/api/stock/{id}` |
| `app/api/stock/adjustments/route.ts` | `GET` | `/api/stock/adjustments` |
| `app/api/po/route.ts` | `GET`, `POST` | `/api/po` |
| `app/api/po/[id]/route.ts` | `GET`, `PUT`, `DELETE` | `/api/po/{id}` |
| `app/api/rollforward/route.ts` | `GET` | `/api/rollforward` |

---

## System

### GET `/api/init`

Runs database migrations. Called by app startup/root layout.

**Auth:** Not required.

**Request:** No body or query params.

**Success `200`:**

```json
{ "ok": true }
```

**Errors:**

- `500` `{ "error": "Migration failed" }`

**Example:**

```http
GET /api/init
```

---

## Authentication

### POST `/api/auth/setup`

Sets the first 6-digit PIN. Only works before a PIN exists. Also sets the `session_pin` cookie.

**Auth:** Not required.

**Body:**

```json
{ "pin": "123456" }
```

**Success `200`:**

```json
{ "ok": true }
```

**Errors:**

- `400` `{ "error": "PIN must be 6 digits" }`
- `409` `{ "error": "PIN already set up" }`
- `500` `{ "error": "Internal error" }`

### POST `/api/auth/verify`

Verifies the PIN and sets the `session_pin` cookie.

**Auth:** Not required.

**Body:**

```json
{ "pin": "123456" }
```

**Success `200`:**

```json
{ "ok": true }
```

**Errors:**

- `400` `{ "error": "PIN required" }`
- `401` `{ "error": "Invalid PIN" }`
- `404` `{ "error": "PIN not set up yet" }`
- `500` `{ "error": "Internal error" }`

### POST `/api/auth/reset-pin`

Replaces the current PIN and refreshes the `session_pin` cookie.

**Auth:** Required.

**Body:**

```json
{ "newPin": "654321" }
```

**Success `200`:**

```json
{ "ok": true }
```

**Errors:**

- `400` `{ "error": "PIN must be 6 digits" }`
- `401` `{ "error": "Unauthorized" }`
- `500` `{ "error": "Internal error" }`

---

## Products

### GET `/api/products`

Lists products ordered by name.

**Auth:** Required.

**Success `200`:** `Product[]`, e.g. `[{"id":1,"name":"Product A","sku":"SKU-A","exw_price_eur":12.5,"packing_per_pallet":100,"created_at":"2026-05-05"}]`.

**Errors:** `401`, `500`.

### POST `/api/products`

Creates one product, or bulk upserts products when the body is an array.

**Auth:** Required.

**Single body:**

```json
{
  "name": "Product A",
  "sku": "SKU-A",
  "exw_price_eur": 12.5,
  "packing_per_pallet": 100
}
```

Also accepts camelCase aliases: `exwPriceEur`, `packingPerPallet`.

**Single success `201`:** `Product`

**Bulk body:** Array. Optional `id` updates by ID; otherwise upserts by case-insensitive `sku`.

```json
[
  { "id": 1, "name": "Product A", "sku": "SKU-A", "exw_price_eur": 12.5, "packing_per_pallet": 100 },
  { "name": "Product B", "sku": "SKU-B", "exwPriceEur": 8.75, "packingPerPallet": 80 }
]
```

**Bulk success `200`:**

```json
{ "created": 1, "updated": 1, "items": [] }
```

`items` contains the full product list ordered by name.

**Errors:**

- `400` `{ "error": "name and sku required" }`
- `400` `{ "error": "Row 2: name and sku required" }`
- `401` `{ "error": "Unauthorized" }`
- `409` `{ "error": "SKU already exists" }`
- `500` `{ "error": "Internal error" }`

### GET `/api/products/{id}`

Gets one product.

**Auth:** Required.

**Path params:** `id` product ID.

**Success `200`:** `Product`

**Errors:** `401`, `404` `{ "error": "Not found" }`.

### PUT `/api/products/{id}`

Updates one product.

**Auth:** Required.

**Body:**

```json
{
  "name": "Product A Updated",
  "sku": "SKU-A",
  "exw_price_eur": 13,
  "packing_per_pallet": 120
}
```

**Success `200`:** `Product | null`. Current route returns `null` if no row exists after update.

**Errors:**

- `400` `{ "error": "name and sku required" }`
- `401` `{ "error": "Unauthorized" }`
- `409` `{ "error": "SKU already exists" }`
- `500` `{ "error": "Internal error" }`

### DELETE `/api/products/{id}`

Deletes one product when unused.

**Auth:** Required.

**Success `200`:**

```json
{ "ok": true }
```

**Errors:**

- `401` `{ "error": "Unauthorized" }`
- `409` `{ "error": "Cannot delete a product that is already used in forecasts, stock, or purchase orders." }`

---

## Customers

### GET `/api/customers`

Lists customers ordered by name.

**Auth:** Required.

**Success `200`:** `Customer[]`, e.g. `[{"id":1,"name":"Hospital A","region":"MB","notes":null,"created_at":"2026-05-05"}]`.

**Errors:** `401`.

### POST `/api/customers`

Creates one customer, or bulk upserts customers when the body is an array.

**Auth:** Required.

**Single body:**

```json
{
  "name": "Hospital A",
  "region": "MB",
  "notes": "Key account"
}
```

`region` defaults to `MB`. Blank `notes` becomes `null`.

**Single success `201`:** `Customer`

**Bulk body:** Array. Optional `id` updates by ID; otherwise upserts by exact name + region if only one match exists.

```json
[
  { "id": 1, "name": "Hospital A", "region": "MB", "notes": null },
  { "name": "Hospital B", "region": "MN", "notes": "New" }
]
```

**Bulk success `200`:**

```json
{ "created": 1, "updated": 1, "items": [] }
```

`items` contains the full customer list ordered by name.

**Errors:**

- `400` `{ "error": "name required" }`
- `400` `{ "error": "Row 2: name required" }`
- `401` `{ "error": "Unauthorized" }`
- `409` `{ "error": "Bulk import found multiple existing customers with the same name and region. Export first to keep IDs." }`
- `500` `{ "error": "Internal error" }`

### GET `/api/customers/{id}`

Gets one customer.

**Auth:** Required.

**Success `200`:** `Customer`

**Errors:** `401`, `404` `{ "error": "Not found" }`.

### PUT `/api/customers/{id}`

Updates one customer.

**Auth:** Required.

**Body:**

```json
{
  "name": "Hospital A Updated",
  "region": "MN",
  "notes": ""
}
```

**Success `200`:** `Customer | null`. Blank `notes` returns/stores `null`.

**Errors:**

- `400` `{ "error": "name required" }`
- `401` `{ "error": "Unauthorized" }`

### DELETE `/api/customers/{id}`

Deletes one customer when unused by forecasts.

**Auth:** Required.

**Success `200`:**

```json
{ "ok": true }
```

**Errors:**

- `401` `{ "error": "Unauthorized" }`
- `409` `{ "error": "Cannot delete a customer that already has forecast data." }`

---

## Forecasts

### GET `/api/forecasts`

Lists forecast rows with product and customer names.

**Auth:** Required.

**Query params:**

| Name | Required | Description |
|---|---:|---|
| `productId` | No | Filter by product ID |
| `customerId` | No | Filter by customer ID |
| `month` | No | Filter by `YYYY-MM` |

**Success `200`:** Forecast rows plus `product_name`, `customer_name`, e.g. `[{"id":1,"customer_id":1,"product_id":1,"month":"2026-06","qty_units":240,"product_name":"Product A","customer_name":"Hospital A"}]`.

**Errors:** `401`.

**Example:**

```http
GET /api/forecasts?productId=1&customerId=1&month=2026-06
```

### POST `/api/forecasts`

Upserts one or many forecast rows by `(customer_id, product_id, month)`.

**Auth:** Required.

**Body:** Single object or array.

```json
[
  { "customer_id": 1, "product_id": 1, "month": "2026-06", "qty_units": 240 },
  { "customer_id": 1, "product_id": 2, "month": "2026-06", "qty_units": 120 }
]
```

`qty_units` defaults to `0`. Items missing `customer_id`, `product_id`, or `month` are skipped.

**Success `201`:** `Forecast[]`

**Errors:** `401`, `500` `{ "error": "Internal error" }`.

---

## Stock

### GET `/api/stock`

Lists stock lots with product name and SKU.

**Auth:** Required.

**Query params:**

| Name | Required | Description |
|---|---:|---|
| `productId` | No | Filter by product ID |

**Success `200`:** Stock rows plus `product_name`, `sku`, e.g. `[{"id":1,"product_id":1,"lot_number":"LOT-001","expiry_date":"2027-12-31","qty_units":500,"updated_at":"2026-05-05","product_name":"Product A","sku":"SKU-A"}]`.

**Errors:** `401`.

### POST `/api/stock`

Creates one stock lot and writes a stock adjustment audit row.

**Auth:** Required.

**Body:**

```json
{
  "product_id": 1,
  "lot_number": "LOT-001",
  "expiry_date": "2027-12-31",
  "qty_units": 500,
  "reason": "Opening balance"
}
```

**Success `201`:** `StockLot`

**Errors:**

- `400` `{ "error": "product_id, lot_number, expiry_date, qty_units required" }`
- `400` `{ "error": "qty_units must be greater than 0" }`
- `401` `{ "error": "Unauthorized" }`

### GET `/api/stock/{id}`

Gets one stock lot with product name and SKU.

**Auth:** Required.

**Success `200`:** `StockLot & { product_name: string, sku: string }`

**Errors:** `401`, `404` `{ "error": "Not found" }`.

### PUT `/api/stock/{id}`

Updates one stock lot and writes an adjustment audit row.

**Auth:** Required.

**Body:**

```json
{
  "product_id": 1,
  "lot_number": "LOT-001",
  "expiry_date": "2027-12-31",
  "qty_units": 450,
  "reason": "Cycle count"
}
```

**Success `200`:** `StockLot & { product_name: string, sku: string }`

**Errors:**

- `400` `{ "error": "product_id, lot_number, expiry_date, qty_units required" }`
- `400` `{ "error": "qty_units must be greater than 0" }`
- `401` `{ "error": "Unauthorized" }`
- `404` `{ "error": "Not found" }`

### DELETE `/api/stock/{id}`

Deletes one stock lot and writes an adjustment audit row.

**Auth:** Required.

**Body:** Optional.

```json
{ "reason": "Expired lot removed" }
```

**Success `200`:**

```json
{ "ok": true }
```

**Errors:** `401`, `404` `{ "error": "Not found" }`.

### GET `/api/stock/adjustments`

Lists stock adjustment audit rows with product name and SKU.

**Auth:** Required.

**Query params:**

| Name | Required | Description |
|---|---:|---|
| `productId` | No | Filter by product ID |
| `limit` | No | Max rows. Default `20`, clamped `1` to `100` |

**Success `200`:** Adjustment rows plus `product_name`, `sku`. Fields: `id`, `stock_id`, `product_id`, `lot_number`, `expiry_date`, `change_type`, `reason`, `qty_delta`, `previous_qty`, `next_qty`, `reference_type`, `reference_id`, `created_at`, `product_name`, `sku`.

Example: `[{"id":1,"stock_id":1,"product_id":1,"lot_number":"LOT-001","expiry_date":"2027-12-31","change_type":"update","reason":"Cycle count","qty_delta":-50,"previous_qty":500,"next_qty":450,"reference_type":null,"reference_id":null,"created_at":"2026-05-05 12:00:00","product_name":"Product A","sku":"SKU-A"}]`.

**Errors:** `401`.

---

## Purchase Orders

### GET `/api/po`

Lists purchase orders as flattened rows, one row per PO item. POs with no items still appear because of left joins.

**Auth:** Required.

**Query params:**

| Name | Required | Description |
|---|---:|---|
| `status` | No | Repeatable filter, e.g. `status=ordered&status=confirmed` |

**Success `200`:** Flattened rows with PO fields plus `item_id`, `product_id`, `qty_pallets`, `product_name`, `sku`, `exw_price_eur`, `packing_per_pallet`.

Example: `[{"id":1,"po_number":"PO-2026-001","status":"ordered","order_date":"2026-05-05","arrival_month":"2026-10","notes":null,"created_at":"2026-05-05","item_id":1,"product_id":1,"qty_pallets":5,"product_name":"Product A","sku":"SKU-A","exw_price_eur":12.5,"packing_per_pallet":100}]`.

**Errors:** `401`.

### POST `/api/po`

Creates a purchase order and its line items.

**Auth:** Required.

**Body:**

```json
{
  "po_number": "PO-2026-001",
  "order_date": "2026-05-05",
  "arrival_month": "2026-10",
  "notes": "October replenishment",
  "items": [
    { "product_id": 1, "qty_pallets": 5 },
    { "product_id": 2, "qty_pallets": 3 }
  ]
}
```

**Success `201`:** Purchase order without `items`, e.g. `{"id":1,"po_number":"PO-2026-001","status":"ordered","order_date":"2026-05-05","arrival_month":"2026-10","notes":"October replenishment","created_at":"2026-05-05"}`.

**Errors:**

- `400` `{ "error": "po_number, order_date, arrival_month, items required" }`
- `401` `{ "error": "Unauthorized" }`
- `409` `{ "error": "PO number already exists" }`
- `500` `{ "error": "Internal error" }`

### GET `/api/po/{id}`

Gets one purchase order with item details.

**Auth:** Required.

**Success `200`:** Purchase order plus `items[]`. Item fields: `id`, `po_id`, `product_id`, `qty_pallets`, `product_name`, `sku`, `exw_price_eur`, `packing_per_pallet`.

Example: `{"id":1,"po_number":"PO-2026-001","status":"ordered","order_date":"2026-05-05","arrival_month":"2026-10","notes":null,"created_at":"2026-05-05","items":[{"id":1,"po_id":1,"product_id":1,"qty_pallets":5,"product_name":"Product A","sku":"SKU-A","exw_price_eur":12.5,"packing_per_pallet":100}]}`.

**Errors:** `401`, `404` `{ "error": "Not found" }`.

### PUT `/api/po/{id}`

Updates status, notes, items, or receives the PO. This route uses `PUT` only; there is no production `PATCH /api/po/{id}` route.

**Auth:** Required.

**Mode 1 — update status:**

```json
{ "action": "update_status", "status": "confirmed" }
```

Short form also works:

```json
{ "status": "in_transit" }
```

Valid statuses: `ordered`, `confirmed`, `in_transit`, `received`.

If status is set to `received`, the route creates stock lots for all PO items using:

- `lot_number`: PO number
- `expiry_date`: `2099-12-31`
- `qty_units`: `qty_pallets * packing_per_pallet`

**Mode 2 — receive with explicit lots:**

```json
{ "action": "receive", "lots": [{ "product_id": 1, "lot_number": "LOT-PO-001", "expiry_date": "2027-12-31", "qty_units": 500 }] }
```

Each lot creates stock and an adjustment with `change_type: "receipt"`.

**Mode 3 — update notes/items:**

```json
{ "notes": "Supplier confirmed split shipment", "items": [{ "product_id": 1, "qty_pallets": 6 }] }
```

When `items` is provided, existing PO items are deleted and replaced.

**Success `200`:** Purchase order with `items`.

**Errors:**

- `400` `{ "error": "Invalid status" }`
- `400` `{ "error": "lots array required" }`
- `400` `{ "error": "Each received lot needs product, lot, expiry date, and quantity." }`
- `401` `{ "error": "Unauthorized" }`
- `404` `{ "error": "Not found" }`
- `409` `{ "error": "Purchase order already received" }`

### DELETE `/api/po/{id}`

Deletes one purchase order and its items, unless it is already received.

**Auth:** Required.

**Success `200`:**

```json
{ "ok": true }
```

**Errors:**

- `400` `{ "error": "Cannot delete a received PO" }`
- `401` `{ "error": "Unauthorized" }`

---

## Rollforward

### GET `/api/rollforward`

Calculates 8-month stock projection per product.

**Auth:** Required.

**Query params:**

| Name | Required | Description |
|---|---:|---|
| `planningMonth` | No | First month in `YYYY-MM`. Defaults to current server month |

**Success `200`:** `{ planningMonth, months, results }`.

`results[]`: `productId`, `productName`, `sku`, `packingPerPallet`, `currentStock`, `exwPriceEur`, `entries`.

`entries[]`: `month`, `currentStock`, `incomingPOUnits`, `forecastUnits`, `balance`, `status`.

Example: `{"planningMonth":"2026-05","months":["2026-05","2026-06"],"results":[{"productId":1,"productName":"Product A","sku":"SKU-A","packingPerPallet":100,"currentStock":500,"exwPriceEur":12.5,"entries":[{"month":"2026-05","currentStock":500,"incomingPOUnits":0,"forecastUnits":120,"balance":380,"status":"ok"}]}]}`.

**Status calculation:**

- `stockout`: balance `< 0`
- `critical`: balance `< 1 pallet`
- `low`: balance `< 3 pallets`
- `ok`: balance `>= 3 pallets`

**Errors:** `401`.

---

## Common Error Notes

- `401 Unauthorized`: Missing or invalid `session_pin` cookie on protected route.
- `400 Bad Request`: Missing required fields or invalid values where route validates input.
- `404 Not Found`: Route explicitly checks missing record. Some update/delete routes do not 404 when target missing.
- `409 Conflict`: Unique constraint or protected delete/receive state.
- `500 Internal Error`: Route caught database or runtime failure.
- Some routes have no explicit `try/catch`; unexpected database/runtime failures return the framework/platform 500 response.

## References

- `sale-stock-po-app/app/api/**/route.ts`
- `sale-stock-po-app/lib/session.ts`
- `sale-stock-po-app/lib/db.ts`
