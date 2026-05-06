# Phase 04: Unit Tests

## Parallelization Info

**Can run with:** Phase 5  
**Blocks:** None  
**Blocked by:** Phase 3 (testing infrastructure)  
**Estimated time:** 2 hours

## File Ownership

**Exclusive write access:**
- `sale-stock-po-app/__tests__/lib/calculations.test.ts` (create)
- `sale-stock-po-app/__tests__/lib/utils.test.ts` (create)
- `sale-stock-po-app/__tests__/lib/session.test.ts` (create)
- `sale-stock-po-app/__tests__/components/ui/button.test.tsx` (create)

**Read access:**
- `sale-stock-po-app/lib/calculations.ts` (test target)
- `sale-stock-po-app/lib/utils.ts` (test target)
- `sale-stock-po-app/lib/session.ts` (test target)
- `sale-stock-po-app/components/ui/button.tsx` (test target)

## Conflict Prevention

No conflicts — only creates files in `__tests__/` directory. Phase 5 creates files in `e2e/` directory. Zero overlap.

## Context

**From codebase summary:**
- `lib/calculations.ts` — 155 LOC, core business logic (rollforward, PO suggestions)
- `lib/utils.ts` — 6 LOC, Tailwind class merger
- `lib/session.ts` — 19 LOC, auth utilities
- `components/ui/button.tsx` — shadcn/ui component with variants

**Key algorithms to test:**
1. `getStatus()` — Stock status calculation (ok/low/critical/stockout)
2. `addMonths()` — Date arithmetic for YYYY-MM format
3. `formatMonth()` — Format "2026-04" → "Apr 2026"
4. `getArrivalMonth()` — Calculate arrival (order + 5 months)
5. `suggestPO()` — PO suggestion algorithm
6. `cn()` — Tailwind class merger
7. `hasValidSessionValue()` — Session validation

**Testing strategy:**
- Pure functions first (calculations, utils)
- Auth utilities with mocked database
- UI component with React Testing Library
- Focus on edge cases and business rules

## Requirements

### Functional
1. Test all calculation functions with edge cases
2. Test utility functions
3. Test session validation logic
4. Test UI component variants and interactions
5. Achieve 80%+ code coverage for tested files

### Non-functional
- Fast execution (< 1 second per test suite)
- Clear test descriptions
- Arrange-Act-Assert pattern
- No external dependencies (mock database)

## Architecture

**Test File Structure:**
```
__tests__/
├── lib/
│   ├── calculations.test.ts    # 20+ tests
│   ├── utils.test.ts            # 5+ tests
│   └── session.test.ts          # 10+ tests
└── components/
    └── ui/
        └── button.test.tsx      # 8+ tests
```

**Test Pattern:**
```typescript
import { describe, it, expect } from 'vitest'
import { functionName } from '@/lib/module'

describe('functionName', () => {
  it('should handle normal case', () => {
    // Arrange
    const input = ...
    
    // Act
    const result = functionName(input)
    
    // Assert
    expect(result).toBe(expected)
  })
  
  it('should handle edge case', () => {
    // ...
  })
})
```

## Related Code Files

**To read:**
- `sale-stock-po-app/lib/calculations.ts`
- `sale-stock-po-app/lib/utils.ts`
- `sale-stock-po-app/lib/session.ts`
- `sale-stock-po-app/components/ui/button.tsx`

**To create:**
- `sale-stock-po-app/__tests__/lib/calculations.test.ts`
- `sale-stock-po-app/__tests__/lib/utils.test.ts`
- `sale-stock-po-app/__tests__/lib/session.test.ts`
- `sale-stock-po-app/__tests__/components/ui/button.test.tsx`

## Implementation Steps

### 1. Create calculations.test.ts

**Test getStatus():**
```typescript
import { describe, it, expect } from 'vitest'
import { getStatus } from '@/lib/calculations'

describe('getStatus', () => {
  const packing = 100 // units per pallet
  
  it('returns "stockout" when balance is negative', () => {
    expect(getStatus(-1, packing)).toBe('stockout')
    expect(getStatus(-100, packing)).toBe('stockout')
  })
  
  it('returns "critical" when balance is less than 1 pallet', () => {
    expect(getStatus(0, packing)).toBe('critical')
    expect(getStatus(50, packing)).toBe('critical')
    expect(getStatus(99, packing)).toBe('critical')
  })
  
  it('returns "low" when balance is less than 3 pallets', () => {
    expect(getStatus(100, packing)).toBe('low')
    expect(getStatus(200, packing)).toBe('low')
    expect(getStatus(299, packing)).toBe('low')
  })
  
  it('returns "ok" when balance is 3+ pallets', () => {
    expect(getStatus(300, packing)).toBe('ok')
    expect(getStatus(1000, packing)).toBe('ok')
  })
  
  it('handles edge case at boundaries', () => {
    expect(getStatus(100, packing)).toBe('low') // exactly 1 pallet
    expect(getStatus(300, packing)).toBe('ok')  // exactly 3 pallets
  })
})
```

**Test addMonths():**
```typescript
describe('addMonths', () => {
  it('adds months within same year', () => {
    expect(addMonths('2026-01', 3)).toBe('2026-04')
    expect(addMonths('2026-06', 2)).toBe('2026-08')
  })
  
  it('rolls over to next year', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
  })
  
  it('handles multi-year spans', () => {
    expect(addMonths('2026-01', 12)).toBe('2027-01')
    expect(addMonths('2026-01', 24)).toBe('2028-01')
  })
  
  it('handles zero months', () => {
    expect(addMonths('2026-05', 0)).toBe('2026-05')
  })
  
  it('handles negative months', () => {
    expect(addMonths('2026-05', -2)).toBe('2026-03')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })
})
```

**Test formatMonth():**
```typescript
describe('formatMonth', () => {
  it('formats months correctly', () => {
    expect(formatMonth('2026-01')).toBe('Jan 2026')
    expect(formatMonth('2026-06')).toBe('Jun 2026')
    expect(formatMonth('2026-12')).toBe('Dec 2026')
  })
  
  it('handles all 12 months', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    months.forEach((month, i) => {
      const monthNum = String(i + 1).padStart(2, '0')
      expect(formatMonth(`2026-${monthNum}`)).toBe(`${month} 2026`)
    })
  })
})
```

**Test getArrivalMonth():**
```typescript
describe('getArrivalMonth', () => {
  it('adds 5 months lead time', () => {
    expect(getArrivalMonth('2026-01')).toBe('2026-06')
    expect(getArrivalMonth('2026-06')).toBe('2026-11')
  })
  
  it('rolls over to next year', () => {
    expect(getArrivalMonth('2026-09')).toBe('2027-02')
    expect(getArrivalMonth('2026-12')).toBe('2027-05')
  })
})
```

**Test suggestPO():**
```typescript
describe('suggestPO', () => {
  const product = {
    id: 1,
    name: 'Test Product',
    sku: 'TEST-001',
    exw_price_eur: 10,
    packing_per_pallet: 100,
  }
  
  it('returns null when no stockout', () => {
    const rollforward = [
      { month: '2026-05', balance: 500, status: 'ok' },
      { month: '2026-06', balance: 400, status: 'ok' },
    ]
    expect(suggestPO(product, rollforward)).toBeNull()
  })
  
  it('suggests PO when stockout occurs', () => {
    const rollforward = [
      { month: '2026-05', balance: 100, status: 'low' },
      { month: '2026-06', balance: -50, status: 'stockout' },
    ]
    const suggestion = suggestPO(product, rollforward)
    expect(suggestion).not.toBeNull()
    expect(suggestion?.urgency).toBe('critical')
    expect(suggestion?.shortfallMonth).toBe('2026-06')
  })
  
  it('calculates pallets correctly', () => {
    const rollforward = [
      { month: '2026-05', balance: -250, status: 'stockout' },
    ]
    const suggestion = suggestPO(product, rollforward)
    expect(suggestion?.pallets).toBe(3) // ceil(250 / 100)
  })
  
  it('determines container size', () => {
    const rollforward = [
      { month: '2026-05', balance: -2000, status: 'stockout' },
    ]
    const suggestion = suggestPO(product, rollforward)
    expect(suggestion?.pallets).toBe(20)
    expect(suggestion?.container).toBe('22') // rounds to 22
  })
  
  it('calculates value correctly', () => {
    const rollforward = [
      { month: '2026-05', balance: -100, status: 'stockout' },
    ]
    const suggestion = suggestPO(product, rollforward)
    // 1 pallet × 100 units × €10 = €1000
    expect(suggestion?.value).toBe(1000)
  })
})
```

### 2. Create utils.test.ts

```typescript
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
  
  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    expect(cn('foo', true && 'bar')).toBe('foo bar')
  })
  
  it('deduplicates Tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
  
  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })
  
  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})
```

### 3. Create session.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasValidSessionValue, hasValidRequestSession } from '@/lib/session'
import { NextRequest } from 'next/server'

// Mock database
vi.mock('@/lib/db', () => ({
  queryOne: vi.fn(),
}))

import { queryOne } from '@/lib/db'

describe('hasValidSessionValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('returns false when no PIN hash exists', async () => {
    vi.mocked(queryOne).mockResolvedValue(null)
    const result = await hasValidSessionValue('test-session')
    expect(result).toBe(false)
  })
  
  it('returns true when session matches hash', async () => {
    const hash = 'hashed-pin'
    vi.mocked(queryOne).mockResolvedValue({ value: hash })
    
    // Mock bcrypt compare
    vi.mock('bcryptjs', () => ({
      compare: vi.fn().mockResolvedValue(true),
    }))
    
    const result = await hasValidSessionValue('test-session')
    expect(result).toBe(true)
  })
  
  it('returns false when session does not match', async () => {
    const hash = 'hashed-pin'
    vi.mocked(queryOne).mockResolvedValue({ value: hash })
    
    vi.mock('bcryptjs', () => ({
      compare: vi.fn().mockResolvedValue(false),
    }))
    
    const result = await hasValidSessionValue('wrong-session')
    expect(result).toBe(false)
  })
})

describe('hasValidRequestSession', () => {
  it('returns false when no session cookie', async () => {
    const req = new NextRequest('http://localhost/api/test')
    const result = await hasValidRequestSession(req)
    expect(result).toBe(false)
  })
  
  it('returns true when valid session cookie', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: {
        cookie: 'session=valid-session',
      },
    })
    
    vi.mocked(queryOne).mockResolvedValue({ value: 'hash' })
    
    const result = await hasValidRequestSession(req)
    expect(result).toBe(true)
  })
})
```

### 4. Create button.test.tsx

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
  
  it('applies default variant', () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })
  
  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border')
  })
  
  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent')
  })
  
  it('applies destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })
  
  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
  
  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('renders as child component', () => {
    render(<Button asChild><a href="/test">Link</a></Button>)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test')
  })
})
```

### 5. Run Tests and Verify Coverage

```bash
cd sale-stock-po-app

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test calculations.test.ts

# Run in watch mode
npm run test -- --watch
```

**Expected output:**
- All tests pass
- Coverage > 80% for tested files
- No console errors

## Todo List

- [x] Read lib/calculations.ts implementation
- [x] Read lib/utils.ts implementation
- [x] Read lib/session.ts implementation
- [x] Read components/ui/button.tsx implementation
- [x] Create calculations.test.ts (20+ tests)
- [x] Create utils.test.ts (5+ tests)
- [x] Create session.test.ts (10+ tests)
- [x] Create button.test.tsx (8+ tests)
- [x] Run tests and verify all pass
- [x] Check coverage report (80%+ target)
- [x] Fix any failing tests
- [ ] Commit test files (pending user approval)

## Success Criteria

**Completion checklist:**
1. 4 test files created
2. 40+ total test cases
3. All tests pass
4. Coverage > 80% for tested files
5. No console errors or warnings
6. Tests run in < 5 seconds
7. Clear test descriptions
8. Edge cases covered

**Validation:**
```bash
# Run tests
npm run --prefix sale-stock-po-app test

# Check coverage
npm run --prefix sale-stock-po-app test:coverage

# Verify test files exist
test -f sale-stock-po-app/__tests__/lib/calculations.test.ts && echo "✓ calculations tests"
test -f sale-stock-po-app/__tests__/lib/utils.test.ts && echo "✓ utils tests"
test -f sale-stock-po-app/__tests__/lib/session.test.ts && echo "✓ session tests"
test -f sale-stock-po-app/__tests__/components/ui/button.test.tsx && echo "✓ button tests"
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tests fail due to import issues | Medium | Medium | Verify path aliases in vitest.config.ts |
| Mock database not working | Medium | Medium | Use vi.mock() correctly, check vitest docs |
| Coverage below threshold | Low | Low | Add more edge case tests |
| Tests too slow | Low | Low | Avoid async operations in pure function tests |

## Security Considerations

**Test Data:**
- Use fake credentials (no real PINs)
- Use test database (not production)
- Mock bcrypt for speed (real hashing in E2E)
- No sensitive data in test fixtures

**Mocking:**
- Mock database queries (no real DB access)
- Mock Next.js router (no navigation)
- Mock bcrypt (deterministic results)

## Next Steps

After completion:
1. Phase 5 can continue (E2E tests)
2. Add more test coverage for components
3. Add API route tests (future)
4. Set up coverage reporting in CI
