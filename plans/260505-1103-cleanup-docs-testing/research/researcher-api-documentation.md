# API Documentation Research Report

**Date:** 2026-05-05  
**Context:** 15 REST endpoints, 8 route groups, TypeScript strict mode, internal tool  
**Goal:** Recommend practical API documentation approach for Next.js App Router project

---

## Executive Summary

**Recommended Approach:** Zod schemas + Scalar renderer + minimal OpenAPI generation  
**Rationale:** Type-safe validation already needed, Scalar provides best DX for internal tools, low maintenance overhead

---

## 1. Documentation Formats

### OpenAPI/Swagger 3.x
- **Industry standard** for REST APIs
- Machine-readable spec enables tooling (validators, clients, mocks)
- **Trade-off:** Manual maintenance vs auto-generation complexity

### Markdown-based
- Simple, version-controlled, readable
- **Trade-off:** No interactive testing, manual sync with code

### TypeScript-first (Zod schemas)
- Single source of truth for validation + types + docs
- Runtime validation prevents invalid requests
- **Trade-off:** Requires OpenAPI generation layer for visual docs

**Winner for internal tools:** TypeScript-first with OpenAPI export

---

## 2. Documentation Tools Comparison

### Scalar (Recommended)
- **Pros:** Modern UI, best-in-class DX, free/open-source, lightweight
- **Cons:** Newer (less mature than Swagger UI)
- **Use case:** Internal tools prioritizing developer experience
- **Source:** [APIs You Won't Hate - Top 5 API Docs Tools](https://apisyouwonthate.com/blog/top-5-best-api-docs-tools/)

### Swagger UI
- **Pros:** Most widely adopted, battle-tested, interactive playground
- **Cons:** Dated UI, heavier bundle
- **Use case:** Public APIs, maximum compatibility
- **Source:** [Kind of Technical - Swagger UI Guide](https://www.kindatechnical.com/api-design-development/swagger-ui-redoc-interactive-docs.html)

### Redoc
- **Pros:** Beautiful three-panel layout (Stripe-like), read-focused
- **Cons:** Less interactive than Swagger UI, no built-in "try it" feature
- **Use case:** Public-facing documentation sites
- **Source:** [APIs You Won't Hate - Top 5 API Docs Tools](https://apisyouwonthate.com/blog/top-5-best-api-docs-tools/)

### Mintlify / Docusaurus
- **Pros:** Full documentation sites (guides + API reference)
- **Cons:** Overkill for internal tools, separate deployment
- **Use case:** External developer portals
- **Source:** [Mintlify - Best API Documentation Tools 2026](https://mintlify.com/blog/top-7-api-documentation-tools-of-2025)

**Decision Matrix:**

| Tool | Setup Time | Maintenance | DX | Cost | Internal Tool Fit |
|------|-----------|-------------|----|----|------------------|
| Scalar | Low | Low | Excellent | Free | ⭐⭐⭐⭐⭐ |
| Swagger UI | Low | Low | Good | Free | ⭐⭐⭐⭐ |
| Redoc | Low | Low | Good | Free | ⭐⭐⭐ |
| Mintlify | High | Medium | Excellent | $14+/user | ⭐⭐ |

---

## 3. Next.js Integration Patterns

### Route Handler Documentation
- **Pattern:** Co-locate Zod schemas with route handlers
- **Validation:** Use Zod for request/response validation in handlers
- **Generation:** Extract schemas to OpenAPI spec via tooling
- **Source:** [Dub.co - Zod API Validation](https://dub.co/blog/zod-api-validation)

### Type-Safe Contracts
```typescript
// app/api/users/route.ts
import { z } from 'zod';

export const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = UserSchema.parse(body); // Runtime validation
  // ...
}
```

### Auto-Generation Tools

**next-openapi-gen** (Recommended)
- Scans Next.js route handlers
- Extracts Zod schemas automatically
- Generates OpenAPI 3.0 spec
- **Source:** [next-openapi-gen GitHub](https://github.com/tazo90/next-openapi-gen)

**next-swagger-doc**
- JSDoc-based (older pattern)
- Requires manual annotations
- **Source:** [next-swagger-doc npm](https://www.npmjs.com/package/next-swagger-doc)

**tspec**
- Type-driven generation from TypeScript types
- No runtime dependency
- **Source:** [tspec GitHub](https://github.com/ts-spec/tspec)

**Winner:** next-openapi-gen (Zod integration, App Router support)

---

## 4. Best Practices

### Authentication Documentation
- Document auth header format (`Authorization: Bearer <token>`)
- Include example tokens for testing (non-production)
- List required permissions per endpoint
- **Source:** [Authgear - Next.js API Route Authentication](https://authgear.com/post/nextjs-api-route-authentication)

### Request/Response Examples
- Provide realistic examples (not just schema)
- Show error responses (400, 401, 403, 500)
- Include edge cases (empty arrays, null fields)

### Error Response Documentation
- Standardize error format across endpoints
- Document error codes and meanings
- Include troubleshooting hints

### Rate Limiting & Pagination
- Document limits (requests/minute, page size)
- Show pagination query params (`?page=1&limit=20`)
- Include `Link` header examples

---

## 5. Maintenance Strategy

### Single Source of Truth
```
Code (Zod schemas) → OpenAPI spec → Scalar UI
```
- Schemas live in route handlers
- CI generates OpenAPI spec on commit
- Scalar renders spec at `/api/docs`

### CI/CD Validation
```yaml
# .github/workflows/docs.yml
- name: Generate OpenAPI spec
  run: npx next-openapi-gen
- name: Validate spec
  run: npx @redocly/cli lint openapi.json
```

### Versioning Strategy
- **Internal tool:** No versioning needed (single version)
- **If needed later:** Use `/api/v1/` prefix, maintain separate specs

### Developer Experience
- **Local dev:** `/api/docs` route serves Scalar UI
- **Onboarding:** README links to `/api/docs`
- **Updates:** Zod schema changes auto-reflect in docs

---

## Recommended Implementation

### Phase 1: Add Zod Validation (Week 1)
1. Install: `npm install zod`
2. Define schemas for each endpoint
3. Add runtime validation to route handlers
4. **Benefit:** Immediate type safety + validation

### Phase 2: Generate OpenAPI Spec (Week 1)
1. Install: `npm install -D next-openapi-gen`
2. Configure: `next-openapi-gen.config.js`
3. Run: `npx next-openapi-gen`
4. **Output:** `openapi.json` in project root

### Phase 3: Add Scalar UI (Week 1)
1. Install: `npm install @scalar/nextjs-api-reference`
2. Create: `app/api/docs/route.ts`
3. Serve Scalar at `/api/docs`
4. **Benefit:** Interactive docs for team

### Phase 4: Automate (Week 2)
1. Add pre-commit hook: regenerate spec
2. Add CI check: validate spec
3. Update README: link to `/api/docs`

---

## Example Documentation Structure

```
/api/docs                    # Scalar UI (interactive)
/openapi.json                # Generated spec (machine-readable)
/docs/api-overview.md        # High-level guide (human-written)
  ├── Authentication
  ├── Error Handling
  ├── Common Patterns
  └── Changelog
```

---

## Adoption Risk Assessment

### Zod
- **Maturity:** Stable (v3.x), 30k+ GitHub stars
- **Community:** Large, active maintenance
- **Risk:** Low (industry standard for TS validation)

### Scalar
- **Maturity:** Newer (2023+), growing adoption
- **Community:** Active development, responsive maintainers
- **Risk:** Low-Medium (fallback: Swagger UI drop-in replacement)

### next-openapi-gen
- **Maturity:** Early (2024+), smaller community
- **Risk:** Medium (could write custom generator if abandoned)
- **Mitigation:** OpenAPI spec is standard, tooling is replaceable

---

## Trade-Offs Summary

| Approach | Pros | Cons |
|----------|------|------|
| **Zod + Scalar** | Type-safe, low maintenance, great DX | Requires build step |
| **JSDoc + Swagger** | No dependencies, simple | Manual sync, no runtime validation |
| **Markdown only** | Zero setup | No interactivity, manual updates |
| **Full docs site** | Professional, guides + API | Overkill for internal tool |

---

## Unresolved Questions

1. **Existing validation?** Are there existing Zod schemas or validation logic to leverage?
2. **Auth mechanism?** JWT, session cookies, API keys? (affects docs examples)
3. **Deployment?** Does `/api/docs` need auth protection or is it internal-only?
4. **Team size?** How many developers will use these docs? (affects tool choice)
5. **Future public API?** If yes, consider Mintlify/Docusaurus from start

---

## Sources

- [Next.js Route Handlers Best Practices](https://makerkit.dev/blog/tutorials/nextjs-api-best-practices)
- [APIs You Won't Hate - Top 5 API Docs Tools](https://apisyouwonthate.com/blog/top-5-best-api-docs-tools/)
- [Mintlify - Best API Documentation Tools 2026](https://mintlify.com/blog/top-7-api-documentation-tools-of-2025)
- [Scalar vs SwaggerHub vs Apidog](https://www.apidog.com/blog/scalar-vs-swaggerhub-vs-apidog-api-docs-2/)
- [Dub.co - Zod API Validation](https://dub.co/blog/zod-api-validation)
- [Zod v4 Complete Guide](https://gtc.noqta.tn/en/tutorials/zod-v4-nextjs-schema-validation-forms-apis-2026)
- [next-openapi-gen GitHub](https://github.com/tazo90/next-openapi-gen)
- [tspec GitHub](https://github.com/ts-spec/tspec)
- [Generate Swagger Documentation for Next.js](https://catalins.tech/generate-swagger-documentation-next-js-api/)
- [Authgear - Next.js API Route Authentication](https://authgear.com/post/nextjs-api-route-authentication)
