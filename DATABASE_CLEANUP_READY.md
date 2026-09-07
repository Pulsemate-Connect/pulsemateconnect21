# ✅ Database Cleanup Script - Ready to Use

## 📦 Files Created

1. **`CLEAR_DATA_KEEP_ADMINS.sql`** - SQL script to clear all data except admins
2. **`RUN_CLEAR_DATA.md`** - Detailed instructions and commands
3. **`backend/clear-database.js`** - Node.js script with confirmation prompt

---

## 🚀 Quick Start - Choose One Method

### Method 1: Node.js Script (Recommended - Safest)

```bash
# From workspace root
cd backend
node clear-database.js
```

This will:
- Show a clear summary of what will be deleted
- Ask for confirmation (type "DELETE ALL")
- Execute the cleanup
- Show verification statistics
- Safe: Transaction-based with rollback on error

### Method 2: Direct SQL Execution

```bash
# Using psql
psql "postgresql://postgres.czpalrflesdhxfreyaqo:Sahilnaik18@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" -f CLEAR_DATA_KEEP_ADMINS.sql
```

### Method 3: Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Open SQL Editor
3. Copy entire content of `CLEAR_DATA_KEEP_ADMINS.sql`
4. Click Run

---

## 🛡️ What's Protected

The script will **PRESERVE** these admin accounts:

| Admin | Email | Password | Role |
|-------|-------|----------|------|
| Shubham | `shubham27052002@gmail.com` | `Shubham27*` | SUPER_ADMIN |
| Sahil | `sahilnaik1515@gmail.com` | `Nkabu18$` | SUPER_ADMIN |

---

## 🗑️ What Gets Deleted

- ❌ All patients
- ❌ All clinic owners (except admins)
- ❌ All doctors
- ❌ All receptionists
- ❌ All clinics
- ❌ All appointments
- ❌ All payments
- ❌ All notifications
- ❌ All sessions (except admin sessions)
- ❌ All schedules, queues, reviews
- ✅ Keeps audit logs (optional - can delete if needed)

---

## 🔒 Safety Features

1. **Pre-check**: Verifies 2 admin accounts exist before starting
2. **Transaction**: All-or-nothing (rollback on any error)
3. **Verification**: Post-execution report
4. **Confirmation**: Node.js script requires "DELETE ALL" confirmation
5. **Read-only Check**: Won't execute if database is read-only

---

## 📊 Expected Results

After running, you should see:

```
════════════════════════════════════════════════════════
✅ Data Cleanup Complete
════════════════════════════════════════════════════════
Remaining users: 2
Admin accounts preserved: 2

👤 Admin Accounts:
   1. shubham27052002@gmail.com
   2. sahilnaik1515@gmail.com
════════════════════════════════════════════════════════

📊 Final Counts:
   users: 2
   clinics: 0
   doctors: 0
   patients: 0
   appointments: 0
   payments: 0
```

---

## ✅ Verify After Cleanup

```sql
-- Quick verification
SELECT role, COUNT(*) 
FROM users 
GROUP BY role;

-- Should return:
-- role          | count
-- SUPER_ADMIN  | 2
```

---

## 🎯 What's Next

After cleanup, you can:

1. ✅ **Test Admin Login**
   - URL: https://pulsemateconnect.in/admin
   - Use credentials above

2. ✅ **Test NEW Registration Flow**
   - URL: http://localhost:3000/register/clinic-owner
   - Flow: Email OTP → Mobile OTP → Form Steps
   - Verify mobile is stored in database

3. ✅ **Check Database After Registration**
   ```sql
   SELECT email, mobile, "isPhoneVerified" 
   FROM users 
   WHERE role = 'CLINIC_OWNER';
   ```

4. ✅ **Test Onboarding Flow**
   - Complete registration
   - Go to Step 1 form
   - Mobile should be read-only and pre-filled

---

## 🆘 If Something Goes Wrong

### Script Failed Mid-Execution
Don't worry! The transaction will automatically rollback. No partial changes.

### Accidentally Deleted Admins
Restore from backup:
```bash
# Check for backups in database_backups/ folder
ls -l database_backups/

# Restore latest backup
psql "YOUR_DB_URL" -f database_backups/pulsemate_backup_*.sql
```

### Need to Re-create Admin Accounts
```bash
cd backend
node create-two-admins.js
```

---

## 📝 Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `CLEAR_DATA_KEEP_ADMINS.sql` | Main SQL script | Root folder |
| `RUN_CLEAR_DATA.md` | Detailed instructions | Root folder |
| `clear-database.js` | Node.js execution script | backend/ folder |
| `DATABASE_CLEANUP_READY.md` | This summary | Root folder |

---

## ⚡ Quick Commands Cheatsheet

```bash
# 1. Run cleanup (with confirmation)
cd backend && node clear-database.js

# 2. Verify admin accounts exist
psql "$DATABASE_URL" -c "SELECT email, role FROM users WHERE role = 'SUPER_ADMIN';"

# 3. Check total users (should be 2)
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"

# 4. Check clinics deleted (should be 0)
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM clinics;"

# 5. Test admin login
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shubham27052002@gmail.com","password":"Shubham27*"}'
```

---

## 🎉 Ready to Execute

Everything is set up! Choose your method above and run the cleanup when ready.

**Status**: ✅ All scripts ready
**Safety**: ✅ Transaction-based with rollback
**Confirmation**: ✅ Required for Node.js script
**Verification**: ✅ Post-execution checks included

---

**Created**: September 6, 2026  
**Purpose**: Clean database for testing new registration flow  
**Safe to run**: Yes (admins preserved, transaction-based)
