# Phase 02: API Documentation

## Parallelization Info

**Can run with:** Phase 1, Phase 3  
**Blocks:** None  
**Blocked by:** None  
**Estimated time:** 2 hours

## File Ownership

**Exclusive write access:**
- `docs/api-reference.md` (create)

**Read access:**
- `sale-stock-po-app/app/api/*/route.ts` (all 15 endpoints)
- `sale-stock-po-app/lib/db.ts` (query patterns)
- `sale-stock-po-app/lib/session.ts` (auth patterns)
- Research report: `plans/260505-1103-cleanup-docs-testing/research/researcher-api-documentation.md`

## Conflict Prevention

No conflicts — only creates docs/api-reference.md. Phase 1 touches plans/ and .env.example, Phase 3 touches config files. Zero overlap.

## Context

**From API documentation research:**
- Recommended approach: Zod schemas + Scalar renderer (future enhancement)
- Current state: 15 REST endpoints, 8 route groups, no documentation
- Internal tool — focus on clarity over OpenAPI spec initially
- TypeScript strict mode — leverage types for accuracy

**From codebase summary:**
- 15 API endpoints across 8 route groups
- Consistent patterns: auth check, parameterized queries, JSON responses
- HTTP status codes: 200, 201, 400, 401, 404, 500
- No validation library (HTML5 only)

**Endpoints to document:**
1. `/api/init` — Database auto-migration
2. `/api/auth/setup` — PIN setup
3. `/api/auth/verify` — PIN verification
4. `/api/auth/reset-pin` — PIN reset
5. `/api/products` — List, create, bulk import
6. `/api/products/[id]` — Get, update, delete
7. `/api/customers` — List, create, bulk import
8. `/api/customers/[id]` — Get, update, delete
9. `/api/forecasts` — Query, upsert
10. `/api/stock` — List, create
11. `/api/stock/[id]` — Update, delete
12. `/api/stock/adjustments` — Adjustment history
13. `/api/po` — List, create
14. `/api/po/[id]` — Get, update, delete, receive
15. `/api/rollforward` — Calculate rollforward

## Requirements

### Functional
1. Document all 15 endpoints with request/response schemas
2. Include authentication requirements
3. Provide realistic examples (not just types)
4. Document error responses
5. Group by domain (auth, master data, operations)

### Non-functional
- Markdown format (human-readable)
- Copy-paste ready examples
- Consistent structure per endpoint
- Future-proof for OpenAPI generation

## Architecture

**Documentation Structure:**
```markdown
# API Reference

## Overview
- Base URL
- Authentication
- Error handling
- Rate limiting (none currently)

## Authentication Endpoints
- POST /api/auth/setup
- POST /api/auth/verify
- POST /api/auth/reset-pin

## Master Data Endpoints
- Products CRUD
- Customers CRUD

## Operations Endpoints
- Forecasts
- Stock
- Purchase Orders
- Rollforward

## Common Patterns
- Pagination (not implemented)
- Bulk operations
- Error responses
```

**Per-Endpoint Template:**
```markdown
### METHOD /api/path

**Description:** Brief purpose

**Authentication:** Required/Not required

**Request:**
- Headers
- Query params
- Body schema

**Response:**
- Success (200/201)
- Error (400/401/404/500)

**Example:**
```http
POST /api/products
Content-Type: application/json

{
  "name": "Product Name",
  "sku": "SKU-001",
  "exw_price_eur": 10.50,
  "packing_per_pallet": 100
}
```

**Response:**
```json
{
  "success": true
}
```
```

## Related Code Files

**To read (15 route files):**
- `sale-stock-po-app/app/api/init/route.ts`
- `sale-stock-po-app/app/api/auth/setup/route.ts`
- `sale-stock-po-app/app/api/auth/verify/route.ts`
- `sale-stock-po-app/app/api/auth/reset-pin/route.ts`
- `sale-stock-po-app/app/api/products/route.ts`
- `sale-stock-po-app/app/api/products/[id]/route.ts`
- `sale-stock-po-app/app/api/customers/route.ts`
- `sale-stock-po-app/app/api/customers/[id]/route.ts`
- `sale-stock-po-app/app/api/forecasts/route.ts`
- `sale-stock-po-app/app/api/stock/route.ts`
- `sale-stock-po-app/app/api/stock/[id]/route.ts`
- `sale-stock-po-app/app/api/stock/adjustments/route.ts`
- `sale-stock-po-app/app/api/po/route.ts`
- `sale-stock-po-app/app/api/po/[id]/route.ts`
- `sale-stock-po-app/app/api/rollforward/route.ts`

**To create:**
- `docs/api-reference.md`

## Implementation Steps

### 1. Read All API Route Files
```bash
# Verify endpoint count
find sale-stock-po-app/app/api -name "route.ts" | wc -l  # Should be 15
```

Read each route file to extract:
- HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Request body schemas
- Response formats
- Error handling patterns
- Auth requirements

### 2. Create API Reference Structure

Start with overview section:
- Base URL: `http://localhost:3000` (dev) or production URL
- Authentication: Session cookie (httpOnly)
- Content-Type: `application/json`
- Error format: `{ error: string }`

### 3. Document Authentication Endpoints

**POST /api/auth/setup:**
- First-time PIN setup
- No auth required (only works if no PIN exists)
- Request: `{ pin: string }`
- Response: `{ success: true }` or `{ error: string }`

**POST /api/auth/verify:**
- PIN login
- No auth required
- Request: `{ pin: string }`
- Response: `{ success: true }` + session cookie
- Errors: 401 if invalid PIN

**POST /api/auth/reset-pin:**
- Reset existing PIN
- Auth required
- Request: `{ currentPin: string, newPin: string }`
- Response: `{ success: true }`

### 4. Document Master Data Endpoints

**Products:**
- GET /api/products — List all products
- POST /api/products — Create product or bulk import
- GET /api/products/[id] — Get single product
- PUT /api/products/[id] — Update product
- DELETE /api/products/[id] — Delete product

**Customers:**
- GET /api/customers — List all customers
- POST /api/customers — Create customer or bulk import
- GET /api/customers/[id] — Get single customer
- PUT /api/customers/[id] — Update customer
- DELETE /api/customers/[id] — Delete customer

**Bulk Import Pattern:**
```json
POST /api/products
{
  "bulk": true,
  "items": [
    { "name": "...", "sku": "...", "exw_price_eur": 10, "packing_per_pallet": 100 },
    ...
  ]
}
```

### 5. Document Operations Endpoints

**Forecasts:**
- GET /api/forecasts?productId=X&customerId=Y&month=YYYY-MM
- POST /api/forecasts — Upsert forecast (create or update)

**Stock:**
- GET /api/stock?productId=X
- POST /api/stock — Create stock lot
- PUT /api/stock/[id] — Update stock quantity
- DELETE /api/stock/[id] — Delete stock lot
- GET /api/stock/adjustments?productId=X — Audit trail

**Purchase Orders:**
- GET /api/po?status=pending — List POs
- POST /api/po — Create PO
- GET /api/po/[id] — Get PO details
- PUT /api/po/[id] — Update PO
- DELETE /api/po/[id] — Delete PO
- PATCH /api/po/[id] — Mark received (special operation)

**Rollforward:**
- GET /api/rollforward — Calculate 8-month projections
- Returns: Array of RollforwardEntry (product, month, balance, status)

### 6. Document Common Patterns

**Error Responses:**
```json
// 400 Bad Request
{ "error": "Missing required fields" }

// 401 Unauthorized
{ "error": "Unauthorized" }

// 404 Not Found
{ "error": "Product not found" }

// 500 Internal Server Error
{ "error": "Internal server error" }
```

**Query Parameters:**
- Filtering: `?productId=1&customerId=2`
- No pagination (returns all results)
- No sorting (database order)

**Bulk Operations:**
- Products and customers support bulk import
- Use `{ bulk: true, items: [...] }` format
- Returns success count or error

### 7. Add Examples for Each Endpoint

Use realistic data from seed file:
- Product: "Exeol 500mg Tablets"
- Customer: "Bệnh viện Chợ Rẫy"
- SKU: "EXEOL-500-TAB"
- Dates: "2026-05" format

### 8. Add Future Enhancements Section

Document planned improvements:
- Zod validation schemas
- OpenAPI spec generation
- Scalar UI at /api/docs
- Request/response validation
- Rate limiting
- Pagination

## Todo List

- [x] Read all 15 API route files
- [x] Create docs/api-reference.md structure
- [x] Document overview and authentication
- [x] Document auth endpoints (3)
- [x] Document products endpoints (5)
- [x] Document customers endpoints (5)
- [x] Document forecasts endpoint (2)
- [x] Document stock endpoints (5)
- [x] Document PO endpoints (5)
- [x] Document rollforward endpoint (1)
- [x] Add common patterns section
- [x] Add realistic examples for each endpoint
- [x] Add error response documentation
- [x] Add future enhancements section
- [x] Verify all 15 endpoints documented

## Success Criteria

**Completion checklist:**
1. `docs/api-reference.md` exists and is well-formatted
2. All 15 endpoints documented with:
   - HTTP method and path
   - Description
   - Auth requirement
   - Request schema
   - Response schema
   - Example request/response
   - Error cases
3. Grouped by domain (auth, master data, operations)
4. Common patterns documented
5. Future enhancements noted
6. No TypeScript compilation errors in examples
7. Markdown renders correctly (test with preview)

**Validation:**
```bash
# Check file exists
test -f docs/api-reference.md && echo "✓ API reference exists"

# Check endpoint count (should mention all 15)
grep -c "^### " docs/api-reference.md  # Should be 15+

# Check example blocks
grep -c '```http' docs/api-reference.md  # Should be 15+
grep -c '```json' docs/api-reference.md  # Should be 30+ (request + response)
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Endpoint behavior misunderstood | Medium | Medium | Read actual route code, not assumptions |
| Examples contain errors | Low | Low | Copy from working Postman/curl tests |
| Missing edge cases | Medium | Low | Document known limitations clearly |
| Schema drift over time | High | Medium | Note: "Manual sync required until Zod added" |

## Security Considerations

**Documentation Safety:**
- Use placeholder credentials (no real PINs)
- Use example.com domains
- Use fake product/customer names
- Document auth requirements clearly
- Note: Session cookies are httpOnly (XSS protection)

**Future Security Enhancements:**
- Add Zod validation (runtime type checking)
- Add rate limiting documentation
- Document CORS policy (same-origin only)
- Add API key support for external integrations

## Next Steps

After completion:
1. Link from README.md (Phase 6)
2. Consider adding Zod schemas (v1.1)
3. Generate OpenAPI spec (v1.2)
4. Add Scalar UI at /api/docs (v1.2)
5. Update when endpoints change
