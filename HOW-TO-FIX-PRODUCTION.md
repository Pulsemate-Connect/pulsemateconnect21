# 🚀 How to Fix Production Database

## The Problem

Your **local database is empty** (0 clinics, 0 doctors).  
Your **mobile app uses production API**: `https://api.pulsemateconnect.in/api`

So the fix script ran against local DB and found nothing to fix.

---

## ✅ Solution: Run Against Production Database

### Option 1: Temporary Environment Variable (RECOMMENDED)

```bash
# Windows PowerShell:
cd backend
$env:DATABASE_URL="postgresql://username:password@production-host:5432/pulsemate_db"
node fix-sessions.js

# Or one-liner:
$env:DATABASE_URL="postgresql://user:pass@host:5432/pulsemate_db"; node fix-sessions.js
```

```bash
# Windows CMD:
cd backend
set DATABASE_URL=postgresql://username:password@production-host:5432/pulsemate_db
node fix-sessions.js
```

```bash
# Linux/Mac:
cd backend
DATABASE_URL="postgresql://username:password@production-host:5432/pulsemate_db" node fix-sessions.js
```

### Option 2: Create .env.production

```bash
# Create a production environment file
cd backend
copy .env .env.production

# Edit .env.production and change DATABASE_URL to production
# Then run:
$env:DATABASE_URL=(Get-Content .env.production | Select-String "DATABASE_URL").Line.Split("=")[1].Trim('"')
node fix-sessions.js
```

### Option 3: Edit .env Temporarily

**⚠️ CAREFUL - Don't commit this!**

1. Open `backend\.env`
2. Change `DATABASE_URL` to production database
3. Run `node fix-sessions.js`
4. **IMPORTANT:** Change it back to localhost!

---

## 📋 What You Need

### Production Database Credentials

You need to know:
- **Host:** Where is your production database? (e.g., `db.pulsemateconnect.in` or AWS RDS endpoint)
- **Port:** Usually `5432` for PostgreSQL
- **Database name:** Probably `pulsemate_db` or similar
- **Username:** Database user (e.g., `postgres`, `admin`)
- **Password:** Database password

### Finding Your Production Database

Check these locations:

1. **Your deployment platform:**
   - Railway.app → Database tab
   - Render → Database dashboard
   - AWS RDS → Endpoint in console
   - DigitalOcean → Database cluster info

2. **Your production server:**
   ```bash
   ssh user@your-server
   cat /path/to/backend/.env
   ```

3. **Environment variables in deployment:**
   - Vercel → Settings → Environment Variables
   - Heroku → Settings → Config Vars
   - Your CI/CD secrets

---

## 🔍 Quick Test: Is This the Right Database?

Before running the fix, verify you're connected to production:

```bash
# Set production DATABASE_URL, then:
cd backend
node checkSessions.js
```

**You should see:**
- ✅ Multiple clinics (not 0)
- ✅ Multiple clinic sessions (including the 4:51 PM morning session)
- ✅ Doctors and appointments

**If you see 0 clinics**, you're still on local database!

---

## 🎯 Step-by-Step Fix

### Step 1: Get Production Database URL

Example formats:
```
postgresql://user:pass@localhost:5432/pulsemate_db          # Local
postgresql://user:pass@db.example.com:5432/pulsemate_db     # Remote
postgresql://user:pass@aws-rds-endpoint:5432/pulsemate_db   # AWS RDS
```

### Step 2: Test Connection

```powershell
$env:DATABASE_URL="YOUR_PRODUCTION_URL"
cd backend
node checkSessions.js
```

**Expected output:**
```
Found 3 clinics:
  - City Clinic (abc-123)
  - Health Center (def-456)
  
Sessions:
  - City Clinic: MORNING 16:51-18:53 (enabled:true)  ← This is the problem!
```

### Step 3: Run the Fix

```powershell
node fix-sessions.js
```

**Expected output:**
```
═══════════════════════════════════════════════════════
  STEP 1: Fixing Clinic Session Timings
═══════════════════════════════════════════════════════

Found 3 clinic sessions

❌ City Clinic - MORNING:
   OLD: 16:51 - 18:53
   NEW: 08:00 - 12:00
   ✅ Fixed!

✅ Fixed 1 clinic sessions

═══════════════════════════════════════════════════════
  STEP 2: Creating Doctor Availability Records
═══════════════════════════════════════════════════════

Found 5 active doctor-clinic relationships

📋 Dr. John Smith at City Clinic:
   ✅ Monday: Created (9 AM - 6 PM, 15-min slots)
   ✅ Tuesday: Created (9 AM - 6 PM, 15-min slots)
   ...

✅ Created 25 new DoctorAvailability records

═══════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ✅ ALL FIXES APPLIED SUCCESSFULLY!                 ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### Step 4: Verify in App

1. Open mobile app
2. Navigate to BookingScreen
3. Select today's date
4. **Should now show:** "Morning Session 9:00 AM – 12:00 PM" with slots!

---

## 🆘 Can't Access Production Database?

### Alternative: Ask Your Database Admin

Send them this SQL file:
```
fix-production-sessions.sql
```

They can run it directly in pgAdmin or psql.

### Alternative: Add Admin API Endpoint

If you can deploy backend code but can't access DB directly, I can create an admin API endpoint:

```javascript
// backend/src/routes/admin.routes.js
router.post('/admin/fix-sessions', authenticateAdmin, async (req, res) => {
  // Run the fix script
  // Return results
});
```

Then call it via:
```bash
curl -X POST https://api.pulsemateconnect.in/api/admin/fix-sessions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📞 Need Help?

If you're stuck, tell me:

1. **Where is your production database hosted?**
   - Railway? Render? AWS? DigitalOcean? Self-hosted?

2. **Can you access it?**
   - Yes, I have credentials
   - No, but I can ask someone
   - No, but I can deploy code changes

3. **What do you see when you run `node checkSessions.js`?**
   - Share the output

---

## 🎯 TL;DR

**Problem:** Fix script ran against empty local DB, not production  
**Solution:** Run with production DATABASE_URL environment variable  

```powershell
# Replace with YOUR production database URL
$env:DATABASE_URL="postgresql://user:pass@your-host:5432/pulsemate_db"
cd backend
node fix-sessions.js
```

