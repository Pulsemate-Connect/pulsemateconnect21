# ⚡ Quick Database Commands Reference

## 🚀 Main Operations

```bash
# 1. Check current database state
cd backend
node verify-database-state.js

# 2. Clear all data (keep admins only)
cd backend
node clear-database.js
# Type "DELETE ALL" when prompted

# 3. Verify after cleanup
node verify-database-state.js
```

---

## 🔍 Quick SQL Queries

```bash
# Set your database URL (copy from backend/.env)
export DATABASE_URL="postgresql://postgres.czpalrflesdhxfreyaqo:Sahilnaik18@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

# Check admin accounts
psql "$DATABASE_URL" -c "SELECT email, role, mobile, \"isActive\" FROM users WHERE role = 'SUPER_ADMIN';"

# Count all users
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_users FROM users;"

# Count by role
psql "$DATABASE_URL" -c "SELECT role, COUNT(*) FROM users GROUP BY role;"

# Check recent registrations
psql "$DATABASE_URL" -c "SELECT email, role, mobile, \"createdAt\" FROM users ORDER BY \"createdAt\" DESC LIMIT 5;"

# Full stats
psql "$DATABASE_URL" -c "
SELECT 
  'users' AS table_name, COUNT(*) FROM users
UNION ALL SELECT 'clinics', COUNT(*) FROM clinics
UNION ALL SELECT 'doctors', COUNT(*) FROM doctor_profiles
UNION ALL SELECT 'patients', COUNT(*) FROM patient_profiles
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
ORDER BY table_name;
"
```

---

## 🧪 Test Workflow

### Before Cleanup:
```bash
# 1. Check current state
cd backend
node verify-database-state.js

# Expected: Shows all existing data
```

### Run Cleanup:
```bash
# 2. Clear database
node clear-database.js

# Type: DELETE ALL

# Expected output:
# ✅ Database cleanup completed successfully!
# Total Users: 2
# Admin Users: 2
# Clinics: 0
# Doctors: 0
# Patients: 0
```

### After Cleanup:
```bash
# 3. Verify state again
node verify-database-state.js

# Expected: Only 2 admin accounts remain
```

### Test Registration:
```bash
# 4. Start frontend (in new terminal)
cd frontend
npm run dev

# 5. Navigate to registration
# http://localhost:3000/register/clinic-owner

# 6. Complete registration:
#    - Enter email → Get OTP → Verify
#    - Enter mobile → Get OTP → Verify  
#    - Fill form → Submit

# 7. Check database for new user
psql "$DATABASE_URL" -c "
  SELECT email, mobile, role, \"isPhoneVerified\" 
  FROM users 
  WHERE role = 'CLINIC_OWNER' 
  ORDER BY \"createdAt\" DESC 
  LIMIT 1;
"

# Expected: Should show the mobile number you verified
```

---

## 🔐 Admin Login Test

```bash
# Test admin login via API
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shubham27052002@gmail.com",
    "password": "Shubham27*"
  }'

# Expected: Returns JWT token and user data
```

---

## 📊 Database Health Check

```bash
# Quick health check script
psql "$DATABASE_URL" << EOF
-- Connection test
SELECT 'Database connected ✅' as status;

-- Admin count
SELECT 
  'Admin accounts: ' || COUNT(*) || ' (should be 2)' as check
FROM users WHERE role = 'SUPER_ADMIN';

-- Total users
SELECT 
  'Total users: ' || COUNT(*) as info
FROM users;

-- Recent activity
SELECT 
  'Last registration: ' || MAX("createdAt")::text as info
FROM users WHERE role != 'SUPER_ADMIN';
EOF
```

---

## 🆘 Emergency Commands

### Restore Admin Accounts (if accidentally deleted)
```bash
cd backend
node create-two-admins.js
```

### Check if database is locked
```bash
psql "$DATABASE_URL" -c "
  SELECT 
    pid,
    usename,
    application_name,
    state,
    query
  FROM pg_stat_activity
  WHERE datname = current_database()
  AND state != 'idle';
"
```

### Kill stuck connections
```bash
psql "$DATABASE_URL" -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = current_database()
  AND pid <> pg_backend_pid()
  AND state = 'active';
"
```

---

## 📁 File Locations

| Script | Purpose | Location |
|--------|---------|----------|
| `verify-database-state.js` | Check DB state | `backend/verify-database-state.js` |
| `clear-database.js` | Clean DB (keep admins) | `backend/clear-database.js` |
| `CLEAR_DATA_KEEP_ADMINS.sql` | SQL cleanup script | Root folder |
| `create-two-admins.js` | Recreate admins | `backend/create-two-admins.js` |

---

## 🎯 Complete Test Sequence

```bash
# 1. Verify current state
cd backend
node verify-database-state.js

# 2. Clean database
node clear-database.js
# Type: DELETE ALL

# 3. Verify cleanup
node verify-database-state.js
# Should show: 2 users (both SUPER_ADMIN)

# 4. Test admin login
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shubham27052002@gmail.com","password":"Shubham27*"}' \
  | jq

# 5. Start frontend
cd ../frontend
npm run dev

# 6. Test registration
# Open: http://localhost:3000/register/clinic-owner
# Complete: Email OTP → Mobile OTP → Form

# 7. Verify new user in DB
cd ../backend
psql "$DATABASE_URL" -c "
  SELECT 
    email, 
    mobile, 
    role, 
    \"isPhoneVerified\",
    \"createdAt\"
  FROM users 
  WHERE role = 'CLINIC_OWNER' 
  ORDER BY \"createdAt\" DESC 
  LIMIT 1;
"

# Expected: Shows new clinic owner with verified mobile
```

---

## 📞 Admin Credentials

| Admin | Email | Password |
|-------|-------|----------|
| Shubham | `shubham27052002@gmail.com` | `Shubham27*` |
| Sahil | `sahilnaik1515@gmail.com` | `Nkabu18$` |

**Login URL**: https://pulsemateconnect.in/admin  
**Local URL**: http://localhost:3000/admin

---

## ✅ Success Indicators

After cleanup, you should see:

- ✅ 2 total users
- ✅ 2 SUPER_ADMIN users
- ✅ 0 clinics
- ✅ 0 doctors
- ✅ 0 patients
- ✅ 0 appointments
- ✅ Admin login works
- ✅ New registration works
- ✅ Mobile gets saved to database

---

**Last Updated**: September 6, 2026  
**Status**: Ready to use ✅
