# How to Seed Test Data

## 📋 Overview

This will create complete test data for your PulseMate Connect application:
- ✅ 2 Clinics (fully verified)
- ✅ 2 Clinic Owners
- ✅ 4 Doctors (with availability schedules)
- ✅ 2 Receptionists
- ✅ Clinic sessions
- ✅ All relationships and staff linkages

---

## 🚀 Quick Start

### Step 1: Clean Up Existing Test Data (If Any)

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Delete users with test numbers
DELETE FROM users WHERE mobile LIKE '99999999%';

-- Delete test clinics
DELETE FROM clinics WHERE name LIKE 'Test %';
```

### Step 2: Run the Seed Script

```bash
cd backend
node seed-test-data.js
```

### Step 3: Check the Output

You'll see a complete list of credentials printed to the console!

---

## 📱 Test Credentials

**All accounts use password**: `Test@123`  
**All mobile numbers get OTP**: `123456`

### Clinic Owners
1. **clinic1@test.com** / 9999999991
2. **clinic2@test.com** / 9999999992

### Doctors
1. **doctor1@test.com** / 9999999993 - Dr. Test Kumar (General Medicine)
2. **doctor2@test.com** / 9999999994 - Dr. Test Sharma (Cardiology)
3. **doctor3@test.com** / 9999999995 - Dr. Test Patel (Physiotherapy)
4. **doctor4@test.com** / 9999999996 - Dr. Test Reddy (Orthopedics)

### Receptionists
1. **reception1@test.com** / 9999999997
2. **reception2@test.com** / 9999999998

---

## 🏥 Clinics Created

### Test Medical Center (Mumbai)
- **Doctors**: Dr. Test Kumar, Dr. Test Sharma
- **Receptionist**: Test Receptionist 1
- **Specialties**: General Medicine, Cardiology
- **Hours**: 9:00 AM - 6:00 PM

### Test Wellness Clinic (Delhi)
- **Doctors**: Dr. Test Patel, Dr. Test Reddy
- **Receptionist**: Test Receptionist 2
- **Specialties**: Physiotherapy, Orthopedics
- **Hours**: 8:00 AM - 8:00 PM

---

## ✅ What Gets Created

1. **Clinic Owners** - Verified accounts with primary clinic linkage
2. **Clinics** - Fully verified and active with all details
3. **Doctors** - Complete profiles with:
   - Specialization and qualifications
   - Consultation fees
   - Doctor-clinic relationships
   - **Doctor availability schedules** (specific days and times)
   - Clinic staff records
4. **Receptionists** - Active accounts linked to clinics
5. **Clinic Sessions** - Morning and Evening sessions for both clinics

---

## 🧪 Testing Scenarios

### Test Clinic Owner Login
```
Email: clinic1@test.com
Password: Test@123
```
You should be able to:
- View clinic dashboard
- Manage doctors
- View appointments

### Test Doctor Login
```
Mobile: 9999999993
OTP: 123456
```
You should be able to:
- View your schedule
- See availability
- Manage appointments

### Test Receptionist Login
```
Email: reception1@test.com
Password: Test@123
```
You should be able to:
- Book appointments
- Manage queue
- Register patients

---

## 🗑️ Clean Up Test Data

When you want to start fresh:

### Option 1: SQL (Recommended)
```sql
DELETE FROM users WHERE mobile LIKE '99999999%';
DELETE FROM clinics WHERE name LIKE 'Test %';
```

### Option 2: Admin Dashboard
Delete each test user one by one using the admin panel.

---

## 📁 Files

- **seed-test-data.js** - Main seed script
- **TEST_CREDENTIALS.md** - Detailed credentials list
- **CLEANUP_TEST_DATA.sql** - SQL to remove test data
- **HOW_TO_SEED_TEST_DATA.md** - This file

---

## 🐛 Troubleshooting

### Error: "Unique constraint failed on mobile"
**Solution**: Test data already exists. Run cleanup SQL first.

### Error: "Invalid dayOfWeek value"
**Solution**: Script has been fixed. Make sure you're using the latest version.

### No doctors showing in clinic
**Solution**: Check that doctor availability was created:
```sql
SELECT * FROM doctor_availability WHERE doctor_id IN (
  SELECT id FROM doctor_profiles WHERE user_id IN (
    SELECT id FROM users WHERE mobile LIKE '99999999%'
  )
);
```

---

## ✨ Ready to Test!

After seeding, you can immediately:
1. Login as any role
2. Book appointments
3. Manage schedules
4. Test the complete workflow

**See TEST_CREDENTIALS.md for full details!**
