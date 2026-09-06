# Database Migration Checklist

## Before You Start
- [ ] Create new Supabase project
- [ ] Note down new connection URLs
- [ ] Backup current database (optional but recommended)

## Step 1: Get New Credentials

From new Supabase project → Settings → Database:

```
Direct URL: postgresql://postgres.[REF]:[PASSWORD]@[HOST]:5432/postgres
Pooled URL: postgresql://postgres.[REF]:[PASSWORD]@[HOST].pooler.supabase.com:5432/postgres
```

## Step 2: Update .env

```bash
# Open backend/.env and update:
DATABASE_URL=postgresql://postgres.[NEW_REF]:[NEW_PASSWORD]@[NEW_HOST].pooler.supabase.com:5432/postgres?connection_limit=5&pool_timeout=20
DIRECT_URL=postgresql://postgres.[NEW_REF]:[NEW_PASSWORD]@[NEW_HOST]:5432/postgres
```

## Step 3: Choose Migration Path

### A) Fresh Start (No Data Transfer)
```bash
cd backend
npx prisma db push
npx prisma generate
node bootstrap-admin.js
```

### B) With Data Migration

#### Export from old DB:
```bash
# Get old database URL from current .env
pg_dump "[OLD_DATABASE_URL]" -f backup_$(date +%Y%m%d).sql
```

#### Import to new DB:
```bash
# After updating .env with new URLs
psql "[NEW_DATABASE_URL]" -f backup_YYYYMMDD.sql
```

## Step 4: Test Connection
```bash
cd backend
npm run dev

# In another terminal
npx prisma studio
```

## Step 5: Update Production
- [ ] Update environment variables on Render/Vercel
- [ ] Update frontend .env.production
- [ ] Redeploy backend
- [ ] Test production

## Rollback Plan
Keep old .env backed up as .env.backup:
```bash
cp backend/.env backend/.env.backup
```

If something goes wrong:
```bash
cp backend/.env.backup backend/.env
npm run dev
```
