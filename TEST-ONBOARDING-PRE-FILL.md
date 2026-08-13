# 🧪 Test Onboarding Pre-fill Feature

**Quick Test Guide for Clinic Partner Onboarding**

---

## 🚀 How to Test

### **Step 1: Register New Clinic Partner**

1. Go to: `http://localhost:3000/clinic-partner`
2. Click **"Create account"** in the modal
3. Enter:
   - **Full name:** `John Doe`
   - **Email:** `test@example.com`
   - ✅ Check "I agree to Terms of Service"
4. Click **"Continue"**
5. Enter OTP: `123456` (test mode)
6. Click **"Verify & Continue"**

**Expected:** User is created and redirected to onboarding

---

### **Step 2: Check Pre-filled Data**

You should now be at: `http://localhost:3000/clinic/onboarding/step-1`

**Look at the "Owner / administrator details" section:**

#### **Should See:**

```
┌─────────────────────────────────────────────────────────┐
│  Owner / administrator details                          │
│  Your registration details have been pre-filled.        │
│  Please verify and complete the mobile verification.    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Full Name *                                            │
│  ┌────────────────────────────────────────────────┐    │
│  │ John Doe                                       │    │ ← Editable
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Email Address *                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ test@example.com                          ✓    │    │ ← Disabled (gray)
│  └────────────────────────────────────────────────┘    │
│  ℹ️ This email is verified from your registration      │
│     and cannot be changed                              │
│                                                          │
│  Mobile Number *                                        │
│  ┌─────────────────────────────────────┬─────────┐    │
│  │ +91 |                               │ Verify  │    │
│  └─────────────────────────────────────┴─────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

### **Visual Checks:**
- [ ] **Owner name** shows `John Doe` (white background, editable)
- [ ] **Owner email** shows `test@example.com` (gray background, disabled)
- [ ] **Green checkmark (✓)** icon appears on right side of email field
- [ ] **Info text** appears below email: "This email is verified from your registration and cannot be changed"
- [ ] **Card header** text updated to mention "pre-filled"

### **Interaction Checks:**
- [ ] Try clicking email field → Should NOT be editable (cursor: not-allowed)
- [ ] Try editing name field → Should be editable ✅
- [ ] Mobile field is empty and ready for input ✅

### **Console Checks:**
Open browser console (F12), you should see:
```
[Step1] Pre-filled owner email from auth: test@example.com
[Step1] Pre-filled owner name from auth: John Doe
```

---

## 🧪 Additional Test Cases

### **Test 2: Page Refresh (LocalStorage Restore)**

1. Fill some clinic details:
   - Clinic name: `Test Clinic`
   - City: `Mumbai`
2. **Refresh the page** (F5)
3. **Check:**
   - [ ] Clinic name and city are restored ✅
   - [ ] Email still shows `test@example.com` ✅
   - [ ] Name still shows `John Doe` ✅

**Expected:** LocalStorage restores partial data, but email always comes from auth (not localStorage)

---

### **Test 3: Different User**

1. Logout (if possible) or open incognito window
2. Register with different credentials:
   - Name: `Jane Smith`
   - Email: `demo@example.com`
3. Complete OTP verification
4. Go to onboarding
5. **Check:**
   - [ ] Email shows `demo@example.com` (not the previous user)
   - [ ] Name shows `Jane Smith`

**Expected:** Each user sees their own registration data

---

### **Test 4: User Without Name (Edge Case)**

If registration somehow didn't capture name:

1. Backend creates user with:
   - email: `admin@test.com`
   - name: `null` or `undefined`
2. Go to onboarding
3. **Check:**
   - [ ] Email field is pre-filled and disabled ✅
   - [ ] Name field is empty but editable ✅
   - [ ] User can manually enter name

**Expected:** Email is always pre-filled, name can be added manually if missing

---

## 🎨 Visual Design Details

### **Email Field (Read-only):**
- Background color: `#F9FAFB` (light gray)
- Border: `#E5E7EB`
- Cursor: `not-allowed`
- Icon: Green checkmark on right side
- Help text: Blue info icon with gray text

### **Name Field (Editable):**
- Background color: `#FFFFFF` (white)
- Border: `#E5E7EB`
- Cursor: `text` (normal input)
- No icon

---

## 🐛 If Something Goes Wrong

### **Problem 1: Fields are Empty**
**Check:**
- Is the user authenticated? Open browser console and type:
  ```javascript
  JSON.parse(localStorage.getItem('pulsemate-auth-storage'))
  ```
- Should see user object with email and name

**Fix:**
- Re-register and complete OTP verification

---

### **Problem 2: Email is Editable (Should be Disabled)**
**Check:**
- Inspect email input element
- Should have `disabled` attribute

**Fix:**
- Clear browser cache
- Hard refresh (Ctrl+F5)

---

### **Problem 3: Old Email from Previous Session**
**Check:**
- LocalStorage might have old data

**Fix:**
- Clear localStorage:
  ```javascript
  localStorage.removeItem('clinic_onboarding_step1')
  ```
- Refresh page

---

## 📸 Expected Screenshots

### **Before (Old Flow):**
```
Registration Modal:
- User enters: test@example.com, John Doe
- Verifies OTP

Onboarding Form:
- Email field: EMPTY ❌
- Name field: EMPTY ❌
- User has to type again (duplicate work)
```

### **After (New Flow):**
```
Registration Modal:
- User enters: test@example.com, John Doe
- Verifies OTP

Onboarding Form:
- Email field: test@example.com ✅ (gray, disabled)
- Name field: John Doe ✅ (editable)
- User just needs to verify mobile and add clinic details
```

---

## 🎉 Success Criteria

✅ Email is pre-filled from registration  
✅ Email field is disabled (cannot be changed)  
✅ Green checkmark icon shows email is verified  
✅ Info text explains why email is locked  
✅ Name is pre-filled but editable  
✅ Mobile field is empty and ready for input  
✅ Card header mentions "pre-filled"  
✅ No duplicate data entry required  

---

**Test and verify all checklist items! 🚀**
