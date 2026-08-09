# 🔧 CREATE TABLE MANUALLY - QUICK FIX

**Issue:** Migration didn't run during deployment  
**Solution:** Create the table manually with SQL (30 seconds)

---

## ⚡ FASTEST FIX - Run This SQL

### Step 1: Find Your Database

**In Render Dashboard:**

1. Look at the left sidebar
2. Find **"PostgreSQL"** or your database name
3. Click on it

**OR**

1. Go to your backend service
2. Click "Environment" tab
3. Find `DATABASE_URL` 
4. Click the database link

---

### Step 2: Open SQL Console

Once in the database:

1. Look for **"Query"** or **"Console"** or **"SQL"** tab
2. Click it to open SQL editor

---

### Step 3: Run This SQL

**Copy and paste this EXACT SQL:**

```sql
CREATE TABLE IF NOT EXISTS otp_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mobile_number TEXT NOT NULL,
    verification_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'MESSAGE_CENTRAL',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_attempts_mobile_created 
ON otp_attempts(mobile_number, created_at);

CREATE INDEX IF NOT EXISTS idx_otp_attempts_verification_id 
ON otp_attempts(verification_id);
```

**Click "Run" or "Execute"**

---

### Step 4: Verify Table Created

**Run this to check:**

```sql
SELECT * FROM otp_attempts LIMIT 1;
```

**Should see:** Empty table (no error)

---

## ✅ THEN TEST IMMEDIATELY

Come back here and type **"test"** and I'll test the API right away!

**Expected:** SMS on your phone! 📱

---

## 🎯 ALTERNATIVE: Render Console

If you can't find SQL console:

**Option 2: Use Render Shell (if available)**

In your backend service → Shell tab:

```bash
npx prisma db push --skip-generate
```

**OR manually connect to database:**

```bash
psql $DATABASE_URL -c "CREATE TABLE IF NOT EXISTS otp_attempts (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, mobile_number TEXT NOT NULL, verification_id TEXT NOT NULL, provider TEXT NOT NULL DEFAULT 'MESSAGE_CENTRAL', expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);"
```

---

## 📊 WHAT THIS DOES

Creates the missing `otp_attempts` table with:
- ✅ Correct column names
- ✅ Correct data types
- ✅ Indexes for performance
- ✅ Matches Prisma schema exactly

**Time:** 30 seconds  
**No restart needed:** Works immediately!

---

**Go create that table now, then come back and type "test"!** 🚀
