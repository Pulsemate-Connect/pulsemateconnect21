# 🔐 Test Clinic - Complete Login Credentials

## 📱 For Mobile App (OTP + Email Login)

### 👨‍⚕️ **Doctor 1: Dr. Amit Sharma (Cardiologist)**

**Email Login:**
- Email: `dr.sharma@test.com`
- Password: `Doctor123!`

**Mobile/OTP Login:**
- Mobile: `9876543201`
- OTP: `123456` (test OTP - enabled in development)

**Details:**
- Specialization: Cardiology
- Consultation Fee: ₹800
- Availability: 9:00 AM - 1:00 PM (Monday-Saturday)
- Clinic: PulseMate Multi-Specialty Clinic

---

### 👩‍⚕️ **Doctor 2: Dr. Priya Patel (Orthopedic)**

**Email Login:**
- Email: `dr.patel@test.com`
- Password: `Doctor123!`

**Mobile/OTP Login:**
- Mobile: `9876543202`
- OTP: `123456` (test OTP)

**Details:**
- Specialization: Orthopedics
- Consultation Fee: ₹700
- Availability: 5:00 PM - 10:00 PM (Monday-Saturday)
- Clinic: PulseMate Multi-Specialty Clinic

---

## 💻 For Web Dashboard (Clinic Portal)

### 👩‍💼 **Receptionist: Sneha Reddy**

**Email Login:**
- Email: `reception@test.com`
- Password: `Reception123!`

**Mobile/OTP Login:**
- Mobile: `9876543203`
- OTP: `123456` (test OTP)

**Access:**
- Manage walk-in patients
- View appointments
- Update queue status
- Check-in patients
- Clinic: PulseMate Multi-Specialty Clinic

---

### 🏥 **Clinic Owner: Dr. Rajesh Kumar**

**Email Login:**
- Email: `clinic.owner@test.com`
- Password: `Owner123!`

**Mobile/OTP Login:**
- Mobile: `9876543210`
- OTP: `123456` (test OTP)

**Access:**
- Full clinic management
- Add/remove doctors
- Manage staff (receptionists)
- View all appointments
- Financial reports
- Clinic settings
- Clinic: PulseMate Multi-Specialty Clinic

---

## 🔧 Admin Panel (Super Admin)

### **Admin 1:**
- Email: `shubham27052002@gmail.com`
- Password: `Shubham27*`
- Access: Full system admin

### **Admin 2:**
- Email: `sahilnaik1515@gmail.com`
- Password: `Nkabu18$`
- Access: Full system admin

---

## 📱 Test Patient

### **Patient: Akshata**

**Mobile/OTP Login:**
- Mobile: `9663080521`
- OTP: `123456` (test OTP)

**Status:**
- Free booking: Already used on September 3, 2026
- Next booking: Requires ₹10 platform fee payment

---

## 🏥 Clinic Information

**Clinic Name:** PulseMate Multi-Specialty Clinic  
**Clinic ID:** `test-clinic-complete-001`  
**Location:** 123, MG Road, Koramangala, Bangalore, Karnataka - 560034  
**Phone:** 08012345678  
**Status:** Verified & Active ✅  

**Operating Hours:** 9:00 AM - 10:00 PM

**Sessions:**
- **Morning Session:** 9:00 AM - 1:00 PM (Max: 20 patients)
- **Evening Session:** 5:00 PM - 10:00 PM (Max: 30 patients)

**Specialties:**
- General Medicine
- Cardiology (Dr. Amit Sharma)
- Orthopedics (Dr. Priya Patel)
- Pediatrics

**Facilities:**
- X-Ray
- ECG
- Lab Tests
- Pharmacy
- Ambulance

**Payment Methods:**
- Cash
- UPI
- Card
- Razorpay

---

## 🧪 How to Login

### **Mobile App (Patient/Doctor):**

**Option 1: Phone/OTP Login**
1. Open PulseMate app
2. Select "Login with Phone"
3. Enter mobile number (from list above)
4. Enter OTP: `123456`
5. Login successful ✅

**Option 2: Email/Password Login**
1. Open PulseMate app
2. Select "Login with Email"
3. Enter email and password (from list above)
4. Login successful ✅

---

### **Web Dashboard (Clinic Owner/Receptionist):**

1. Go to clinic dashboard URL:
   - Production: `https://clinic.pulsemateconnect.in`
   - Local: `http://localhost:3000`
2. Click "Login"
3. Enter email and password
4. Access dashboard ✅

---

## 📋 Quick Reference Table

| Role | Name | Email | Password | Mobile | OTP |
|------|------|-------|----------|--------|-----|
| Doctor (Cardiology) | Dr. Amit Sharma | dr.sharma@test.com | Doctor123! | 9876543201 | 123456 |
| Doctor (Orthopedic) | Dr. Priya Patel | dr.patel@test.com | Doctor123! | 9876543202 | 123456 |
| Receptionist | Sneha Reddy | reception@test.com | Reception123! | 9876543203 | 123456 |
| Clinic Owner | Dr. Rajesh Kumar | clinic.owner@test.com | Owner123! | 9876543210 | 123456 |
| Patient | Akshata | - | - | 9663080521 | 123456 |
| Admin 1 | - | shubham27052002@gmail.com | Shubham27* | - | - |
| Admin 2 | - | sahilnaik1515@gmail.com | Nkabu18$ | - | - |

---

## 🔑 Test OTP System

Your backend is configured with test OTP enabled:

```env
ENABLE_TEST_OTP=true
TEST_OTP_CODE=123456
```

**How it works:**
1. Any test mobile number can use OTP: `123456`
2. Works for all the mobile numbers listed above
3. No actual SMS is sent (dev/test mode)
4. Instant login without waiting for real OTP

**Test Mobile Numbers (Pre-configured):**
- `9999999999` - Generic test
- `7777777777` - Generic test
- `1234567890` - Generic test
- `9876543210` - Clinic Owner
- `9876543201` - Dr. Amit Sharma
- `9876543202` - Dr. Priya Patel
- `9876543203` - Sneha (Receptionist)
- `9663080521` - Akshata (Patient)

---

## 🎯 Testing Workflows

### **Test Doctor Login (Mobile App):**
1. Open app → "Login with Phone"
2. Enter: `9876543201` (Dr. Sharma)
3. OTP: `123456`
4. ✅ Access doctor dashboard

### **Test Receptionist Login (Web):**
1. Go to clinic dashboard
2. Email: `reception@test.com`
3. Password: `Reception123!`
4. ✅ Access receptionist panel

### **Test Clinic Owner Login (Web):**
1. Go to clinic dashboard
2. Email: `clinic.owner@test.com`
3. Password: `Owner123!`
4. ✅ Full clinic management access

### **Test Patient Booking:**
1. Login as patient: `9663080521`
2. Find clinic: "PulseMate Multi-Specialty Clinic"
3. Select doctor: Dr. Amit Sharma or Dr. Priya Patel
4. Choose date & time slot
5. Complete ₹10 payment (Razorpay)
6. ✅ Appointment confirmed + notification

---

## 📊 Account Status

| Account | Status | Verified | Active |
|---------|--------|----------|--------|
| Dr. Amit Sharma | ✅ Complete | ✅ Yes | ✅ Yes |
| Dr. Priya Patel | ✅ Complete | ✅ Yes | ✅ Yes |
| Sneha Reddy | ✅ Complete | ✅ Yes | ✅ Yes |
| Dr. Rajesh Kumar | ✅ Complete | ✅ Yes | ✅ Yes |
| PulseMate Clinic | ✅ Complete | ✅ Yes | ✅ Yes |
| Akshata (Patient) | ✅ Active | ✅ Yes | ✅ Yes |

---

## 🚀 All Systems Ready!

✅ 2 Doctors created and verified  
✅ 1 Receptionist assigned  
✅ 1 Clinic owner setup  
✅ 1 Clinic verified and active  
✅ Morning & Evening sessions configured  
✅ Doctor availability: Mon-Sat (9 AM - 10 PM)  
✅ Test patient with booking history  
✅ Test OTP system enabled  
✅ All accounts active and ready to use  

**Start testing now! 🎉**
