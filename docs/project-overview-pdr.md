# Project Overview & Product Development Requirements

**Project:** ICT-PO — Sale Stock & Purchase Order Management  
**Version:** 1.0.0  
**Status:** Production  
**Last Updated:** 2026-05-04

---

## Product Vision

Replace manual Excel-based pharmaceutical distribution planning with an automated web application that provides real-time stock projections, intelligent purchase order suggestions, and comprehensive audit trails for Exeol product distribution to Vietnamese hospitals.

---

## Target Users

**Primary User:** Sale Manager (single user)
- Manages product forecasts for 25+ pharmaceutical products
- Coordinates with 10+ hospital customers across 3 regions
- Plans purchase orders with 5-month lead time constraint
- Tracks inventory with lot numbers and expiry dates
- Generates reports for management and suppliers

**User Characteristics:**
- Familiar with Excel-based workflows
- Needs quick access to stock status and PO recommendations
- Requires mobile-friendly interface for on-the-go access
- Values data accuracy and audit trails

---

## Business Context

**Industry:** Pharmaceutical Distribution  
**Manufacturer:** Exeol (France)  
**Market:** Vietnamese Hospitals  
**Product Category:** Medical disinfectants, sanitizers, surface cleaners

**Key Challenge:** 5-month lead time from order to arrival requires accurate demand forecasting and proactive stock management to prevent stockouts while minimizing excess inventory.

---

## Core Features & Capabilities

### 1. Authentication & Security
**Requirement:** Secure single-user access with PIN-based authentication

**Features:**
- 6-digit PIN setup on first launch
- bcrypt hashing with secure salt rounds
- httpOnly session cookies (30-day expiration)
- PIN reset capability (developer-assisted)
- Auto-redirect to login on session expiry

**Success Criteria:**
- PIN cannot be brute-forced (bcrypt protection)
- Session persists across browser restarts
- No unauthorized access to data

---

### 2. Master Data Management
**Requirement:** Maintain product catalog and customer database with bulk import capability

**Features:**
- Product CRUD (name, SKU, EXW price, packing per pallet)
- Customer CRUD (name, region, notes)
- Excel import with flexible column mapping
- Excel export for reporting
- Search and filter capabilities

**Success Criteria:**
- Import 25+ products in under 10 seconds
- Support column name variations (aliases)
- Prevent duplicate SKUs
- Maintain data integrity on bulk operations

---

### 3. Demand Forecasting
**Requirement:** Monthly demand forecasting per customer-product combination with 8-month horizon

**Features:**
- Editable grid (customer × product × month)
- Debounced auto-save (500ms)
- Real-time totals (row, column, grand)
- Product and customer filtering
- Excel export with formatted layout

**Success Criteria:**
- Handle 250+ forecast entries (10 customers × 25 products)
- Save changes within 1 second of user input
- Calculate totals in real-time without lag
- Export matches on-screen data exactly

---

### 4. Stock Rollforward Calculation
**Requirement:** 8-month rolling projection of stock balance with color-coded status indicators

**Features:**
- Server-side calculation: Stock + Incoming PO - Forecast = Balance
- Color-coded cells (Green/Yellow/Orange/Red)
- Status thresholds based on packing per pallet
- Month-by-month breakdown
- Product-level detail view

**Algorithm:**
```
For each product, for each month (1-8):
  Balance = Current Stock + Incoming PO Units - Forecast Units
  
  Status:
    - Stockout (Red): Balance < 0
    - Critical (Orange): Balance < 1 pallet worth
    - Low (Yellow): Balance < 3 pallets worth
    - OK (Green): Balance ≥ 3 pallets worth
```

**Success Criteria:**
- Calculate rollforward for 25 products in under 2 seconds
- Accurately reflect PO arrival months (5-month lead time)
- Update immediately when forecasts or POs change

---

### 5. Purchase Order Suggestions
**Requirement:** Automated PO recommendations based on projected stockouts

**Features:**
- Identify first stockout month per product
- Calculate shortfall units (absolute value of negative balance)
- Recommend pallet quantity (rounded up)
- Suggest container configuration (22 or 44 pallets)
- Calculate estimated PO value (pallets × packing × EXW price)
- Classify urgency (Critical: ≤2 months, Warning: 3-8 months)
- One-click PO creation with pre-filled data

**Algorithm:**
```
For each product with projected stockout:
  1. Find first month where balance < 0
  2. Shortfall = abs(negative balance)
  3. Pallets Needed = ceil(shortfall / packing per pallet)
  4. Container Config:
     - If pallets ≤ 22 → 22-pallet container
     - If pallets ≤ 44 → 44-pallet container
     - If pallets > 44 → "mixed" (multiple containers)
  5. PO Value = pallets × packing × EXW price
  6. Urgency = "critical" if stockout ≤ 2 months, else "warning"
```

**Success Criteria:**
- Suggest PO only when stockout is projected
- Respect container size constraints (22/44 pallets)
- Calculate arrival month correctly (order month + 5)
- Sort by urgency (critical first)

---

### 6. Purchase Order Management
**Requirement:** Full PO lifecycle tracking from order to receipt

**Features:**
- PO creation with auto-generated PO numbers
- Line item management (product × pallets)
- Status transitions: Ordered → Confirmed → In Transit → Received
- Mark Received workflow with lot/expiry entry
- Auto-stock creation on receipt
- PO list with status filtering
- Excel export for PO list and suggestions

**Success Criteria:**
- PO numbers are unique and sequential
- Status transitions are one-way (no rollback)
- Stock records created automatically on receipt
- Audit trail maintained for all changes

---

### 7. Stock Control & Lot Tracking
**Requirement:** Inventory management with lot numbers, expiry dates, and adjustment history

**Features:**
- Stock lot CRUD (product, lot number, expiry date, quantity)
- Expiry status indicators (Expired/≤30 days/≤90 days/Healthy)
- Manual adjustments with reason tracking
- Stock adjustment history (audit trail)
- Change types: create, update, delete, receipt
- Real-time metrics (total units, expiring soon, stocked products)

**Success Criteria:**
- Track every stock change with timestamp and reason
- Prevent deletion without reason
- Calculate expiry status accurately
- Maintain audit trail indefinitely (no deletions)

---

### 8. Dashboard & Reporting
**Requirement:** High-level overview of stock status and open POs

**Features:**
- Status cards (OK/Low/Critical/Stockout counts)
- Open PO value summary
- 8-month product status sparkline table
- Quick navigation to critical products
- Excel export for all major reports

**Success Criteria:**
- Dashboard loads in under 3 seconds
- Status counts match rollforward calculations
- Sparkline accurately represents 8-month trend

---

### 9. Data Backup & Recovery
**Requirement:** Export full database for backup and disaster recovery

**Features:**
- JSON export of all tables (products, customers, forecasts, stock, POs)
- One-click download from Settings page
- Timestamped filename for version tracking

**Success Criteria:**
- Export completes in under 10 seconds
- JSON is valid and importable
- All data included (no truncation)

---

## Non-Functional Requirements

### Performance
- **Page Load:** < 3 seconds on 4G connection
- **API Response:** < 1 second for CRUD operations
- **Rollforward Calculation:** < 2 seconds for 25 products × 8 months
- **Excel Export:** < 5 seconds for 250+ rows

### Scalability
- **Products:** Support up to 100 products
- **Customers:** Support up to 50 customers
- **Forecasts:** Handle 4,000+ forecast entries (50 × 100 × 8 months)
- **POs:** Manage 100+ active POs simultaneously

### Reliability
- **Uptime:** 99% availability (Vercel free tier limitations accepted)
- **Data Integrity:** Zero data loss on successful saves
- **Session Persistence:** 30-day cookie expiration
- **Error Handling:** Graceful degradation with user-friendly error messages

### Security
- **Authentication:** bcrypt hashing with salt rounds
- **Session Management:** httpOnly cookies, secure flag in production
- **SQL Injection:** Parameterized queries throughout
- **XSS Prevention:** React automatic escaping
- **CSRF:** Not implemented (single-user, same-origin only)

### Usability
- **Mobile Responsive:** All pages usable on tablets and phones
- **Accessibility:** WCAG 2.1 Level A compliance (semantic HTML, ARIA labels)
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Keyboard Navigation:** Full keyboard support for all interactive elements

### Maintainability
- **Code Quality:** TypeScript strict mode, ESLint rules
- **Documentation:** Inline comments for complex logic
- **Testing:** Manual testing (no automated tests in v1.0)
- **Deployment:** One-command deployment via Vercel CLI

---

## Technical Constraints

### Infrastructure
- **Hosting:** Vercel Hobby (free tier)
  - 512 MB memory per function
  - 10-second timeout
  - Cold starts expected
- **Database:** Turso free tier
  - 500 MB storage
  - 1 billion row reads/month
  - No edge replication (single region)
- **Region:** Frankfurt (fra1) — closest to France and Vietnam

### Framework Limitations
- **Next.js 16.2:** Breaking changes from training data (see AGENTS.md)
- **React 19.2:** New features not yet in training data
- **Tailwind CSS 4:** New syntax and configuration

### Business Constraints
- **Single User:** No multi-user or role-based access control
- **No Email/SMS:** No automated notifications (out of scope)
- **No PDF Reports:** Excel export only (PDF generation out of scope)
- **No Historical Import:** Cannot import past data from Excel (manual entry required)

---

## Success Metrics

### User Adoption
- **Target:** Sale manager uses app daily within 1 week of launch
- **Measure:** Login frequency, feature usage analytics

### Operational Efficiency
- **Target:** Reduce forecast entry time by 50% vs Excel
- **Measure:** Time to complete monthly forecast update

### Accuracy
- **Target:** Zero stockouts due to missed PO suggestions
- **Measure:** Actual stockouts vs projected stockouts

### Data Quality
- **Target:** 100% of POs tracked from order to receipt
- **Measure:** PO completion rate, audit trail completeness

---

## Out of Scope (Future Enhancements)

The following features are explicitly out of scope for v1.0:

1. **Multi-User Support:** Role-based access control, user management
2. **Email/SMS Alerts:** Automated stockout notifications
3. **PDF Reports:** PDF generation for management reports
4. **Historical Data Import:** Bulk import of past forecasts and POs from Excel
5. **12-Month Horizon:** Extended planning beyond 8 months
6. **Mobile App:** Native iOS/Android applications
7. **Supplier Management:** Supplier contact info, lead time tracking
8. **Barcode Scanning:** Lot number scanning via mobile camera
9. **Advanced Analytics:** Trend analysis, demand forecasting algorithms
10. **Multi-Language:** Internationalization (English only in v1.0)

---

## Dependencies & Integrations

### External Services
- **Turso:** Database hosting (libSQL/SQLite)
- **Vercel:** Application hosting and serverless functions

### Third-Party Libraries
- **@libsql/client:** Database client
- **bcryptjs:** Password hashing
- **xlsx:** Excel file generation
- **shadcn/ui:** UI component library
- **lucide-react:** Icon library
- **sonner:** Toast notifications

### No External APIs
- No third-party API integrations
- No payment processing
- No email service
- No analytics service (beyond Vercel built-in)

---

## Risk Assessment

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Vercel cold starts | Medium | Accept as free tier limitation |
| Turso free tier limits | Low | Monitor usage, upgrade if needed |
| Next.js 16 breaking changes | Medium | Read official docs before coding |
| Browser compatibility | Low | Test on major browsers |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| User forgets PIN | High | Developer-assisted reset process |
| Data loss (no backup) | High | Weekly JSON export reminder |
| Single point of failure (one user) | Medium | Document all processes |
| Stockout despite suggestions | High | Conservative pallet calculations |

### Operational Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Internet outage | High | Offline mode not supported (accept risk) |
| Database corruption | Medium | Turso automatic backups |
| Incorrect forecasts | High | User training, validation rules |

---

## Acceptance Criteria

### Phase 1: Setup & Authentication ✅
- [x] User can set 6-digit PIN on first launch
- [x] User can login with PIN
- [x] Session persists for 30 days
- [x] User redirected to login on session expiry

### Phase 2: Master Data ✅
- [x] User can add/edit/delete products
- [x] User can add/edit/delete customers
- [x] User can import products from Excel
- [x] User can export products to Excel

### Phase 3: Forecasting ✅
- [x] User can enter monthly forecasts in grid
- [x] Changes auto-save after 500ms
- [x] Totals calculate in real-time
- [x] User can filter by product/customer
- [x] User can export forecasts to Excel

### Phase 4: Rollforward ✅
- [x] System calculates 8-month rollforward
- [x] Cells color-coded by status
- [x] User can navigate months
- [x] User can export rollforward to Excel

### Phase 5: PO Management ✅
- [x] System suggests POs for projected stockouts
- [x] User can create PO from suggestion
- [x] User can manually create PO
- [x] User can track PO status
- [x] User can mark PO as received
- [x] Stock auto-created on receipt

### Phase 6: Stock Control ✅
- [x] User can add/edit/delete stock lots
- [x] System tracks lot numbers and expiry dates
- [x] System shows expiry status
- [x] System maintains adjustment history

### Phase 7: Dashboard & Reporting ✅
- [x] Dashboard shows status overview
- [x] Dashboard shows open PO value
- [x] User can export all major reports to Excel
- [x] User can backup all data to JSON

---

## Version History

### v1.0.0 (2026-03-19)
- Initial production release
- All core features implemented
- Deployed to Vercel
- 25 Exeol products seeded
- 10 hospital customers seeded

---

**Document Owner:** Development Team  
**Review Cycle:** Quarterly or on major feature additions
