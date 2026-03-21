---
title: "Sale-Stock-PO Web App"
description: "Cloud web app for sale manager to manage forecasts, stock rollforward, and purchase orders (POs) for Exeol pharmaceutical distribution"
status: completed
priority: P1
effort: 40h
branch: main
tags: [feature, frontend, backend, database, fullstack]
created: 2026-03-19
---

# Sale-Stock-PO Web App — Implementation Plan

## Overview

Build a cloud-hosted web app that replaces the existing Excel-based sale/stock/PO management workflow. Single user (sale manager), PIN-only auth, 5 core screens: Dashboard, Forecast Entry, Stock Rollforward, PO Suggestion, PO Management.

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | Modern, fast, professional UX |
| Backend | Next.js API Routes (serverless) | Same repo, easy deployment |
| Database | SQLite via `@libsql/client` (Turso) | Zero ops, edge-ready, free tier |
| Hosting | Vercel (Next.js optimized) | Free hobby tier, global CDN |
| Auth | PIN code (6-digit) via cookie | Simple, no email needed, 1 user |
| Export | xlsx library | Client-side Excel generation |

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Setup Environment | ✅ Complete | 4h | [phase-01-setup-environment](./phase-01-setup-environment.md) |
| 2 | Database Schema | ✅ Complete | 4h | [phase-02-database-schema](./phase-02-database-schema.md) |
| 3 | Core Features (Dashboard + Forecast + Rollforward) | ✅ Complete | 16h | [phase-03-core-features](./phase-03-core-features.md) |
| 4 | PO Engine + Management | ✅ Complete | 10h | [phase-04-po-engine.md](./phase-04-po-engine.md) |
| 5 | Polish + Export + Deploy | ✅ Complete | 6h | [phase-05-polish-export](./phase-05-polish-export.md) |

## Key Dependencies

- Manufacturer lead time: 5 months (order → arrival)
- Pallet constraint: 22 or 44 pallets/container, min 1 pallet/product
- Products: ~20-30 SKUs with different packing (units/pallet varies)
- Planning horizon: 8 months rolling
- No email alerts — dashboard warning only

## Docs

- Brainstorm report: `../reports/brainstorm-260319-2247-sale-stock-po-webapp.md`
