# Phase 03: Testing Infrastructure

## Parallelization Info

**Can run with:** Phase 1, Phase 2  
**Blocks:** Phase 4, Phase 5  
**Blocked by:** None  
**Estimated time:** 1 hour

## File Ownership

**Exclusive write access:**
- `sale-stock-po-app/vitest.config.ts` (create)
- `sale-stock-po-app/vitest.setup.ts` (create)
- `sale-stock-po-app/playwright.config.ts` (create)
- `sale-stock-po-app/package.json` (modify — add test scripts only)
- `sale-stock-po-app/__tests__/.gitkeep` (create directory)
- `sale-stock-po-app/e2e/.gitkeep` (create directory)
- `.github/workflows/test.yml` (create, if .github exists)

**Read access:**
- `sale-stock-po-app/tsconfig.json` (path aliases)
- `sale-stock-po-app/next.config.ts` (port, env)
- Research report: `plans/260505-1103-cleanup-docs-testing/research/researcher-testing-frameworks.md`

## Conflict Prevention

**package.json modification:**
- Only adds scripts section entries
- No dependency changes (npm install runs after)
- Low conflict risk with Phase 1 (no package.json changes) and Phase 2 (no package.json changes)

**New directories:**
- `__tests__/` owned by Phase 4
- `e2e/` owned by Phase 5
- No overlap

## Context

**From testing frameworks research:**
- Recommended: Vitest + React Testing Library + Playwright
- Vitest: 5-10x faster than Jest, native ESM, Next.js 16 compatible
- Playwright: 33M weekly downloads, multi-tab support, native API testing
- React Testing Library 16.x: React 19.2 compatible
- MSW: Mock Service Worker for API mocking

**Current state:**
- No test infrastructure
- No test files
- No CI/CD test pipeline
- TypeScript strict mode (leverage for type safety)

**Key considerations:**
- Server Components cannot be unit tested (extract logic)
- Turso/libSQL: Use in-memory SQLite for unit tests
- Next.js 16 uses Turbopack (Vitest uses Vite — no conflict)

## Requirements

### Functional
1. Install Vitest + React Testing Library
2. Install Playwright
3. Configure Vitest for Next.js App Router
4. Configure Playwright for E2E tests
5. Add test scripts to package.json
6. Create test directory structure
7. Add CI/CD workflow (optional)

### Non-functional
- Fast test execution (parallel by default)
- TypeScript support
- Path alias support (@/ imports)
- Coverage reporting
- CI/CD ready

## Architecture

**Test Directory Structure:**
```
sale-stock-po-app/
├── __tests__/              # Unit tests (Vitest)
│   ├── lib/
│   │   ├── calculations.test.ts
│   │   ├── utils.test.ts
│   │   └── session.test.ts
│   └── components/
│       └── ui/
│           └── button.test.tsx
├── e2e/                    # E2E tests (Playwright)
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   └── master-data.spec.ts
├── vitest.config.ts        # Vitest configuration
├── vitest.setup.ts         # Test setup (jsdom, matchers)
└── playwright.config.ts    # Playwright configuration
```

**Test Scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Related Code Files

**To create:**
- `sale-stock-po-app/vitest.config.ts`
- `sale-stock-po-app/vitest.setup.ts`
- `sale-stock-po-app/playwright.config.ts`
- `sale-stock-po-app/__tests__/.gitkeep`
- `sale-stock-po-app/e2e/.gitkeep`
- `.github/workflows/test.yml` (if .github exists)

**To modify:**
- `sale-stock-po-app/package.json` (scripts only)

## Implementation Steps

### 1. Install Vitest Dependencies
```bash
cd sale-stock-po-app
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitest/ui @vitest/coverage-v8
npm install -D jsdom
```

**Packages:**
- `vitest` — Test runner
- `@vitejs/plugin-react` — React support
- `@testing-library/react` — Component testing utilities
- `@testing-library/jest-dom` — DOM matchers
- `@testing-library/user-event` — User interaction simulation
- `@vitest/ui` — Web UI for test results
- `@vitest/coverage-v8` — Coverage reporting
- `jsdom` — DOM environment for tests

### 2. Install Playwright
```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Note:** Only install Chromium for faster CI (can add Firefox/Safari later)

### 3. Create Vitest Configuration
```typescript
// sale-stock-po-app/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        '**/*.config.*',
        '**/types/**',
        'e2e/**',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**Key features:**
- jsdom environment (browser-like)
- Path alias support (@/ imports)
- Coverage thresholds (80/75/80/80)
- Excludes config files and e2e tests

### 4. Create Vitest Setup File
```typescript
// sale-stock-po-app/vitest.setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
```

**Purpose:**
- Import jest-dom matchers (toBeInTheDocument, etc.)
- Auto-cleanup after each test
- Mock Next.js navigation hooks

### 5. Create Playwright Configuration
```typescript
// sale-stock-po-app/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

**Key features:**
- Auto-start dev server
- Retry on CI (flaky test mitigation)
- Screenshots on failure
- Trace on first retry (debugging)
- Chromium only (fast CI)

### 6. Add Test Scripts to package.json
```bash
# Use npm pkg set to avoid manual JSON editing
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:ui="vitest --ui"
npm pkg set scripts.test:coverage="vitest --coverage"
npm pkg set scripts.test:e2e="playwright test"
npm pkg set scripts.test:e2e:ui="playwright test --ui"
npm pkg set scripts.test:e2e:debug="playwright test --debug"
```

**Alternative (manual edit):**
Add to `package.json` scripts section:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### 7. Create Test Directories
```bash
mkdir -p sale-stock-po-app/__tests__/lib
mkdir -p sale-stock-po-app/__tests__/components/ui
mkdir -p sale-stock-po-app/e2e
touch sale-stock-po-app/__tests__/.gitkeep
touch sale-stock-po-app/e2e/.gitkeep
```

### 8. Create CI/CD Workflow (Optional)
```bash
# Check if .github exists
if [ -d .github ]; then
  mkdir -p .github/workflows
  cat > .github/workflows/test.yml << 'EOF'
name: Tests

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
          cache-dependency-path: sale-stock-po-app/package-lock.json
      - name: Install dependencies
        working-directory: sale-stock-po-app
        run: npm ci
      - name: Run unit tests
        working-directory: sale-stock-po-app
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: sale-stock-po-app/coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
          cache-dependency-path: sale-stock-po-app/package-lock.json
      - name: Install dependencies
        working-directory: sale-stock-po-app
        run: npm ci
      - name: Install Playwright
        working-directory: sale-stock-po-app
        run: npx playwright install chromium --with-deps
      - name: Run E2E tests
        working-directory: sale-stock-po-app
        run: npm run test:e2e
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_TEST_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_TEST_AUTH_TOKEN }}
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: sale-stock-po-app/playwright-report/
EOF
fi
```

**Note:** Requires GitHub secrets for Turso test database

### 9. Verify Installation
```bash
cd sale-stock-po-app

# Check Vitest
npx vitest --version

# Check Playwright
npx playwright --version

# Check test scripts
npm run test -- --help
npm run test:e2e -- --help
```

## Todo List

- [x] Install Vitest dependencies (8 packages)
- [x] Install Playwright
- [x] Create vitest.config.ts
- [x] Create vitest.setup.ts
- [x] Create playwright.config.ts
- [x] Add test scripts to package.json
- [x] Create __tests__/ directory structure
- [x] Create e2e/ directory structure
- [x] Create CI/CD workflow (if .github exists)
- [x] Verify Vitest runs (npx vitest --version)
- [x] Verify Playwright runs (npx playwright --version)
- [ ] Commit changes (pending user approval)

## Success Criteria

**Completion checklist:**
1. All dependencies installed (check package.json)
2. `vitest.config.ts` exists and valid
3. `vitest.setup.ts` exists and valid
4. `playwright.config.ts` exists and valid
5. Test scripts added to package.json (6 scripts)
6. `__tests__/` directory exists
7. `e2e/` directory exists
8. `npx vitest --version` succeeds
9. `npx playwright --version` succeeds
10. `npm run test` runs (no tests yet, should pass)
11. `npm run test:e2e` runs (no tests yet, should pass)
12. CI/CD workflow created (if applicable)

**Validation:**
```bash
# Check dependencies
grep -q "vitest" sale-stock-po-app/package.json && echo "✓ Vitest installed"
grep -q "@playwright/test" sale-stock-po-app/package.json && echo "✓ Playwright installed"

# Check config files
test -f sale-stock-po-app/vitest.config.ts && echo "✓ Vitest config exists"
test -f sale-stock-po-app/playwright.config.ts && echo "✓ Playwright config exists"

# Check directories
test -d sale-stock-po-app/__tests__ && echo "✓ Unit test directory exists"
test -d sale-stock-po-app/e2e && echo "✓ E2E test directory exists"

# Check scripts
npm run --prefix sale-stock-po-app test -- --version
npm run --prefix sale-stock-po-app test:e2e -- --version
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dependency conflicts | Low | Medium | Use exact versions from research |
| Path alias not working | Low | Medium | Test with simple import in vitest.setup.ts |
| Playwright install fails | Low | High | Use --with-deps flag, check system requirements |
| CI/CD secrets missing | High | Low | Document in deployment guide |
| Coverage thresholds too strict | Medium | Low | Start with 80/75/80/80, adjust later |

## Security Considerations

**Test Environment:**
- Use separate Turso test database (not production)
- Store credentials in GitHub secrets (not .env)
- Reset test database between runs
- No real user data in tests

**CI/CD:**
- Limit workflow permissions (read-only by default)
- Use official GitHub actions only
- Pin action versions (@v4, not @latest)
- Review Playwright trace files (may contain sensitive data)

## Next Steps

After completion:
1. Phase 4 can start (unit tests)
2. Phase 5 can start (E2E tests)
3. Document test commands in README (Phase 6)
4. Set up Turso test database
5. Add GitHub secrets for CI/CD
