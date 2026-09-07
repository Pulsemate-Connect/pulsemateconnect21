# 🗑️ Clear Database Data (Keep Admins)

## 📋 What This Does

This script will **DELETE ALL DATA** from your PulseMate Connect database **EXCEPT**:
- ✅ Admin 1: `shubham27052002@gmail.com`
- ✅ Admin 2: `sahilnaik1515@gmail.com`

## ⚠️ Data That Will Be Deleted

- 🗑️ All patients
- 🗑️ All clinic owners (except admins)
- 🗑️ All doctors
- 🗑️ All receptionists
- 🗑️ All clinics
- 🗑️ All appointments
- 🗑️ All payments
- 🗑️ All notifications
- 🗑️ All sessions (except admin sessions)
- 🗑️ All schedules and queues

## ✅ Safety Features

1. **Pre-check**: Script verifies that 2 admin accounts exist before starting
2. **Transaction**: All operations in a single transaction (rollback on error)
3. **Verification**: Post-execution report shows what was preserved
4. **Audit Logs**: Keeps audit logs by default (can be deleted if needed)

---

## 🚀 How to Run

### Option 1: Using psql Command Line

```bash
# Connect to your database and run the script
psql "postgresql://postgres.czpalrflesdhxfreyaqo:Sahilnaik18@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" -f CLEAR_DATA_KEEP_ADMINS.sql
```

### Option 2: Using Supabase SQL Editor

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project
3. Click **SQL Editor** in left menu
4. Click **New Query**
5. Copy and paste the entire content of `CLEAR_DATA_KEEP_ADMINS.sql`
6. Click **Run** button

### Option 3: Using Node.js Script

Create a file `clear-database.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.czpalrflesdhxfreyaqo:Sahilnaik18@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
});

async function clearData() {
  const client = await pool.connect();
  try {
    const fs = require('fs');
    const sql = fs.readFileSync('CLEAR_DATA_KEEP_ADMINS.sql', 'utf8');
    
    await client.query(sql);
    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

clearData();
```

Then run:
```bash
node clear-database.js
```

---

## 📊 Expected Output

After running the script, you should see:

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
```

Plus verification tables showing:
- 2 users (both SUPER_ADMIN)
- 0 clinics
- 0 doctors
- 0 patients
- 0 appointments
- etc.

---

## 🔍 Verify After Running

Run these queries to verify:

```sql
-- Check admin accounts are still there
SELECT email, role, "isActive" FROM users WHERE role = 'SUPER_ADMIN';

-- Check total users (should be 2)
SELECT COUNT(*) FROM users;

-- Check clinics are gone (should be 0)
SELECT COUNT(*) FROM clinics;

-- Check patients are gone (should be 0)
SELECT COUNT(*) FROM patient_profiles;

-- Check doctors are gone (should be 0)
SELECT COUNT(*) FROM doctor_profiles;
```

---

## 🆘 If Something Goes Wrong

### Rollback (if script fails mid-execution)
If the script encounters an error, it will automatically rollback (undo all changes) thanks to the `BEGIN` and `COMMIT` transaction wrapper.

### Restore from Backup
If you need to restore data:

1. Check for backup files in `database_backups/` folder
2. Find the most recent backup (e.g., `pulsemate_backup_20260829_112634.sql`)
3. Run: `psql "YOUR_DATABASE_URL" -f database_backups/BACKUP_FILE.sql`

---

## 📝 Admin Login After Cleanup

After clearing data, you can still login as admin:

### Admin 1 (Shubham)
- **Email**: `shubham27052002@gmail.com`
- **Password**: `Shubham27*`
- **URL**: https://pulsemateconnect.in/admin

### Admin 2 (Sahil)
- **Email**: `sahilnaik1515@gmail.com`
- **Password**: `Nkabu18$`
- **URL**: https://pulsemateconnect.in/admin

---

## ⚡ Quick Commands

```bash
# See the script content
cat CLEAR_DATA_KEEP_ADMINS.sql

# Run the script
psql "postgresql://postgres.czpalrflesdhxfreyaqo:Sahilnaik18@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" -f CLEAR_DATA_KEEP_ADMINS.sql

# Verify admins exist
psql "postgresql://postgres.czpalrflesdhxfreyaqo:Sahilnaik18@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" -c "SELECT email, role FROM users WHERE role = 'SUPER_ADMIN';"

# Check total users
psql "postgresql://postgres.czpalrflesdhxfreyaqo:Sahilnaik18@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" -c "SELECT COUNT(*) FROM users;"
```

---

## 🎯 Next Steps After Cleanup

1. ✅ Test admin login
2. ✅ Test NEW clinic owner registration flow at `/register/clinic-owner`
3. ✅ Verify mobile verification works (email OTP → mobile OTP)
4. ✅ Check database shows correct mobile numbers after registration
5. ✅ Test onboarding flow (Step 1 should show mobile as read-only)

---

**Last Updated**: September 6, 2026
**Script**: `CLEAR_DATA_KEEP_ADMINS.sql`
**Status**: Ready to use ✅
