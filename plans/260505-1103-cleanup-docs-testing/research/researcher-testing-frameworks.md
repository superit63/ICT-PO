# Testing Frameworks Research: Next.js 16.2 + React 19.2 + TypeScript

**Date:** 2026-05-05  
**Context:** ICT-PO project testing stack selection  
**Stack:** Next.js 16.2, React 19.2, TypeScript, Turso/libSQL, shadcn/ui

---

## Recommended Stack

**Unit Testing:** Vitest + React Testing Library  
**E2E Testing:** Playwright  
**Coverage:** Vitest built-in (c8)  
**API Mocking:** MSW (Mock Service Worker)  
**Database:** In-memory SQLite for unit tests, Turso test instance for integration

---

## 1. Unit Testing: Vitest vs Jest

### Winner: Vitest

**Rationale:**
- **Native ESM support** — Jest still struggles with ESM in 2026, requires transform hacks
- **Vite-powered** — Next.js 16 uses Turbopack but Vitest works seamlessly with TS/TSX
- **5-10x faster** cold starts vs Jest (critical for CI/CD)
- **Official Next.js docs recommend Vitest** for App Router projects
- **React 19.2 compatible** — React Testing Library works identically with both

**Trade-offs:**
- Vitest: smaller ecosystem than Jest, but mature enough (v2.x in 2026)
- Jest: larger plugin ecosystem, but ESM pain outweighs benefits

**Adoption Risk:** LOW — 45%+ market share in 2026, active maintenance, backed by Vite team

**Sources:**
- [Next.js Official Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [Vitest + React Testing Library Tutorial](https://www.noqta.tn/en/tutorials/vitest-react-testing-library-nextjs-unit-testing-2026)
- [Jest Alternatives 2026](https://getautonoma.com/blog/jest-alternatives)

---

## 2. E2E Testing: Playwright vs Cypress

### Winner: Playwright

**Rationale:**
- **33M weekly npm downloads** vs Cypress (5x gap in 2026)
- **Multi-tab/cross-origin support** — Cypress still limited to single-origin
- **Native API testing** — built-in HTTP client, no need for cy.request workarounds
- **Better CI/CD integration** — 2.5x cheaper CI costs (parallel execution model)
- **Next.js App Router support** — handles streaming SSR, Server Components correctly
- **94% retention rate** among QA professionals

**Trade-offs:**
- Playwright: steeper learning curve initially
- Cypress: better DX for simple flows, but architectural limits hit fast

**Adoption Risk:** LOW — industry standard for modern web apps, Microsoft-backed

**Sources:**
- [Playwright vs Cypress 2026](https://tech-insider.org/cypress-vs-playwright-2026/)
- [E2E Testing Real Projects](https://navanathjadhav.medium.com/end-to-end-testing-playwright-vs-cypress-in-real-projects-07b3790e5ab3)
- [Commerce Storefronts Testing](https://contracollective.com/blog/playwright-vs-cypress-e2e-testing-commerce-storefronts-2026)

---

## 3. Testing Best Practices

### Server Components Testing

**Key Insight:** Vitest does NOT support async Server Components (React 19 limitation)

**Strategy:**
- **Unit test logic separately** — extract data fetching into testable functions
- **E2E test Server Components** — Playwright renders full page, validates output
- **Avoid testing RSC internals** — test contracts (props in, HTML out), not implementation

**Example Pattern:**
```typescript
// ❌ Cannot unit test this directly
export default async function ServerComponent() {
  const data = await fetch('/api/data')
  return <div>{data.title}</div>
}

// ✅ Extract testable logic
export async function fetchData() { /* ... */ }
export function DataDisplay({ data }) { /* ... */ }
```

### API Route Testing

**Pattern:** Use Vitest + node-mocks-http or Playwright API testing

```typescript
// Vitest unit test
import { GET } from '@/app/api/users/route'
import { NextRequest } from 'next/server'

test('GET /api/users returns 200', async () => {
  const req = new NextRequest('http://localhost/api/users')
  const res = await GET(req)
  expect(res.status).toBe(200)
})
```

### Database Mocking (Turso/libSQL)

**Strategy:**
- **Unit tests:** Use in-memory SQLite (`:memory:`) — libSQL is SQLite-compatible
- **Integration tests:** Spin up Turso test database (ephemeral instance)
- **E2E tests:** Use dedicated test database, reset between runs

**Turso-specific:**
- libSQL client supports local file URLs: `file:test.db`
- No official mocking library — use SQLite's in-memory mode
- For complex queries, consider test fixtures over mocks

**Sources:**
- [Next.js Server Components Testing](https://www.iamraghuveer.com/posts/nextjs-testing-strategies/)
- [Next.js Testing Guide 2026](https://www.testsprite.com/blog/how-to-test-a-next-js-application-a-complete-guide-for-2026)

---

## 4. Coverage Tools

### Recommendation: Vitest Built-in (c8)

**Setup:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.config.*', '**/types/**']
    }
  }
})
```

**Thresholds:**
- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

**Trade-offs:**
- v8 (c8): faster, native Node.js coverage
- istanbul: more accurate branch coverage, slower

---

## 5. Testing Utilities

### React Testing Library

**Version:** 16.x (React 19 compatible as of 2026)

**Key APIs:**
- `render()` — mount components
- `screen.getByRole()` — accessibility-first queries
- `userEvent` — simulate interactions
- `waitFor()` — async assertions

**shadcn/ui Testing:**
- Components are Radix UI primitives — test by role, not implementation
- Example: `screen.getByRole('button', { name: /submit/i })`

### MSW (Mock Service Worker)

**Use Case:** Mock API calls in unit/integration tests

**Setup:**
```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([{ id: 1, name: 'Test' }])
  })
]
```

**Integration:** Works with both Vitest and Playwright

---

## Setup Steps Overview

### 1. Install Dependencies
```bash
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @playwright/test
npm install -D msw
```

### 2. Configure Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts']
  }
})
```

### 3. Configure Playwright
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    port: 3000
  }
})
```

### 4. GitHub Actions Integration
```yaml
- name: Run unit tests
  run: npm run test:unit
- name: Run E2E tests
  run: npx playwright test
```

---

## Potential Gotchas (Next.js 16.2)

### 1. Server Components Cannot Be Unit Tested
- **Workaround:** Extract logic, test separately
- **Alternative:** E2E test full page render

### 2. Turbopack vs Vite
- Next.js 16 uses Turbopack, Vitest uses Vite
- **Impact:** Minimal — Vitest compiles tests independently
- **Watch out:** Path aliases must match in both configs

### 3. React 19 Breaking Changes
- `act()` warnings more strict
- `useTransition` behavior changed
- **Fix:** Update to React Testing Library 16.x

### 4. Turso Remote Connections in Tests
- **Issue:** Network latency in CI/CD
- **Fix:** Use local libSQL file or in-memory SQLite for unit tests

### 5. MSW + App Router
- **Issue:** MSW intercepts fetch in Server Components (Node.js runtime)
- **Fix:** Use MSW server-side handlers, not browser handlers

---

## Example Test Patterns

### Client Component Test
```typescript
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Button from '@/components/ui/button'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button')).toHaveTextContent('Click me')
})
```

### API Route Test
```typescript
import { GET } from '@/app/api/users/route'
import { expect, test } from 'vitest'

test('GET /api/users returns users', async () => {
  const req = new Request('http://localhost/api/users')
  const res = await GET(req)
  const data = await res.json()
  expect(data).toHaveLength(3)
})
```

### E2E Test (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

---

## Sources

- [Next.js Vitest Documentation](https://nextjs.org/docs/app/guides/testing/vitest)
- [Playwright vs Cypress 2026 Comparison](https://tech-insider.org/cypress-vs-playwright-2026/)
- [Next.js Testing Strategies](https://www.iamraghuveer.com/posts/nextjs-testing-strategies/)
- [Vitest GitHub Repository](https://github.com/vitest-dev/vitest)
- [Testing Next.js Applications 2026](https://www.testsprite.com/blog/how-to-test-a-next-js-application-a-complete-guide-for-2026)

---

## Unresolved Questions

1. **Turso test database provisioning** — Does Turso offer ephemeral test instances via API?
2. **Server Actions testing** — Best pattern for testing form actions with progressive enhancement?
3. **Parallel test execution** — Vitest workspace config for monorepo structure?
4. **Visual regression testing** — Should we add Playwright visual comparisons for UI components?
