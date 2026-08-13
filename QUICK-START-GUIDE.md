# ⚡ Quick Start Guide - Resume Development

**Current Status:** Frontend 100% complete, Database paused

---

## 🚨 STEP 1: Wake Up Database (MUST DO FIRST)

### Option A: Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Find: **PulseMate Connect** project
3. Click: **"Resume"** button
4. Wait: 30-60 seconds

### Option B: Check if Already Running
```cmd
cd backend
npm run dev
```

**Look for:**
- ✅ "Database connected successfully" → Already running!
- ❌ "Can't reach database server" → Need to resume from dashboard

---

## 🚀 STEP 2: Start Development Servers

### Terminal 1 - Backend
```cmd
cd c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\backend
npm run dev
```

**Expected Output:**
```
✅ Database connected successfully
✅ Server running on http://localhost:5000
```

### Terminal 2 - Frontend
```cmd
cd c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\frontend
npm run dev
```

**Expected Output:**
```
✅ Local: http://localhost:3000/
```

---

## 🧪 STEP 3: Test Registration Flow

### Test Email OTP Registration
1. Open: http://localhost:3000/clinic-partner
2. Click: **"Get Started"** button
3. Select: **"Register"** tab
4. Enter:
   - Full Name: `Test Clinic Owner`
   - Email: `test@example.com`
5. Click: **"Send OTP"**
6. Enter OTP: `123456`
7. Click: **"Verify & Register"**

**Expected:** Navigate to onboarding form with email pre-filled

---

## 📝 STEP 4: Test Onboarding Form

### Fill Required Fields
1. **Clinic Details:**
   - Clinic Name: `Test Medical Clinic`
   - Clinic Type: `Hospital`
   
2. **Owner Details:**
   - Email: Already filled (read-only) ✅
   - Name: Already filled (editable)
   - Mobile: `9999999999`
   - Click "Send OTP" → Enter `123456` → Verify

3. **Location:**
   - **Option 1:** Click on map
   - **Option 2:** Type coordinates:
     - Latitude: `28.6139`
     - Longitude: `77.2090`
     - Tab out to update map

4. **Address:**
   - Area/Locality: `Connaught Place`
   - City: `New Delhi`
   - Pincode: `110001`
   - State: `Delhi`

5. Click: **"Continue"**

---

## ✅ WHAT TO VERIFY

### Registration Modal
- [x] Email input visible (no mobile field)
- [x] OTP sent to email
- [x] 60-second resend timer
- [x] Exit confirmation dialog on OTP view

### Onboarding Form
- [x] Email pre-filled and read-only (green checkmark)
- [x] Name pre-filled and editable
- [x] Labels inside inputs as placeholders
- [x] Professional icons (Lucide React)
- [x] Coordinate inputs are editable
- [x] Map updates when coordinates typed
- [x] No info boxes on location card
- [x] Locality field is required
- [x] Address fields follow Indian format

---

## 🐛 TROUBLESHOOTING

### Database Error
**Error:** `Can't reach database server`  
**Fix:** Resume database from Supabase dashboard

### OTP Not Received (Real Email)
**Error:** OTP not arriving for non-test emails  
**Fix:** Check `backend/.env` for `RESEND_API_KEY`

### Coordinate Input Not Working
**Error:** Can't type in coordinate fields  
**Status:** Fixed! Using local state now  
**Action:** Restart frontend if issue persists

### Map Not Updating
**Error:** Typing coordinates doesn't move map  
**Action:** Make sure to **Tab out** after typing

### Form Not Submitting
**Error:** "Please fix errors" message  
**Check:** 
- Mobile number verified?
- Location selected?
- Locality field filled?

---

## 📦 BACKEND UPDATES NEEDED (After Testing)

### 1. Add Locality Column
```sql
-- Run in Supabase SQL Editor
ALTER TABLE clinics ADD COLUMN locality VARCHAR(200);
```

### 2. Update Clinic Controller
File: `backend/src/controllers/clinic.controller.js`

Find validation schema and update:
```javascript
// Make these optional
addressLine1: Yup.string().max(200).optional(),
addressLine2: Yup.string().max(200).optional(),

// Add this required field
locality: Yup.string()
  .min(3, 'Locality must be at least 3 characters')
  .max(200, 'Locality must not exceed 200 characters')
  .required('Locality is required'),
```

---

## 📚 DOCUMENTATION

**Full Details:**
- `CONTEXT-TRANSFER-SUMMARY.md` - Complete implementation summary
- `COORDINATE-INPUTS-COMPLETE.md` - Coordinate input details
- `DATABASE-RESUME-INSTRUCTIONS.md` - Database troubleshooting
- `ONBOARDING-UI-REDESIGN-COMPLETE.md` - UI redesign documentation
- `EMAIL-OTP-REGISTRATION-COMPLETE.md` - Email OTP flow

---

## 🎯 WHAT'S WORKING NOW

### ✅ Complete Features
- Email OTP registration (no mobile in registration)
- Professional onboarding UI (Zomato-inspired)
- Manual coordinate entry with map sync
- Indian address format with locality field
- Form validation and localStorage persistence
- Test email bypass for development

### 🔄 Needs Testing
- End-to-end registration → onboarding → submission
- Database save with locality field
- Coordinate input functionality

### ⏳ Optional Enhancements
- Geocoding API for reverse address lookup
- "Use current location" button
- Map search functionality
- Address autocomplete

---

## 💡 TIPS

1. **Use Test Emails:** `test@example.com`, `demo@example.com`, `admin@test.com`
2. **Use Test OTP:** `123456` for all test emails
3. **Save Progress:** Form auto-saves to localStorage
4. **Console Logs:** Check browser console for debug info
5. **Database Activity:** Free tier pauses after 7 days inactivity

---

**Ready to test?** Resume your database and start development! 🚀

**Need help?** Check the troubleshooting section or full documentation files.
