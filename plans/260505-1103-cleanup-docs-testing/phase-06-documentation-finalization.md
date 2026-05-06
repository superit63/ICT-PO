# Phase 06: Documentation Finalization

## Parallelization Info

**Can run with:** None  
**Blocks:** None  
**Blocked by:** Phase 1, 2, 3, 4, 5 (all phases)  
**Estimated time:** 30 minutes

## File Ownership

**Exclusive write access:**
- `docs/testing-strategy.md` (create)
- `docs/contributing.md` (create)
- `README.md` (modify — append only)

**Read access:**
- `sale-stock-po-app/vitest.config.ts` (test config)
- `sale-stock-po-app/playwright.config.ts` (E2E config)
- `sale-stock-po-app/__tests__/` (unit tests)
- `sale-stock-po-app/e2e/` (E2E tests)
- `docs/api-reference.md` (Phase 2 output)
- `docs/code-standards.md` (existing standards)

## Conflict Prevention

Low risk — only appends to README.md, creates new docs. All other phases complete before this runs.

## Context

**From previous phases:**
- Phase 1: Cleanup complete, .env.example created
- Phase 2: API reference documented (15 endpoints)
- Phase 3: Test infrastructure set up (Vitest + Playwright)
- Phase 4: Unit tests written (40+ tests)
- Phase 5: E2E tests written (20+ tests)

**Documentation gaps to fill:**
- Testing strategy (how to run tests, coverage goals)
- Contributing guidelines (how to contribute code)
- README updates (link to new docs)

## Requirements

### Functional
1. Document testing strategy and best practices
2. Create contributing guidelines
3. Update README with new documentation links
4. Ensure all docs are discoverable

### Non-functional
- Clear, concise writing
- Consistent formatting
- Easy to navigate
- Beginner-friendly

## Architecture

**Documentation Structure:**
```
docs/
├── api-reference.md          # Phase 2 (existing)
├── testing-strategy.md       # New
├── contributing.md           # New
├── code-standards.md         # Existing
├── deployment-guide.md       # Existing
└── ...

README.md                     # Updated with links
```

**Testing Strategy Sections:**
- Overview
- Test types (unit, E2E)
- Running tests
- Writing tests
- Coverage goals
- CI/CD integration

**Contributing Guidelines Sections:**
- Getting started
- Development workflow
- Code standards
- Testing requirements
- Commit conventions
- Pull request process

## Related Code Files

**To read:**
- `sale-stock-po-app/vitest.config.ts`
- `sale-stock-po-app/playwright.config.ts`
- `sale-stock-po-app/package.json` (test scripts)
- `docs/code-standards.md`
- `docs/api-reference.md`

**To create:**
- `docs/testing-strategy.md`
- `docs/contributing.md`

**To modify:**
- `README.md` (append documentation section)

## Implementation Steps

### 1. Create testing-strategy.md

```markdown
# Testing Strategy

## Overview

ICT-PO uses a multi-layered testing approach:
- **Unit tests** (Vitest + React Testing Library) — Business logic, utilities, components
- **E2E tests** (Playwright) — User flows, integration, critical paths
- **Coverage goals** — 80% statements, 75% branches, 80% functions, 80% lines

## Test Types

### Unit Tests
**Location:** `sale-stock-po-app/__tests__/`  
**Framework:** Vitest + React Testing Library  
**Purpose:** Test pure functions, utilities, isolated components

**What to unit test:**
- Business logic (calculations, validations)
- Utility functions (formatters, helpers)
- UI components (rendering, interactions)
- Session utilities (auth checks)

**What NOT to unit test:**
- Server Components (test with E2E instead)
- API routes (test with E2E or integration tests)
- Database queries (mock in unit tests)

### E2E Tests
**Location:** `sale-stock-po-app/e2e/`  
**Framework:** Playwright  
**Purpose:** Test complete user flows, integration points

**What to E2E test:**
- Auth flows (setup, login, logout)
- CRUD operations (create, read, update, delete)
- Navigation between pages
- Form submissions and validations
- Error handling

## Running Tests

### Unit Tests
```bash
cd sale-stock-po-app

# Run all unit tests
npm run test

# Run with UI (interactive)
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test calculations.test.ts

# Run in watch mode
npm run test -- --watch
```

### E2E Tests
```bash
cd sale-stock-po-app

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run with debug mode
npm run test:e2e:debug

# Run specific test file
npm run test:e2e auth.spec.ts

# Run headed (see browser)
npm run test:e2e -- --headed
```

## Writing Tests

### Unit Test Pattern
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
    // Test edge cases
  })
})
```

### E2E Test Pattern
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup (login, navigate, etc.)
  })
  
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/path')
    
    // Interact
    await page.fill('input[name="field"]', 'value')
    await page.click('button[type="submit"]')
    
    // Assert
    await expect(page).toHaveURL('/expected')
    await expect(page.locator('text=Success')).toBeVisible()
  })
})
```

## Coverage Goals

**Thresholds:**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**Priority files:**
- `lib/calculations.ts` — 100% (critical business logic)
- `lib/session.ts` — 90%+ (security-critical)
- `lib/utils.ts` — 80%+
- UI components — 70%+ (focus on interactions)

**Excluded from coverage:**
- Config files (`*.config.ts`)
- Type definitions (`types/**`)
- E2E tests (`e2e/**`)
- Next.js generated files (`.next/`)

## CI/CD Integration

**GitHub Actions workflow:**
- Run unit tests on every push
- Run E2E tests on every push
- Upload coverage reports to Codecov
- Fail build if tests fail or coverage drops

**Test database:**
- Use separate Turso test database
- Store credentials in GitHub secrets
- Reset database before each E2E run

## Best Practices

### Unit Tests
- Test one thing per test
- Use descriptive test names
- Test edge cases and error paths
- Mock external dependencies
- Keep tests fast (< 1 second each)

### E2E Tests
- Use test helpers for common actions
- Reset database before each test
- Use data-testid for stable selectors
- Avoid hardcoded waits (use waitForURL, waitForSelector)
- Test happy path + critical error paths

### Test Data
- Use realistic but fake data
- Use test-specific prefixes (e.g., "Test Product E2E")
- Never use production data
- Reset test database between runs

## Troubleshooting

### Unit Tests Failing
- Check path aliases in `vitest.config.ts`
- Verify mocks are set up correctly
- Check for async/await issues
- Run with `--reporter=verbose` for details

### E2E Tests Flaky
- Add explicit waits (`waitForURL`, `waitForSelector`)
- Increase timeout in `playwright.config.ts`
- Check for race conditions
- Use retry logic (2 retries on CI)

### Coverage Too Low
- Add tests for untested files
- Test edge cases
- Remove dead code
- Check coverage report: `npm run test:coverage`

## Future Enhancements

- Visual regression testing (Playwright screenshots)
- API route integration tests
- Performance testing (load times, bundle size)
- Accessibility testing (axe-core)
- Mutation testing (Stryker)
```

### 2. Create contributing.md

```markdown
# Contributing Guidelines

## Getting Started

### Prerequisites
- Node.js 22.x
- npm 10.x
- Git
- Turso account (for database)

### Setup
1. Clone repository
2. Install dependencies: `cd sale-stock-po-app && npm install`
3. Copy `.env.local.example` to `.env.local`
4. Add Turso credentials to `.env.local`
5. Run dev server: `npm run dev`
6. Open http://localhost:3000

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow code standards in `docs/code-standards.md`
- Write tests for new features
- Update documentation if needed

### 3. Run Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### 4. Commit Changes
Use conventional commit format:
```bash
git commit -m "feat: add new feature"
git commit -m "fix: correct bug in calculation"
git commit -m "docs: update API reference"
```

**Commit types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Build process, dependencies

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Create pull request on GitHub with:
- Clear description of changes
- Link to related issues
- Screenshots (if UI changes)
- Test results

## Code Standards

### File Naming
- Components: PascalCase (`ProductsManager.tsx`)
- Utilities: kebab-case (`master-data-sheet.ts`)
- Next.js: conventions (`page.tsx`, `route.ts`, `layout.tsx`)

### TypeScript
- Use strict mode (enforced)
- Define interfaces for data structures
- Use type aliases for domain concepts
- Avoid `any` type

### React Components
- Use "use client" for interactive components
- Server Components for static content
- Use shadcn/ui components
- Follow accessibility standards

### Database Queries
- ALWAYS use parameterized queries
- Use `queryAll<T>()` for multiple rows
- Use `queryOne<T>()` for single row
- Use `executeSql()` for no return value

### API Routes
- Check auth on all protected routes
- Use try-catch for error handling
- Return proper HTTP status codes
- Validate request bodies

See `docs/code-standards.md` for complete standards.

## Testing Requirements

### New Features
- Write unit tests for business logic
- Write E2E tests for user flows
- Achieve 80%+ coverage for new code
- All tests must pass before merge

### Bug Fixes
- Write test that reproduces bug
- Fix bug
- Verify test passes
- Add regression test

### Refactoring
- Maintain or improve test coverage
- All existing tests must pass
- No behavior changes

## Pull Request Process

### Before Submitting
- [ ] All tests pass
- [ ] Coverage meets threshold (80%+)
- [ ] Code follows standards
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No console errors or warnings

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

### Review Process
1. Automated checks run (tests, linting)
2. Code review by maintainer
3. Address feedback
4. Approval and merge

## Code Review Guidelines

### As Reviewer
- Check code quality and standards
- Verify tests are comprehensive
- Test locally if needed
- Provide constructive feedback
- Approve when ready

### As Author
- Respond to all comments
- Make requested changes
- Re-request review after changes
- Be open to feedback

## Documentation

### When to Update Docs
- New features → Update README, API reference
- API changes → Update `docs/api-reference.md`
- Architecture changes → Update `docs/system-architecture.md`
- New patterns → Update `docs/code-standards.md`

### Documentation Standards
- Clear, concise writing
- Code examples for complex topics
- Keep docs in sync with code
- Use markdown formatting

## Questions?

- Check existing documentation in `docs/`
- Review code standards
- Ask in pull request comments
- Contact maintainers

## License

This project is proprietary. By contributing, you agree that your contributions will be licensed under the same terms.
```

### 3. Update README.md

Append documentation section:

```markdown
## Documentation

### Getting Started
- [Setup Guide](docs/deployment-guide.md) — Installation and deployment
- [Contributing Guidelines](docs/contributing.md) — How to contribute

### Development
- [Code Standards](docs/code-standards.md) — Coding conventions and best practices
- [System Architecture](docs/system-architecture.md) — Technical architecture overview
- [API Reference](docs/api-reference.md) — REST API endpoint documentation
- [Testing Strategy](docs/testing-strategy.md) — Testing approach and guidelines

### Project Management
- [Project Roadmap](docs/project-roadmap.md) — Development phases and milestones
- [Project Changelog](docs/project-changelog.md) — Version history and changes

## Testing

### Run Unit Tests
```bash
cd sale-stock-po-app
npm run test              # Run all unit tests
npm run test:ui           # Interactive UI
npm run test:coverage     # With coverage report
```

### Run E2E Tests
```bash
cd sale-stock-po-app
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:debug    # Debug mode
```

See [Testing Strategy](docs/testing-strategy.md) for details.
```

### 4. Verify All Documentation Links

```bash
# Check all docs exist
test -f docs/api-reference.md && echo "✓ API reference"
test -f docs/testing-strategy.md && echo "✓ Testing strategy"
test -f docs/contributing.md && echo "✓ Contributing guide"
test -f docs/code-standards.md && echo "✓ Code standards"
test -f docs/deployment-guide.md && echo "✓ Deployment guide"
test -f docs/system-architecture.md && echo "✓ System architecture"
test -f docs/project-roadmap.md && echo "✓ Project roadmap"
test -f docs/project-changelog.md && echo "✓ Project changelog"
```

### 5. Commit Documentation Changes

```bash
git add docs/testing-strategy.md docs/contributing.md README.md
git commit -m "docs: add testing strategy and contributing guidelines

- Add comprehensive testing strategy documentation
- Add contributing guidelines for new contributors
- Update README with documentation links and test commands
- Complete documentation sprint (Phase 6)"
```

## Todo List

- [x] Read test configurations from Phase 3
- [x] Read test files from Phase 4 and 5
- [x] Create testing-strategy.md
- [x] Create contributing.md
- [x] Update README.md with documentation section
- [x] Verify all documentation links work
- [x] Check markdown formatting
- [ ] Commit documentation changes (pending user approval)
- [x] Verify plan completion

## Success Criteria

**Completion checklist:**
1. `docs/testing-strategy.md` exists and comprehensive
2. `docs/contributing.md` exists and clear
3. `README.md` updated with documentation links
4. All documentation links valid
5. Markdown formatting correct
6. No broken links
7. Documentation discoverable from README
8. Changes committed

**Validation:**
```bash
# Check files exist
test -f docs/testing-strategy.md && echo "✓ Testing strategy"
test -f docs/contributing.md && echo "✓ Contributing guide"

# Check README updated
grep -q "Testing Strategy" README.md && echo "✓ README updated"

# Check all docs linked
grep -q "api-reference.md" README.md && echo "✓ API reference linked"
grep -q "testing-strategy.md" README.md && echo "✓ Testing strategy linked"
grep -q "contributing.md" README.md && echo "✓ Contributing guide linked"

# Verify markdown valid
npx markdownlint docs/testing-strategy.md docs/contributing.md
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Broken documentation links | Low | Low | Verify all links before commit |
| Outdated information | Medium | Medium | Review against actual code |
| Unclear instructions | Low | Medium | Test instructions as new user |
| Missing information | Low | Low | Cross-reference with other docs |

## Security Considerations

**Documentation Safety:**
- No credentials in docs
- Use example.com for examples
- Use test data only
- Document security best practices
- Link to deployment guide for secrets

## Next Steps

After completion:
1. All phases complete
2. Project ready for v1.0.1 release
3. Consider tagging release
4. Update project roadmap
5. Share documentation with team
