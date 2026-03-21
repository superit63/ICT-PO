# Brainstorm Report: Sale-Stock-PO Web App

**Date:** 19/03/2026
**Author:** Brainstormer Agent
**User:** Sale Manager — ICT-PO (Exeol/Sodel product distribution, Vietnam hospitals)

---

## 1. Problem Statement

### Current Process (Excel-Based)
User manages a pharmaceutical/medical-supply distribution business with:
- **~20–30 product codes** (Exeol brand — disinfectants, surgical instruments)
- **Forecast:** Sales team enters monthly forecasts per customer × product × month (8 months rolling)
- **Stock check:** Current stock per LOT/expiry date tracked in sheet "Tồn kho"
- **Lead time:** Manufacturer in France → 5-month lead time → order THIS month, arrive NEXT month
- **PO constraints:** Each PO = 22 or 44 pallets; each product has different packing (e.g. 672 units/pallet); minimum 1 pallet (no fractional)
- **Key calculation:** Balance = Current Stock + Incoming POs − Forecast Sales per month
- **Risk:** If balance goes negative → stockout

**Excel pain:** 5 sheets (DK đặt hàng, NXT, Tồn kho, Output, Detail) with complex cross-sheet references; manual switch between sheets; no auto-alerts; pallet math done manually.

### Requirements Summary
| Factor | Detail |
|---|---|
| Users | 1 (sale manager, single user) |
| Deployment | Cloud (online, accessible anywhere) |
| Replace Excel | Yes, full replacement |
| Data entry | Manual (only user enters all forecasts) |
| Integrations | None |
| Budget | Willing to pay for speed |
| Timeline | Prefer faster delivery |

---

## 2. Evaluated Approaches

### Approach A — Streamlit (Python Web App)
- **What:** Python app with SQLite DB. UI built with Streamlit (open-source).
- **Hosting:** Deploy on Streamlit Cloud (free) or a small VPS.
- **Pros:** Fast to build, Python-native, great for data apps, free hosting available, easy Excel import.
- **Cons:** UI looks like a data tool, not a polished product; limited customization; requires Python knowledge for maintenance.
- **Dev time:** ~2–4 weeks
- **Cost:** Free (self-hosted or Streamlit Cloud) to ~$10/mo (Railway/Render VPS)

### Approach B — Next.js + SQLite (Recommended)
- **What:** React/Next.js frontend + API routes + SQLite (or Turso SQLite) + deployment on Vercel/Cloudflare.
- **Pros:** Modern, fast, great UX, professional look, scalable, easy to add features later, can export to Excel anytime.
- **Cons:** Requires more dev effort than Streamlit.
- **Dev time:** ~4–8 weeks
- **Cost:** ~$10–20/mo (Vercel Pro or Cloudflare Workers + D1)

### Approach C — Retool or Glide (No-Code / Low-Code)
- **What:** Use a no-code platform like Retool, Glide, or NocoBase.
- **Pros:** Fastest to get running, no-code, visual database builder.
- **Cons:** Monthly subscription ($10–50/mo), less flexible for complex custom logic (pallet math, rollforward), vendor lock-in.
- **Dev time:** ~1–2 weeks setup + customization
- **Cost:** $10–50/mo ongoing

### Approach D — Google Sheets + Apps Script + Add-on
- **What:** Migrate Excel → Google Sheets with Apps Script automation + custom sidebar UI.
- **Pros:** Immediate, familiar spreadsheet interface, free, cloud sync, easy collaboration.
- **Cons:** Still spreadsheet-based; Apps Script is limited; complex logic gets messy; no native pallet rounding.
- **Dev time:** ~1–2 weeks
- **Cost:** Free (Google account)

---

## 3. Recommended Solution: **Approach B — Next.js + SQLite**

**Rationale:**
- User wants **full Excel replacement** + **cloud** + **single user** → Next.js gives the most professional, maintainable result
- Willing to pay for speed → budget is not a blocker
- No integrations needed → keeps scope focused
- Single user → no complex auth needed (just email/password, or even a simple PIN)
- Future-proof → can easily add Excel export, PDF reports, email alerts later

---

## 4. App Architecture

### Data Model

```
Products
├── id, name, sku, item_code, exw_price, packing_per_pallet

Customers
├── id, name, region (MB/MN/MN-South), sales_person

Forecasts
├── id, customer_id, product_id, month (YYYY-MM), qty_units

Stock (Current)
├── id, product_id, lot_number, expiry_date, qty_units

IncomingPOs
├── id, product_id, po_number, order_month, arrival_month, qty_pallets

PO_Orders (finalized)
├── id, product_id, qty_pallets, po_number, order_date, arrival_date, status (ordered/confirmed/in_transit/received)
```

### Core Features

1. **Dashboard** — Summary view: stock status per product (OK / Low / Critical / Stockout), upcoming PO arrivals, top shortages
2. **Forecast Entry** — Grid view: rows = customers, cols = months (8 months rolling), fill qty per product. Auto-sum by product.
3. **Stock Rollforward** — Per-product timeline: [Current Stock] → +[Incoming POs] → −[Forecast] = [Projected Balance] per month. Color-coded (green = OK, red = negative → stockout).
4. **PO Suggestion Engine** — Auto-calculate: for each product where projected balance goes negative, suggest minimum pallets to order (ceil of needed_units / packing_per_pallet). Show PO value (pallets × packing × exw_price).
5. **PO Management** — Create/edit POs. Each PO: choose product, qty pallets, PO number. Enforce 22 or 44 pallet container. Track status (ordered → confirmed → in_transit → received).
6. **Stock Management** — Add/update current stock with LOT and expiry dates. Track multiple lots per product.
7. **Excel Export** — One-click export current view to Excel (for reporting to management).

### Key Calculations

```
Needed Pallets = ceil(Shortfall_Units / packing_per_pallet)
Shortfall_Units = max(0, Forecast_Month - Available_Stock_Before_Month)
Available_Stock = Current_Stock + sum(Incoming_POs_already_arrived) - sum(Forecast_sales_up_to_month)
Container_Qty = Needed_Pallets → must be 22 or 44 (if >44, suggest multiple POs)
PO_Value = qty_pallets × packing_per_pallet × exw_price
```

---

## 5. Implementation Plan

### Phase 1 — Foundation (Week 1–2)
- [ ] Set up Next.js project with TypeScript
- [ ] Design & create SQLite schema (Products, Customers, Stock, POs)
- [ ] Basic CRUD for Products and Customers
- [ ] Stock entry with LOT/expiry

### Phase 2 — Forecast + Rollforward (Week 3–4)
- [ ] Forecast entry grid (customer × product × month)
- [ ] Stock rollforward engine (balance calculation per month per product)
- [ ] Visual timeline with color-coded cells
- [ ] Stockout alerts

### Phase 3 — PO Engine + Management (Week 5–6)
- [ ] Auto-PO suggestion (shortage → pallets needed)
- [ ] PO creation form with 22/44 pallet enforcement
- [ ] PO tracking (status updates)
- [ ] PO history log

### Phase 4 — Polish + Export (Week 7–8)
- [ ] Dashboard with KPIs (total stock value, upcoming shortages, PO status)
- [ ] Excel export functionality
- [ ] Deployment to Vercel
- [ ] User onboarding guide

---

## 6. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Data migration from Excel is tedious | Medium | Build a CSV/Excel import tool for historical data |
| Pallet rounding causes over-ordering | Low | Show clear warning: "Ordering X pallets = Y units (overshoot by Z units)" |
| Cloud cost | Low | Vercel hobby plan is free for personal projects; upgrade only if needed |
| Losing data if cloud provider goes down | Low | SQLite D1 on Cloudflare has automatic backups; manual CSV export as backup |

---

## 7. Unresolved Questions

1. **Authentication:** Simple email/password or a shared PIN code for access?
2. **Data backup:** Should the app auto-export to a local file periodically, or rely on cloud backups only?
3. **Existing historical data:** Should we import existing Excel data (forecasts, POs, stock) into the app, or start fresh?
4. **Email/notification alerts:** When a stockout is predicted, should the app send an email alert, or just show a dashboard warning?
5. **Multi-year planning:** Do you need to plan beyond 8 months, or is 8 months sufficient?
6. **PO supplier details:** Besides "22 or 44 pallets", are there other PO rules (e.g., MOQ per product, combined products in same container)?

---

## 8. Next Steps

1. **Confirm approach** — Next.js + SQLite + Cloud (Approach B)?
2. **Answer unresolved questions above**
3. **Create implementation plan** — Detailed phase-by-phase tasks
4. **Begin Phase 1** — Set up project structure, database schema, core UI

---

*Report generated by Brainstormer Agent | Session: 260319-2247*
