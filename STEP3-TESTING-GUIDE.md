# 🧪 Step 3: Clinic Documents - Testing Guide

**Date:** August 13, 2026  
**Status:** Ready for Testing

---

## 🚀 Quick Start

### **Prerequisites**
1. ✅ Backend running on `http://localhost:5000`
2. ✅ Frontend running on `http://localhost:3000`
3. ✅ Complete Steps 1 & 2 first (required to access Step 3)

### **How to Access Step 3**
1. Open browser: `http://localhost:3000`
2. Click "Clinic Partner" or navigate to `/clinic/partner`
3. Register with email OTP (or login if already registered)
4. Complete Step 1 (Clinic Information)
5. Complete Step 2 (Services & Operations)
6. Click "Next" → Auto-navigates to Step 3

---

## ✅ Test Scenarios

### **1. Document Upload Tests**

#### **Test 1.1: Upload Valid PDF**
- [ ] Click on "Clinic Registration Certificate" upload area
- [ ] Select a PDF file (< 5MB)
- [ ] ✅ **Expected:** Green checkmark appears, file name displayed
- [ ] ✅ **Expected:** File size shown (e.g., "2.4 MB")

#### **Test 1.2: Upload Valid Image**
- [ ] Click on "Owner ID Proof" upload area
- [ ] Select a JPG/PNG file (< 2MB)
- [ ] ✅ **Expected:** Green checkmark appears, preview shown

#### **Test 1.3: Upload Oversized File**
- [ ] Select a file > 5MB
- [ ] ✅ **Expected:** Alert: "File size must be less than 5MB"
- [ ] ✅ **Expected:** File NOT uploaded

#### **Test 1.4: Upload Invalid File Type**
- [ ] Try to upload a .docx or .txt file
- [ ] ✅ **Expected:** Error message: "Only PDF, JPG, PNG files are allowed"

#### **Test 1.5: Drag & Drop**
- [ ] Drag a PDF file and hover over upload area
- [ ] ✅ **Expected:** Border turns blue
- [ ] Drop the file
- [ ] ✅ **Expected:** File uploaded successfully

#### **Test 1.6: Remove Uploaded File**
- [ ] Upload a file
- [ ] Click the "X" (remove) button
- [ ] ✅ **Expected:** File removed, upload area resets

#### **Test 1.7: Multiple Clinic Photos**
- [ ] Upload 1st clinic photo
- [ ] ✅ **Expected:** Shows in list with checkmark
- [ ] Upload 2nd photo
- [ ] ✅ **Expected:** Shows below 1st photo
- [ ] Upload 3rd photo
- [ ] ✅ **Expected:** Shows below 2nd photo
- [ ] Try to upload 4th photo
- [ ] ✅ **Expected:** Error: "Maximum 3 photos allowed"

---

### **2. Text Field Validation Tests**

#### **Test 2.1: Registration Number (Required)**
- [ ] Leave "Clinic Registration Number" empty
- [ ] Click "Next"
- [ ] ✅ **Expected:** Red border, error message
- [ ] Fill with "REG12345"
- [ ] ✅ **Expected:** Error clears

#### **Test 2.2: Date Validation**
- [ ] Select "License Issue Date": 2025-01-15
- [ ] Select "License Expiry Date": 2024-01-15 (earlier than issue)
- [ ] ✅ **Expected:** Error: "Expiry date must be after issue date"
- [ ] Change expiry to 2028-01-15
- [ ] ✅ **Expected:** Error clears

#### **Test 2.3: GST Number Format**
- [ ] Enter invalid GST: "123456789"
- [ ] ✅ **Expected:** Error: "Invalid GST number format"
- [ ] Enter valid GST: "29ABCDE1234F1Z5"
- [ ] ✅ **Expected:** Error clears
- [ ] Leave blank (optional field)
- [ ] ✅ **Expected:** No error

---

### **3. Form Submission Tests**

#### **Test 3.1: Submit Without Mandatory Docs**
- [ ] Fill registration number
- [ ] Leave mandatory documents empty
- [ ] Click "Next"
- [ ] ✅ **Expected:** Red error summary box appears
- [ ] ✅ **Expected:** Lists missing documents
- [ ] ✅ **Expected:** "Next" button disabled or shows errors

#### **Test 3.2: Submit With All Mandatory Fields**
- [ ] Upload all 3 mandatory documents
- [ ] Fill registration number
- [ ] Click "Next"
- [ ] ✅ **Expected:** Loading spinner on button
- [ ] ✅ **Expected:** Success toast: "Clinic documents saved successfully!"
- [ ] ✅ **Expected:** (Will show "Step 4 coming soon" for now)

#### **Test 3.3: Submit With Optional Fields**
- [ ] Upload GST certificate
- [ ] Upload 2 clinic photos
- [ ] Fill GST number: "29ABCDE1234F1Z5"
- [ ] Fill license dates
- [ ] Click "Next"
- [ ] ✅ **Expected:** All fields saved to database

---

### **4. Auto-Save Tests**

#### **Test 4.1: LocalStorage Auto-Save**
- [ ] Fill registration number: "TEST123"
- [ ] Wait 1 second
- [ ] Open browser DevTools → Application → Local Storage
- [ ] ✅ **Expected:** Key `clinic_onboarding_step3` exists
- [ ] ✅ **Expected:** Contains `{"clinicRegistrationNumber":"TEST123"}`

#### **Test 4.2: LocalStorage Restoration**
- [ ] Fill all text fields
- [ ] Refresh page (F5)
- [ ] ✅ **Expected:** Text fields restored from localStorage
- [ ] ✅ **Expected:** Toast: "Restored your previous progress"
- [ ] ✅ **Expected:** Files NOT restored (as expected)

#### **Test 4.3: LocalStorage Cleanup**
- [ ] Complete Step 3 successfully
- [ ] Check LocalStorage
- [ ] ✅ **Expected:** `clinic_onboarding_step3` key deleted

---

### **5. Backend Integration Tests**

#### **Test 5.1: Database Save**
- [ ] Complete Step 3
- [ ] Check database (Prisma Studio or SQL client)
- [ ] Query: `SELECT "clinicOnboardingData" FROM "User" WHERE email = 'your-email@example.com'`
- [ ] ✅ **Expected:** JSON contains `clinicDocuments` object
- [ ] ✅ **Expected:** File URLs start with `https://res.cloudinary.com/` (production)
- [ ] ✅ **Expected:** `lastUpdatedStep` = "clinicDocuments"

#### **Test 5.2: Cloudinary Upload (Production)**
- [ ] Upload a document
- [ ] Check browser Network tab
- [ ] ✅ **Expected:** POST to `/api/auth/clinic-owner/save-clinic-documents`
- [ ] ✅ **Expected:** Response contains Cloudinary URLs
- [ ] Copy URL from response
- [ ] Open URL in new browser tab
- [ ] ✅ **Expected:** File displays/downloads correctly

#### **Test 5.3: Multiple Files**
- [ ] Upload 3 clinic photos
- [ ] Submit form
- [ ] Check database
- [ ] ✅ **Expected:** `clinicPhotos` is an array with 3 URLs
- [ ] ✅ **Expected:** All 3 URLs are accessible

---

### **6. UI/UX Tests**

#### **Test 6.1: Responsive Design**
- [ ] Resize browser to mobile width (375px)
- [ ] ✅ **Expected:** Layout adapts, cards stack vertically
- [ ] ✅ **Expected:** Upload areas remain usable
- [ ] ✅ **Expected:** Date pickers work on mobile

#### **Test 6.2: Visual Feedback**
- [ ] Hover over upload area
- [ ] ✅ **Expected:** Border color changes
- [ ] Drag file over upload area
- [ ] ✅ **Expected:** Blue border, blue background
- [ ] Upload file successfully
- [ ] ✅ **Expected:** Green border, green checkmark

#### **Test 6.3: Info Boxes**
- [ ] Check blue info box in Mandatory section
- [ ] ✅ **Expected:** Lists document requirements
- [ ] Check amber box in Optional section
- [ ] ✅ **Expected:** Explains benefits of optional docs

---

### **7. Navigation Tests**

#### **Test 7.1: Back Navigation**
- [ ] Click browser back button
- [ ] ✅ **Expected:** Returns to Step 2
- [ ] ✅ **Expected:** Step 2 data still present
- [ ] Click "Next" from Step 2
- [ ] ✅ **Expected:** Returns to Step 3
- [ ] ✅ **Expected:** Text fields restored (not files)

#### **Test 7.2: Progress Indicator**
- [ ] Check OnboardingLayout header
- [ ] ✅ **Expected:** Step 3 highlighted
- [ ] ✅ **Expected:** Steps 1 & 2 marked as completed

#### **Test 7.3: Save & Exit**
- [ ] Fill some fields
- [ ] Click "Save & Exit" (if button exists)
- [ ] ✅ **Expected:** Data saved
- [ ] ✅ **Expected:** Navigates to dashboard

---

## 🔍 Database Verification

### **Check Database Directly**

**Using Prisma Studio:**
```bash
cd backend
npx prisma studio
```
- Open `User` model
- Find your test user
- Click on `clinicOnboardingData` field
- ✅ **Verify:** Has 3 keys: `clinicInformation`, `servicesOperations`, `clinicDocuments`

**Expected Structure:**
```json
{
  "clinicInformation": { /* 20 fields */ },
  "servicesOperations": { /* 8 fields */ },
  "clinicDocuments": {
    "clinicRegistrationCertificate": "https://res.cloudinary.com/.../cert.pdf",
    "medicalLicense": "https://res.cloudinary.com/.../license.pdf",
    "ownerIdProof": "https://res.cloudinary.com/.../id.jpg",
    "gstCertificate": "https://res.cloudinary.com/.../gst.pdf" | null,
    "clinicPhotos": ["url1", "url2"] | null,
    "clinicRegistrationNumber": "REG12345",
    "licenseIssueDate": "2023-01-15",
    "licenseExpiryDate": "2028-01-15",
    "gstNumber": "29ABCDE1234F1Z5" | null,
    "completedAt": "2026-08-13T05:30:00.000Z"
  },
  "lastUpdatedStep": "clinicDocuments",
  "lastUpdatedAt": "2026-08-13T05:30:00.000Z"
}
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: Files Not Uploading**
**Symptoms:** Upload area doesn't respond, no file selected
**Solutions:**
- Check file size (< 5MB for docs, < 2MB for photos)
- Check file type (only PDF, JPG, PNG)
- Check browser console for errors
- Verify Cloudinary env vars set in backend `.env`

### **Issue 2: "Route Not Found" Error**
**Symptoms:** POST request returns 404
**Solutions:**
- Verify backend server restarted after code changes
- Check route in `backend/src/routes/auth.routes.js`
- Check URL: `http://localhost:5000/api/auth/clinic-owner/save-clinic-documents`

### **Issue 3: Validation Errors Persist**
**Symptoms:** Can't click "Next" even with all fields filled
**Solutions:**
- Open browser console, check for validation errors
- Verify GST number format: `29ABCDE1234F1Z5` (15 chars)
- Verify expiry date > issue date
- Check that all 3 mandatory docs uploaded

### **Issue 4: LocalStorage Not Restoring**
**Symptoms:** Text fields empty after refresh
**Solutions:**
- Check browser DevTools → Application → Local Storage
- Look for key: `clinic_onboarding_step3`
- If missing, auto-save may not be working (check console)

---

## 📊 Test Results Template

Copy this template to document your test results:

```
## Step 3 Testing Results

**Date:** _______________
**Tester:** _______________
**Environment:** Development / Production

### Document Upload Tests
- [ ] Upload PDF: PASS / FAIL
- [ ] Upload Image: PASS / FAIL
- [ ] File size validation: PASS / FAIL
- [ ] File type validation: PASS / FAIL
- [ ] Drag & drop: PASS / FAIL
- [ ] Remove file: PASS / FAIL
- [ ] Multiple photos: PASS / FAIL

### Text Field Validation
- [ ] Registration number required: PASS / FAIL
- [ ] Date validation: PASS / FAIL
- [ ] GST format validation: PASS / FAIL

### Form Submission
- [ ] Submit without mandatory docs: PASS / FAIL
- [ ] Submit with all fields: PASS / FAIL
- [ ] Database save: PASS / FAIL

### Auto-Save
- [ ] LocalStorage save: PASS / FAIL
- [ ] LocalStorage restore: PASS / FAIL
- [ ] LocalStorage cleanup: PASS / FAIL

### Backend Integration
- [ ] Cloudinary upload: PASS / FAIL
- [ ] Database structure: PASS / FAIL
- [ ] File URLs accessible: PASS / FAIL

### UI/UX
- [ ] Responsive design: PASS / FAIL
- [ ] Visual feedback: PASS / FAIL
- [ ] Info boxes display: PASS / FAIL

### Navigation
- [ ] Back navigation: PASS / FAIL
- [ ] Progress indicator: PASS / FAIL

**Overall Status:** PASS / FAIL
**Notes:** _______________
```

---

## 🎯 Success Criteria

Step 3 is considered **PASSING** if:
- ✅ All 3 mandatory documents upload successfully
- ✅ Optional documents upload (or skip) without errors
- ✅ Text fields validate correctly
- ✅ Form submits and saves to database
- ✅ LocalStorage auto-save works
- ✅ Files stored in Cloudinary (or local in dev)
- ✅ File URLs accessible via browser
- ✅ Navigation works (back/forward)
- ✅ UI is responsive and user-friendly
- ✅ No console errors

---

**Ready to Test!** 🚀

**Next:** Report any bugs or issues found during testing.
