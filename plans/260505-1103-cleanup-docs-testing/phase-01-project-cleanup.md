# Phase 01: Project Cleanup

## Parallelization Info

**Can run with:** Phase 2, Phase 3  
**Blocks:** None  
**Blocked by:** None  
**Estimated time:** 15 minutes

## File Ownership

**Exclusive write access:**
- `sale-stock-po-app/plans/260321-2226-retrieve-stitch-screen-assets/` (archive)
- `sale-stock-po-app/plans/260329-2138-frontend-ui-ux-refresh/` (archive)
- `sale-stock-po-app/plans/260402-2141-medical-blue-ui-redesign/` (archive)
- `sale-stock-po-app/plans/260405-2148-operations-control-and-forecast-workspace/` (archive)
- `sale-stock-po-app/plans/260405-2215-master-data-bulk-ops-and-stock-ledger/` (archive)
- `.env.local.example` (create)

**Read access:**
- `.env.local` (if exists, for template reference)
- `docs/deployment-guide.md` (for env var documentation)

## Conflict Prevention

No conflicts — only touches plans/ directory and creates new .env.example file. No overlap with Phase 2 (docs/) or Phase 3 (config files).

## Context

**From brainstorm report:**
- 1 obsolete plan (Stitch — user doesn't recall purpose)
- 4 completed plans in app directory (should be archived)
- 13 uncommitted files from doc overhaul (need commit)
- Missing .env.local.example (deployment gap)

**Current state:**
- v1.0.0 production complete
- Clean codebase (no temp files)
- Documentation comprehensive

## Requirements

### Functional
1. Archive obsolete Stitch plan
2. Archive 4 completed plans
3. Commit documentation updates
4. Create .env.local.example template

### Non-functional
- Preserve git history
- Maintain plan directory structure
- Document env vars clearly

## Architecture

**Archive Strategy:**
```
sale-stock-po-app/plans/
├── archive/
│   ├── 260321-2226-retrieve-stitch-screen-assets/
│   ├── 260329-2138-frontend-ui-ux-refresh/
│   ├── 260402-2141-medical-blue-ui-redesign/
│   ├── 260405-2148-operations-control-and-forecast-workspace/
│   └── 260405-2215-master-data-bulk-ops-and-stock-ledger/
└── [active plans remain at root]
```

**Env Template Structure:**
```bash
# Turso Database Configuration
TURSO_DATABASE_URL=libsql://[your-database].turso.io
TURSO_AUTH_TOKEN=eyJ...

# Application Configuration
NODE_ENV=development
```

## Related Code Files

**To modify:**
- None (only file operations)

**To create:**
- `.env.local.example`

**To move:**
- 5 plan directories

## Implementation Steps

### 1. Create Archive Directory
```bash
mkdir -p sale-stock-po-app/plans/archive
```

### 2. Archive Obsolete Stitch Plan
```bash
mv sale-stock-po-app/plans/260321-2226-retrieve-stitch-screen-assets \
   sale-stock-po-app/plans/archive/
```

**Rationale:** User doesn't recall purpose, no Stitch CLI available, plan status pending since March.

### 3. Archive Completed Plans
```bash
mv sale-stock-po-app/plans/260329-2138-frontend-ui-ux-refresh \
   sale-stock-po-app/plans/archive/

mv sale-stock-po-app/plans/260402-2141-medical-blue-ui-redesign \
   sale-stock-po-app/plans/archive/

mv sale-stock-po-app/plans/260405-2148-operations-control-and-forecast-workspace \
   sale-stock-po-app/plans/archive/

mv sale-stock-po-app/plans/260405-2215-master-data-bulk-ops-and-stock-ledger \
   sale-stock-po-app/plans/archive/
```

**Verification:** Check plan.md status field shows "completed" or implementation verified.

### 4. Create .env.local.example
```bash
cat > .env.local.example << 'EOF'
# Turso Database Configuration
# Get these values from: https://turso.tech/app
TURSO_DATABASE_URL=libsql://[your-database-name].turso.io
TURSO_AUTH_TOKEN=eyJ[your-auth-token]

# Application Configuration
NODE_ENV=development

# Optional: Custom Port (default: 3000)
# PORT=3000
EOF
```

**Content based on:**
- `docs/deployment-guide.md` env var documentation
- `lib/db.ts` usage of TURSO_* vars
- Next.js conventions

### 5. Commit Documentation Updates
```bash
git add docs/ README.md plans/reports/ sale-stock-po-app/next.config.ts
git commit -m "docs: comprehensive documentation update

- Add project overview, architecture, standards, deployment guides
- Update README with project structure and setup instructions
- Add scout reports for codebase analysis
- Update system architecture and roadmap
- Configure Next.js allowed dev origins"
```

**Files included (13 total):**
- New: README.md, 5 docs files, 4 scout reports
- Modified: project-roadmap.md, system-architecture.md, next.config.ts

### 6. Commit Cleanup Changes
```bash
git add sale-stock-po-app/plans/archive/ .env.local.example
git commit -m "chore: archive completed plans and add env template

- Archive 5 completed/obsolete plans to plans/archive/
- Add .env.local.example for deployment setup
- Clean project structure for v1.0 maintenance"
```

## Todo List

- [x] Create plans/archive/ directory
- [x] Move Stitch plan to archive
- [x] Move 4 completed plans to archive
- [x] Create .env.local.example with Turso vars
- [ ] Commit documentation updates (pending user approval)
- [ ] Commit cleanup changes (pending user approval)
- [ ] Verify git status clean (pending commit)
- [x] Verify plans/ directory organized

## Success Criteria

**Completion checklist:**
1. `sale-stock-po-app/plans/archive/` exists with 5 subdirectories
2. `.env.local.example` exists with Turso configuration template
3. Git status shows no uncommitted changes
4. All documentation updates committed with descriptive message
5. Cleanup changes committed separately
6. No active plans in archive directory
7. Archive plans retain full history (git log shows moves)

**Validation:**
```bash
# Check archive structure
ls -la sale-stock-po-app/plans/archive/ | wc -l  # Should be 7 (5 dirs + . + ..)

# Check env template
test -f .env.local.example && echo "✓ Env template exists"

# Check git status
git status --short  # Should be empty

# Check commit history
git log --oneline -2  # Should show 2 new commits
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Accidentally archive active plan | Low | Medium | Verify plan.md status before moving |
| Lose git history on move | Low | High | Use `git mv` if files tracked, verify with `git log --follow` |
| Missing env vars in template | Low | Medium | Cross-reference with deployment-guide.md |
| Commit message too generic | Low | Low | Use conventional commits format |

## Security Considerations

**Env Template:**
- Use placeholder values (no real credentials)
- Add comments explaining where to get values
- Document in deployment guide
- Add .env.local to .gitignore (already present)

**Git Commits:**
- Review files before commit (no secrets)
- Use descriptive messages (audit trail)
- Separate concerns (docs vs cleanup)

## Next Steps

After completion:
1. Verify Phase 2 and Phase 3 can proceed (no blockers)
2. Update project roadmap if needed
3. Consider tagging v1.0.1 after all phases complete
