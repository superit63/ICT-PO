# Phase 5: Polish, Export & Deploy

**Priority:** P2 | **Status:** Pending | **Effort:** 6h

---

## Overview

Add Excel export, polish UI/UX, final Vercel deployment, and write onboarding guide.

## Context Links

- Phase 4: `phase-04-po-engine.md` — must complete first

## Key Insights

- Excel export: client-side using `xlsx` library (no server needed)
- Deploy: Vercel Hobby (free) for single-user app
- Onboarding guide: 1-page PDF or in-app tooltip tour

## Implementation Steps

### Step 5.1 — Excel Export

1. Install: `npm install xlsx`
2. Create `lib/export.ts` with export functions:
   - `exportForecasts(data)` — customer × product × month grid
   - `exportRollforward(data)` — per-product rollforward table
   - `exportPO(data)` — PO list with line items + status
3. Add "Export Excel" button to each screen header
4. Test: downloaded file opens correctly in Excel

### Step 5.2 — UI Polish

1. Add loading skeletons (shadcn `Skeleton`) while data fetches
2. Add empty states: "No forecasts yet — add your first forecast"
3. Add toast notifications (shadcn `Sonner`) for save success/error
4. Responsive layout: test on tablet/mobile (forecast grid scrolls horizontally)
5. Favicon + app title: "Sale-Stock-PO | ICT-PO"
6. Custom scrollbar for wide tables

### Step 5.3 — Deployment

1. `vercel deploy` — deploy to production
2. Set custom domain if available (e.g. `po.ictpo.com`)
3. Configure env vars in Vercel dashboard
4. Test production URL — verify PIN auth works
5. Set up Vercel Analytics (free) for basic metrics

### Step 5.4 — Onboarding Guide

1. Write `docs/onboarding-guide.md` (PDF export via browser print)
2. Content: setup PIN, add products, enter first forecast, check rollforward, create PO
3. Screenshots from the app
4. Keep under 2 pages

### Step 5.5 — Backup Strategy

1. Add "Export All Data" button in settings — downloads full DB as JSON
2. Document: run this weekly as manual backup
3. Turso free tier has automatic replication — also rely on that

## Todo List

- [ ] Implement Excel export (`lib/export.ts`) for all 3 main screens
- [ ] Add loading skeletons + empty states
- [ ] Add toast notifications for save/delete actions
- [ ] Responsive layout for tablet
- [ ] Custom app title + favicon
- [ ] Deploy to Vercel production
- [ ] Test production URL + PIN auth
- [ ] Write onboarding guide
- [ ] Add "Export All Data" JSON backup

## Success Criteria

- All 3 screens export valid Excel files
- App works on mobile/tablet
- Production URL is accessible and fast
- PIN auth works on production
- Onboarding guide covers full first-use flow

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Turso free tier limits | Low | Free tier: 500 DBs, 9GB. Single user won't hit limits. |
| PIN forgotten | Low | Add "reset PIN" by providing a recovery phrase |
| Excel export formatting issues | Low | Test on real Excel; format dates/numbers correctly |

## Next Steps

After this phase, the app is production-ready. Future enhancements (not in scope):
- Email alerts
- PDF reports
- Multi-user / role-based access
- Customer notes
- 12-month planning horizon
