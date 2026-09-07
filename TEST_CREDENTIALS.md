# Test Data Credentials

## 🔐 Default Password
**All accounts use the same password**: `Test@123`

---

## 🏥 Clinic Owners (2)

### 1. Test Medical Center
- **Name**: Test Clinic Owner 1
- **Email**: clinic1@test.com
- **Mobile**: 9999999991
- **OTP**: 123456 (test number)
- **Password**: Test@123
- **Clinic**: Test Medical Center (Mumbai)
- **Specialties**: General Medicine, Cardiology
- **Hours**: 9:00 AM - 6:00 PM

### 2. Test Wellness Clinic
- **Name**: Test Clinic Owner 2
- **Email**: clinic2@test.com
- **Mobile**: 9999999992
- **OTP**: 123456 (test number)
- **Password**: Test@123
- **Clinic**: Test Wellness Clinic (Delhi)
- **Specialties**: Physiotherapy, Orthopedics
- **Hours**: 8:00 AM - 8:00 PM

---

## 👨‍⚕️ Doctors (4)

### 1. Dr. Test Kumar (Test Medical Center)
- **Email**: doctor1@test.com
- **Mobile**: 9999999993
- **OTP**: 123456 (test number)
- **Password**: Test@123
- **Specialization**: General Medicine
- **Qualification**: MBBS, MD
- **Experience**: 10 years
- **Fee**: ₹500
- **Consultation Time**: 15 minutes
- **Availability**: Mon-Fri, 9:00 AM - 1:00 PM

### 2. Dr. Test Sharma (Test Medical Center)
- **Email**: doctor2@test.com
- **Mobile**: 9999999994
- **OTP**: 123456 (test number)
- **Password**: Test@123
- **Specialization**: Cardiology
- **Qualification**: MBBS, MD (Cardiology)
- **Experience**: 15 years
- **Fee**: ₹800
- **Consultation Time**: 20 minutes
- **Availability**: Mon, Wed, Fri, Sat, 2:00 PM - 6:00 PM

### 3. Dr. Test Patel (Test Wellness Clinic)
- **Email**: doctor3@test.com
- **Mobile**: 9999999995
- **OTP**: 123456 (test number)
- **Password**: Test@123
- **Specialization**: Physiotherapy
- **Qualification**: BPT, MPT
- **Experience**: 8 years
- **Fee**: ₹400
- **Consultation Time**: 30 minutes
- **Availability**: Mon, Tue, Thu, Fri, Sat, 8:00 AM - 2:00 PM

### 4. Dr. Test Reddy (Test Wellness Clinic)
- **Email**: doctor4@test.com
- **Mobile**: 9999999996
- **OTP**: 123456 (test number)
- **Password**: Test@123
- **Specialization**: Orthopedics
- **Qualification**: MBBS, MS (Ortho)
- **Experience**: 12 years
- **Fee**: ₹700
- **Consultation Time**: 20 minutes
- **Availability**: Tue, Wed, Thu, Sat, Sun, 3:00 PM - 8:00 PM

---

## 👥 Receptionists (2)

### 1. Test Receptionist 1 (Test Medical Center)
- **Email**: reception1@test.com
- **Mobile**: 9999999997
- **OTP**: 123456 (test number)
- **Password**: Test@123
- **Clinic**: Test Medical Center

### 2. Test Receptionist 2 (Test Wellness Clinic)
- **Email**: reception2@test.com
- **Mobile**: 9999999998
- **OTP**: 123456 (test number)
- **Password**: Test@123
- **Clinic**: Test Wellness Clinic

---

## 📱 Test OTP Numbers

All these numbers will receive OTP code: **123456**

- 9999999991 (Clinic Owner 1)
- 9999999992 (Clinic Owner 2)
- 9999999993 (Doctor 1)
- 9999999994 (Doctor 2)
- 9999999995 (Doctor 3)
- 9999999996 (Doctor 4)
- 9999999997 (Receptionist 1)
- 9999999998 (Receptionist 2)

---

## 🏥 Clinic Details

### Test Medical Center (Mumbai)
- **Type**: Multi-Specialty
- **Specialties**: General Medicine, Cardiology
- **Consultation Modes**: In-Person, Video Call
- **Address**: Test Street, Building A, Mumbai, Maharashtra 400001
- **Hours**: 9:00 AM - 6:00 PM
- **Doctors**: Dr. Test Kumar, Dr. Test Sharma
- **Receptionist**: Test Receptionist 1

**Sessions:**
- Morning: 9:00 AM - 1:00 PM (20 patients)
- Evening: 2:00 PM - 6:00 PM (20 patients)

### Test Wellness Clinic (Delhi)
- **Type**: Specialty
- **Specialties**: Physiotherapy, Orthopedics
- **Consultation Modes**: In-Person
- **Address**: Test Avenue, Building B, Delhi, Delhi 110001
- **Hours**: 8:00 AM - 8:00 PM
- **Doctors**: Dr. Test Patel, Dr. Test Reddy
- **Receptionist**: Test Receptionist 2

**Sessions:**
- Morning: 9:00 AM - 1:00 PM (20 patients)
- Evening: 2:00 PM - 6:00 PM (20 patients)

---

## 🚀 How to Use

### Run the seed script:
```bash
cd backend
node seed-test-data.js
```

### Login Examples:

**Clinic Owner Login:**
```
Email: clinic1@test.com
Password: Test@123
```

**Doctor Login:**
```
Mobile: 9999999993
OTP: 123456
```

**Receptionist Login:**
```
Email: reception1@test.com
Password: Test@123
```

---

## ✅ What's Created:

- ✅ 2 Clinics (fully verified and active)
- ✅ 2 Clinic Owners (verified accounts)
- ✅ 4 Doctors (verified, with profiles and availability)
- ✅ 2 Receptionists (active accounts)
- ✅ Doctor-Clinic relationships (all doctors linked to clinics)
- ✅ Doctor availability schedules (for each day)
- ✅ Clinic sessions (Morning & Evening for both clinics)
- ✅ Clinic staff records (all staff linked to clinics)

---

## 🔧 Reset Test Data

To remove all test data and start fresh:
```bash
# In Supabase SQL Editor, run:
DELETE FROM users WHERE mobile LIKE '99999999%';
DELETE FROM clinics WHERE name LIKE 'Test %';
```

Then run the seed script again!
