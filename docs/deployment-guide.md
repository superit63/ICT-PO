# Deployment Guide

**Project:** ICT-PO — Sale Stock & Purchase Order Management  
**Last Updated:** 2026-05-04  
**Target Platform:** Vercel + Turso

---

## Prerequisites

### Required Accounts
- **Vercel Account** — Free Hobby tier (https://vercel.com)
- **Turso Account** — Free tier (https://turso.tech)
- **GitHub Account** — For repository hosting (optional but recommended)

### Required Tools
- **Node.js** — Version 22.x or later
- **npm** — Version 10.x or later
- **Git** — For version control
- **Vercel CLI** — `npm install -g vercel`
- **Turso CLI** — Install from https://docs.turso.tech/cli/installation

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd ICT-PO/sale-stock-po-app
```

### 2. Install Dependencies

```bash
npm install
```

This installs all production and development dependencies from `package.json`.

### 3. Set Up Turso Database

#### Create Database

```bash
# Login to Turso
turso auth login

# Create database
turso db create ict-po-db

# Get database URL
turso db show ict-po-db --url
# Output: libsql://ict-po-db-<your-org>.turso.io

# Create authentication token
turso db tokens create ict-po-db
# Output: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

#### Configure Environment Variables

Create `.env.local` file in project root:

```env
TURSO_DATABASE_URL=libsql://ict-po-db-<your-org>.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

**Important:** Never commit `.env.local` to version control. It's already in `.gitignore`.

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/setup` for first-time PIN setup.

### 5. Seed Database (Optional)

```bash
npx tsx scripts/seed-products.ts
```

This populates the database with:
- 25 Exeol pharmaceutical products
- 10 Vietnamese hospital customers

---

## Production Deployment (Vercel)

### Method 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: initial deployment"
git push origin main
```

#### Step 2: Import Project in Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel auto-detects Next.js configuration

#### Step 3: Configure Environment Variables

In Vercel project settings:
1. Go to **Settings** → **Environment Variables**
2. Add variables:
   - `TURSO_DATABASE_URL` → `libsql://ict-po-db-<your-org>.turso.io`
   - `TURSO_AUTH_TOKEN` → `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...`
3. Select environments: **Production**, **Preview**, **Development**

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Visit your production URL: `https://<project-name>.vercel.app`

---

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Link Project

```bash
cd sale-stock-po-app
vercel link
```

Follow prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account/team
- **Link to existing project?** → No (first time)
- **Project name?** → ict-po (or your choice)

#### Step 4: Add Environment Variables

```bash
vercel env add TURSO_DATABASE_URL
# Paste: libsql://ict-po-db-<your-org>.turso.io
# Select: Production, Preview, Development

vercel env add TURSO_AUTH_TOKEN
# Paste: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
# Select: Production, Preview, Development
```

#### Step 5: Deploy to Production

```bash
vercel --prod
```

Output:
```
✓ Production: https://ict-po.vercel.app [2m 15s]
```

---

## Vercel Configuration

### vercel.json

The project includes a `vercel.json` file with production-ready settings:

```json
{
  "framework": "nextjs",
  "regions": ["fra1"],
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs22.x",
      "memory": 512,
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, must-revalidate"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

**Key Settings:**
- **Region:** `fra1` (Frankfurt) — Closest to France and Vietnam
- **Runtime:** Node.js 22.x
- **Memory:** 512 MB per function
- **Timeout:** 10 seconds
- **Headers:** No caching for API routes, MIME sniffing prevention

---

## Database Migration

### Automatic Migration

The app automatically runs database migrations on first request to `/api/init`.

**Migration Process:**
1. User visits any page
2. App layout calls `/api/init`
3. `lib/init.ts` executes schema SQL
4. Tables and indexes created if not exist
5. Migration completes silently

**Schema Location:** `lib/init.ts` (inline SQL)

### Manual Migration (if needed)

If automatic migration fails, run manually via Turso CLI:

```bash
# Connect to database
turso db shell ict-po-db

# Copy SQL from lib/schema.sql and paste
# Or execute from file:
turso db shell ict-po-db < lib/schema.sql
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TURSO_DATABASE_URL` | Turso database connection URL | `libsql://ict-po-db-org.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso authentication token | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...` |

### Optional Variables

None — all configuration is in code or `vercel.json`.

### Fallback Behavior

If both `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are missing:
- App uses `file:local.db` (local SQLite file)
- Suitable for local development only
- **Not recommended for production**

---

## Build Process

### Build Command

```bash
npm run build
```

**Steps:**
1. TypeScript compilation
2. Next.js optimization
3. Static page generation
4. Bundle creation
5. Output to `.next/` directory

**Build Time:** ~1-2 minutes

### Build Output

```
.next/
├── cache/              # Build cache
├── server/             # Server-side code
├── static/             # Static assets
└── standalone/         # Standalone deployment (not used)
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (if tests exist)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Seed data loaded (if needed)

### Post-Deployment

- [ ] Visit production URL
- [ ] Complete PIN setup
- [ ] Test all major features:
  - [ ] Login/logout
  - [ ] Master data CRUD
  - [ ] Forecast entry
  - [ ] Rollforward calculation
  - [ ] PO suggestions
  - [ ] PO management
  - [ ] Stock control
  - [ ] Excel exports
  - [ ] JSON backup
- [ ] Check Vercel function logs for errors
- [ ] Monitor Turso database usage

---

## Monitoring & Logs

### Vercel Logs

**Access Logs:**
1. Go to Vercel Dashboard
2. Select your project
3. Click **"Logs"** tab
4. Filter by:
   - **Deployment** — Build logs
   - **Functions** — Runtime logs
   - **Static** — Static asset requests

**Log Retention:** 1 hour on Hobby tier

### Turso Logs

**Query Logs:**
```bash
turso db inspect ict-po-db
```

**Usage Stats:**
```bash
turso db show ict-po-db
```

Output:
```
Name:           ict-po-db
URL:            libsql://ict-po-db-org.turso.io
Regions:        fra
Size:           245 KB
Tables:         7
Rows Read:      12,345
Rows Written:   1,234
```

---

## Performance Optimization

### Cold Start Mitigation

**Problem:** Vercel Hobby tier has cold starts (~1-3 seconds)

**Mitigation:**
- Accept as free tier limitation
- Consider upgrading to Pro tier for always-warm functions
- Use Vercel Cron Jobs to keep functions warm (Pro tier only)

### Database Query Optimization

**Implemented:**
- Indexed queries for common patterns
- Composite indexes for multi-column queries
- Parameterized queries (prevents SQL injection)

**Future Improvements:**
- Add caching layer (Redis)
- Implement query result caching
- Add database connection pooling

### Bundle Size Optimization

**Current:**
- Client bundle: ~200 KB (gzipped)
- Server bundle: ~500 KB

**Optimizations:**
- Dynamic imports for xlsx library
- Tree-shaking enabled
- Code splitting by route (automatic)

---

## Scaling Considerations

### Vercel Hobby Tier Limits

| Resource | Limit | Current Usage |
|----------|-------|---------------|
| **Bandwidth** | 100 GB/month | < 1 GB/month |
| **Function Executions** | 100 GB-hours/month | < 5 GB-hours/month |
| **Build Minutes** | 6,000 minutes/month | < 10 minutes/month |
| **Serverless Functions** | 12 per deployment | 15 (within limit) |

**Upgrade Trigger:** If usage exceeds 80% of any limit

### Turso Free Tier Limits

| Resource | Limit | Current Usage |
|----------|-------|---------------|
| **Storage** | 500 MB | < 1 MB |
| **Row Reads** | 1 billion/month | < 100K/month |
| **Row Writes** | Unlimited | < 10K/month |
| **Databases** | 3 | 1 |

**Upgrade Trigger:** If storage exceeds 400 MB or reads exceed 800M/month

---

## Backup & Disaster Recovery

### Manual Backup (Current Method)

**Process:**
1. Login to app
2. Go to **Settings** page
3. Click **"Export All Data (JSON)"**
4. Save file to secure location
5. Repeat weekly

**Backup Contents:**
- All products
- All customers
- All forecasts
- All stock records
- All purchase orders
- All PO items
- All stock adjustments

**Backup Size:** ~100-500 KB (depending on data volume)

### Automated Backup (Future Enhancement)

**Recommended Approach:**
1. Set up Vercel Cron Job (Pro tier)
2. Create `/api/backup` endpoint
3. Export JSON to S3/Cloudflare R2
4. Schedule daily backups
5. Retain 30 days of backups

### Disaster Recovery Process

**Scenario:** Database corruption or accidental deletion

**Recovery Steps:**
1. Create new Turso database
2. Update `TURSO_DATABASE_URL` in Vercel
3. Redeploy app (triggers auto-migration)
4. Manually import data from JSON backup
5. Verify data integrity
6. Resume operations

**Recovery Time Objective (RTO):** 1-2 hours  
**Recovery Point Objective (RPO):** 1 week (if weekly backups)

---

## Troubleshooting

### Build Failures

**Error:** `Type error: Cannot find module '@/lib/db'`

**Solution:**
```bash
# Check tsconfig.json path aliases
# Ensure @/* maps to ./*
# Rebuild
npm run build
```

---

**Error:** `Module not found: Can't resolve 'xlsx'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Runtime Errors

**Error:** `Unauthorized` on all API requests

**Solution:**
- Check PIN is set up correctly
- Clear browser cookies
- Re-login with correct PIN
- Check session cookie is httpOnly

---

**Error:** `Database connection failed`

**Solution:**
- Verify `TURSO_DATABASE_URL` is correct
- Verify `TURSO_AUTH_TOKEN` is valid
- Check Turso database is active
- Regenerate token if expired:
  ```bash
  turso db tokens create ict-po-db
  ```

---

**Error:** `Cold start timeout`

**Solution:**
- Increase `maxDuration` in `vercel.json` (max 10s on Hobby)
- Optimize database queries
- Consider upgrading to Pro tier

---

### Database Issues

**Error:** `Table does not exist`

**Solution:**
- Visit `/api/init` to trigger migration
- Check Vercel function logs for migration errors
- Manually run schema SQL via Turso CLI

---

**Error:** `UNIQUE constraint failed`

**Solution:**
- Check for duplicate SKUs (products)
- Check for duplicate PO numbers
- Check for duplicate forecast entries (customer + product + month)

---

### Deployment Issues

**Error:** `Build failed: Out of memory`

**Solution:**
- Reduce bundle size
- Remove unused dependencies
- Upgrade to Pro tier (more memory)

---

**Error:** `Environment variable not found`

**Solution:**
- Add missing variables in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly

---

## Security Best Practices

### Production Checklist

- [x] HTTPS enabled (automatic on Vercel)
- [x] httpOnly cookies for sessions
- [x] Parameterized SQL queries
- [x] bcrypt PIN hashing
- [x] No hardcoded credentials
- [x] Environment variables for secrets
- [x] Cache-Control headers on API routes
- [x] X-Content-Type-Options header

### Additional Recommendations

- [ ] Enable Vercel Web Application Firewall (Pro tier)
- [ ] Set up Vercel DDoS protection (Pro tier)
- [ ] Implement rate limiting on API routes
- [ ] Add CSRF protection for multi-user version
- [ ] Enable Turso audit logging (paid tier)
- [ ] Set up error monitoring (Sentry)

---

## Rollback Procedure

### Rollback to Previous Deployment

**Via Vercel Dashboard:**
1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"..."** → **"Promote to Production"**
4. Confirm promotion

**Via Vercel CLI:**
```bash
vercel rollback
```

**Rollback Time:** ~30 seconds

### Database Rollback

**Warning:** Database changes are not automatically rolled back.

**Manual Rollback:**
1. Restore from JSON backup
2. Manually revert database changes
3. Consider implementing database migrations with version tracking

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor Vercel function logs for errors
- Check Turso database usage

**Weekly:**
- Export JSON backup
- Review error logs
- Check performance metrics

**Monthly:**
- Review Vercel usage (bandwidth, functions)
- Review Turso usage (storage, reads)
- Update dependencies (security patches)
- Review and archive old data

### Dependency Updates

**Check for updates:**
```bash
npm outdated
```

**Update dependencies:**
```bash
npm update
npm run build
npm run lint
```

**Major version updates:**
- Read changelog before updating
- Test thoroughly in development
- Deploy to preview environment first
- Monitor for issues after production deployment

---

## Support & Resources

### Official Documentation

- **Next.js:** https://nextjs.org/docs
- **Vercel:** https://vercel.com/docs
- **Turso:** https://docs.turso.tech
- **shadcn/ui:** https://ui.shadcn.com

### Community Resources

- **Next.js Discord:** https://nextjs.org/discord
- **Vercel Discord:** https://vercel.com/discord
- **Turso Discord:** https://discord.gg/turso

### Project Documentation

- **Setup Guide:** `sale-stock-po-app/SETUP.md`
- **Onboarding Guide:** `docs/onboarding-guide.md`
- **System Architecture:** `docs/system-architecture.md`
- **Code Standards:** `docs/code-standards.md`

---

**Document Owner:** Development Team  
**Review Cycle:** Quarterly or on infrastructure changes
