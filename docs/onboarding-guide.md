# Sale-Stock-PO — Onboarding Guide

**App:** Sale-Stock-PO | ICT-PO
**Version:** 1.0.0
**Print:** Use browser `Ctrl+P` → Save as PDF

---

## Step 1 — Set Up Your PIN

On first launch, you land on `/setup`.

- Enter any 6-digit PIN (numbers only)
- Confirm the PIN
- Click **Set PIN & Enter App**

Your PIN is stored securely. You will need it every time you open the app.

> ⚠️ If you forget your PIN, contact the app developer to reset it.

---

## Step 2 — Seed Products (First Time)

The app starts empty. Seed the product catalog:

```bash
cd sale-stock-po-app
npx tsx scripts/seed-products.ts
```

This loads **25 Exeol pharmaceutical products** and **10 hospital customers** into the database.

- Products include: OPA, GTA, Surface Wipes, Hand Sanitizers, Lab Disinfectants, etc.
- Customers include: hospitals in Northern/Central/Southern Vietnam (MB/MN/MN-South)

---

## Step 3 — Enter Monthly Forecasts

Go to **Forecasts** from the top navigation.

The grid shows: rows = customers × products, columns = months (8-month rolling window).

### How to enter a forecast:
1. Click any cell
2. Type the forecasted units for that month
3. Data auto-saves after 500ms (or on blur)

### Tips:
- Use the **filter dropdowns** to narrow down by product or customer
- Row **Total** = sum across all months for that customer×product
- Column **Total** = sum across all products for that month
- **Grand Total** row at the bottom shows overall demand
- Click **📥 Export Excel** to download for reporting

---

## Step 4 — Check the Rollforward

Go to **Rollforward** from the top navigation.

This shows the projected stock balance for each product over 8 months.

### How to read it:
- **Current Stock** (today) — your starting inventory
- **+ Incoming PO** — units arriving from purchase orders
- **− Forecast** — units predicted to sell (from Step 3)
- **= Balance** — projected stock at end of each month

### Cell colors:
| Color | Meaning |
|-------|---------|
| 🟢 Green | Stock is healthy |
| 🟡 Yellow | Low stock (below 3 months of pallet) |
| 🟠 Orange | Critical (below 1 pallet) |
| 🔴 Red | **Stockout** — you will run out |

### Stockout = action needed:
Click any product → the app shows which month it runs out and how many pallets you need to order.

---

## Step 5 — Create Purchase Orders

### Step 5a — Get PO Suggestions
Go to **PO Suggest** from the top navigation.

Products are sorted by urgency:
- 🔴 **Critical** — stockout within 2 months
- 🟡 **Warning** — stockout in 3–8 months

Each card shows:
- Which month the stockout occurs
- How many units short
- How many pallets to order (rounded up to whole pallets)
- Estimated PO value (€)
- Container config (22 or 44 pallets)

Click **Create PO →** to go directly to the PO form with fields pre-filled.

### Step 5b — Create a PO Manually
Go to **PO Management** → **+ New PO**.

Fields:
- **PO Number** — auto-generated, editable (e.g. `PO-2026-04-001`)
- **Order Date** — when you place the order
- **Arrival Month** — when goods arrive (5 months after order)
- **Product** — select from catalog
- **Qty Pallets** — must be ≥1

> ⚠️ **Container constraint:** Each shipment must be 22 or 44 pallets.
> The app warns if you enter a non-standard quantity.

### Step 5c — Track PO Status
On the PO list, click any PO to see details.

Status lifecycle:
```
Ordered → Confirmed → In Transit → Received
```

When goods arrive:
1. Click **Mark Received**
2. Enter lot number + expiry date for each product
3. Stock is automatically added to your inventory

---

## Step 6 — Monitor the Dashboard

The **Dashboard** (home) gives a high-level overview:

- **Status cards** — count of products in each status category
- **Open PO value** — total value of outstanding purchase orders
- **Product table** — 8-month status sparkline per product

Use the dashboard daily to spot emerging stockouts early.

---

## Key Constraints (Pharmaceutical Distribution)

| Factor | Value |
|--------|-------|
| Manufacturer lead time | **5 months** (France → Vietnam) |
| Container sizes | **22** or **44 pallets** |
| Minimum order | **1 pallet** per product |
| Planning horizon | **8 months** rolling |

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| "PIN not set up" redirect | Visit `/setup` first |
| All products show "Critical" | Add stock entries or enter forecasts |
| PO Suggest shows no suggestions | All products are adequately stocked — good! |
| Export not downloading | Check browser popup blocker |
| App is slow on first load | Vercel cold start — normal on free tier |

---

## Backup

Go to **Settings** → **📥 Export All Data (JSON)** to download a full backup of your database.

Recommended: do this weekly and store the file safely.

---

*For technical support, contact the app developer.*
