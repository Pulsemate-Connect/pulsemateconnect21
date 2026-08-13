# 🚀 Quick Start Guide - Testing Clinic Onboarding

**Last Updated:** August 13, 2026

---

## 🎯 Quick Test (5 Minutes)

### **1. Start Servers**

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```
*Should run on http://localhost:5000*

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```
*Should run on http://localhost:3000*

---

### **2. Test Complete Flow**

#### **Access the Onboarding:**
```
http://localhost:3000/clinic/onboarding/step-1
```

#### **Use Test Credentials:**
- **Phone:** `9999999999`
- **OTP:** `123456`
- **Email:** Use any valid email (you'll receive real OTP)

---

### **3. Step-by-Step Testing**

#### **Step 1: Clinic Information** ✅
Fill in:
- Clinic Name: "Test Clinic"
- Clinic Type: Select any
- Display Name: "Test Display"
- Owner Name: "John Doe"
- Owner Email: [your-test-email@example.com]
- Owner Mobile: 9999999999
- Primary Contact: 9999999999
- Click on map to set location
- Fill address fields

**Expected:** Saves to DB, navigates to Step 2

---

#### **Step 2: Services & Operations** ✅
Fill in:
- Specialties: Check 2-3 options
- Consultation Types: Check at least 1
- Opening Time: 9:00 AM
- Closing Time: 6:00 PM
- Weekly Off: Check Sunday
- Appointment Mode: Select one

**Expected:** Saves to DB, navigates to Step 3

---

#### **Step 3: Clinic Documents** ✅
Upload:
- Clinic Registration Certificate (required)
- Medical License (required)
- Owner ID Proof (required)
- GST Certificate (optional)
- Clinic Photos (all optional but recommended)

**Expected:** Full-screen loading → Files upload → Saves to DB → Navigates to Step 4

---

#### **Step 4: Partner Agreement** ✅
Actions:
1. Scroll through terms to bottom
2. Scroll indicator disappears
3. Check "I accept" checkbox
4. Click "Submit Application"

**Expected:** 
- Loading overlay appears
- Success modal shows with next steps
- Click "Go to Dashboard"
- Navigate to Success page
- User status changed to PENDING in database

---

### **4. Verify in Database**

Open Prisma Studio:
```bash
cd backend
npx prisma studio
```

Check User table:
- Find user with phone: 9999999999
- Verify `approvalStatus` = `PENDING`
- Verify `isPhoneVerified` = true
- Verify `isEmailVerified` = true
- Check `clinicOnboardingData` JSON field has all 4 sections:
  - clinicInformation ✅
  - servicesOperations ✅
  - clinicDocuments ✅
  - partnerAgreement ✅

---

## 🐛 Common Issues & Fixes

### **Issue: Map not showing**
**Fix:** Check Google Maps API key in `.env`
```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### **Issue: File upload fails**
**Fix:** Check Cloudinary config or ensure `uploads/clinic-owner/` folder exists
```bash
mkdir -p backend/uploads/clinic-owner
```

### **Issue: Email OTP not received**
**Fix:** Check email service configuration in `backend/.env`

### **Issue: Phone verification fails**
**Fix:** Check Firebase configuration in `backend/.env`

### **Issue: Database connection error**
**Fix:** Check DATABASE_URL in `backend/.env` and run migrations:
```bash
cd backend
npx prisma migrate deploy
```

---

## 📊 Test Checklist

### **Phone Verification:**
- [ ] Enter phone number
- [ ] Receive OTP modal
- [ ] Verify with correct OTP
- [ ] Verify with wrong OTP (should error)
- [ ] Test resend OTP with countdown

### **Email Verification:**
- [ ] Enter email
- [ ] Receive OTP email
- [ ] Verify with correct OTP
- [ ] Test resend with 60s countdown
- [ ] Verify OTP boxes clear on resend

### **Step 1:**
- [ ] Fill all required fields
- [ ] Test validation (leave required fields empty)
- [ ] Select location on map
- [ ] Verify lat/lng auto-filled
- [ ] Click Next
- [ ] Verify data saved to DB

### **Step 2:**
- [ ] Select specialties
- [ ] Select consultation types
- [ ] Set operating hours
- [ ] Select weekly off days
- [ ] Click Next
- [ ] Verify data saved to DB

### **Step 3:**
- [ ] Upload required documents (3)
- [ ] Upload optional document (GST)
- [ ] Upload clinic photos (4)
- [ ] Fill optional text fields
- [ ] Click Next
- [ ] Verify loading overlay shows
- [ ] Verify files uploaded
- [ ] Verify data saved to DB

### **Step 4:**
- [ ] Scroll through terms
- [ ] Verify scroll indicator disappears
- [ ] Check "I accept" checkbox
- [ ] Verify Submit button enables
- [ ] Click Submit
- [ ] Verify loading overlay
- [ ] Verify success modal appears
- [ ] Verify modal content is correct
- [ ] Click "Go to Dashboard"
- [ ] Verify success page shows
- [ ] Verify user status = PENDING in DB

---

## 🎨 Visual Checks

### **Responsive Design:**
- [ ] Test on mobile (360px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify map doesn't overlap bottom bar
- [ ] Verify forms are readable on all sizes

### **UI/UX:**
- [ ] Floating labels work correctly
- [ ] Progress indicator shows correct step
- [ ] Completed steps have checkmarks
- [ ] Error messages display clearly
- [ ] Loading states show properly
- [ ] Success animations play smoothly

---

## 📝 Quick SQL Queries

### **Check latest submission:**
```sql
SELECT 
  id, 
  name, 
  email, 
  mobile, 
  approvalStatus,
  isPhoneVerified,
  isEmailVerified,
  createdAt,
  updatedAt
FROM "User" 
WHERE role = 'CLINIC_OWNER'
ORDER BY updatedAt DESC 
LIMIT 1;
```

### **View onboarding data:**
```sql
SELECT 
  id,
  name,
  mobile,
  clinicOnboardingData
FROM "User"
WHERE mobile = '9999999999';
```

### **Count pending applications:**
```sql
SELECT COUNT(*) as pending_count
FROM "User"
WHERE role = 'CLINIC_OWNER' 
AND approvalStatus = 'PENDING';
```

---

## 🚀 Production Deployment

Before deploying:
1. Update placeholder contact info (see CLINIC-ONBOARDING-COMPLETE.md)
2. Configure Cloudinary for production
3. Set up proper authentication
4. Update rate limiting values
5. Test on staging environment
6. Perform security audit
7. Set up monitoring

---

## 📞 Support

**Issues?** Check:
1. `CLINIC-ONBOARDING-COMPLETE.md` - Full documentation
2. `STEP4-IMPLEMENTATION-COMPLETE.md` - Step 4 details
3. Backend logs in terminal
4. Browser console for errors
5. Network tab for API calls

**Test Numbers:**
- 9999999999
- 8888888888  
- 7777777777

**Test OTP:** 123456

---

**Happy Testing! 🎉**

---

**Document Version:** 1.0  
**Last Updated:** August 13, 2026
