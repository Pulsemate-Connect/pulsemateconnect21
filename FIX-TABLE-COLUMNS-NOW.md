# 🔧 FIX TABLE COLUMNS - QUICK SQL FIX

**Issue:** Table exists but with wrong column names (snake_case vs camelCase)  
**Solution:** Drop and recreate table (30 seconds)

---

## ⚡ FASTEST FIX - Run This SQL in Supabase

### Go to Supabase:

1. **Open:** https://supabase.com/dashboard
2. **Select** your PulseMate project
3. **Click** "SQL Editor" (left sidebar)
4. **Click** "New query"
5. **Paste this SQL:**

```sql
-- Drop the old table with wrong column names
DROP TABLE IF EXISTS otp_attempts CASCADE;

-- Create table with correct Prisma camelCase names
CREATE TABLE otp_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "mobileNumber" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'MESSAGE_CENTRAL',
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_otp_attempts_mobile_created 
ON otp_attempts("mobileNumber", "createdAt");

CREATE INDEX idx_otp_attempts_verification_id 
ON otp_attempts("verificationId");
```

6. **Click "Run"** (or Ctrl+Enter)
7. **Should see:** "Success"

---

## ✅ THEN TEST IMMEDIATELY

Come back here and type **"test"** - no need to wait for Render!

**Expected:**
- ✅ API works immediately
- ✅ Returns verificationId
- ✅ **SMS on your phone!** 📱

---

## 🎯 WHY THIS HAPPENED

Prisma uses camelCase for column names in the model but they map to camelCase in PostgreSQL (with quotes).

**Wrong:** `mobile_number` (snake_case)  
**Correct:** `"mobileNumber"` (camelCase with quotes)

The fix I just pushed will create tables correctly from now on, but the existing table needs to be recreated.

---

## 📊 WHAT THE SQL DOES

1. **DROP TABLE** - Removes the incorrectly created table
2. **CREATE TABLE** - Creates with correct column names
3. **CREATE INDEX** - Adds performance indexes

**Time:** 30 seconds  
**Data loss:** None (table is empty anyway)

---

## ⏰ ALTERNATIVE: Wait for Next Deployment

If you don't want to run SQL:

1. The fix is already pushed to GitHub
2. Wait 5-10 minutes for Render to deploy
3. Manually restart Render service
4. The init script will recreate the table correctly

**But SQL fix is faster!** ⚡

---

**Go run that SQL in Supabase now, then type "test"!** 🚀
