# ✅ Mobile Number Re-Edit & Re-Verification Feature

**Feature:** Allow users to change and re-verify mobile number after initial verification  
**Status:** ✅ COMPLETE & READY TO TEST

---

## 🎯 WHAT IT DOES

After successfully verifying a mobile number, users can:
1. **Click "Change" button** to unlock the mobile number field
2. **Edit the mobile number** manually
3. **Click "Verify" again** to send OTP to the new number
4. **Complete verification** for the new number

---

## 🎨 VISUAL BEHAVIOR

### State 1: Unverified (Initial)
```
┌────────────────────────────────────────┐
│ +91 [9999999999] [Verify Button]       │
└────────────────────────────────────────┘
```

### State 2: Verified
```
┌────────────────────────────────────────┐
│ +91 [9999999999] ✓ Verified [Change]  │
│         (gray, disabled)                │
└────────────────────────────────────────┘
✓ Mobile number verified successfully
```

### State 3: After Clicking "Change"
```
┌────────────────────────────────────────┐
│ +91 [9999999999] [Verify Button]       │
│         (white, editable)               │
└────────────────────────────────────────┘
```
**User can now:**
- Edit the number
- Enter new number
- Click "Verify" to verify new number

---

## 🔄 USER FLOW

### Complete Flow
```
1. Enter mobile: 9999999999
   ↓
2. Click "Verify" → OTP sent
   ↓
3. Enter OTP → Verified ✓
   ↓
4. Field becomes gray (disabled)
   ↓
5. Shows: "✓ Verified" badge + "Change" button
   ↓
6. User clicks "Change"
   ↓
7. Field becomes white (editable)
   ↓
8. Badge disappears, "Verify" button appears
   ↓
9. User edits number: 8888888888
   ↓
10. Click "Verify" → OTP sent to new number
   ↓
11. Enter OTP → New number verified ✓
```

---

## 🎨 UI COMPONENTS

### Verified Badge (Green)
```jsx
<div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl border border-green-200">
  <CheckIcon />
  <span>Verified</span>
</div>
```

### Change Button (Blue)
```jsx
<button className="px-4 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl">
  Change
</button>
```

### Layout
```
[Input Field (disabled)] [✓ Verified Badge] [Change Button]
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### State Management
```javascript
const [isVerifying, setIsVerifying] = useState(false);
const [otpSent, setOtpSent] = useState(false);
const [showOtpModal, setShowOtpModal] = useState(false);

const mobileValue = watch?.('ownerMobile');
const mobileVerified = watch?.('mobileVerified');
```

### Change Button Handler
```javascript
<button
  type="button"
  onClick={() => {
    setValue('mobileVerified', false);  // Unverify
    setOtpSent(false);                  // Reset OTP state
  }}
>
  Change
</button>
```

### Input Field State
```javascript
<FormInput
  name="ownerMobile"
  disabled={mobileVerified}  // Disabled when verified
  // ... other props
/>
```

---

## ✅ FEATURES

### 1. Change Button Visibility
- **Hidden:** When mobile is not verified
- **Shown:** When mobile is verified
- **Position:** Next to verified badge

### 2. Field Behavior
- **Verified:** Gray background, cannot edit
- **Unverified:** White background, can edit
- **After Change:** Returns to editable state

### 3. Verification Reset
- **mobileVerified:** false (allows form submission validation to fail)
- **otpSent:** false (resets OTP flow)
- **Field enabled:** User can type new number

### 4. Re-verification
- User can verify as many times as needed
- Each click on "Change" resets verification
- Must complete OTP verification again

---

## 📋 USE CASES

### Use Case 1: Typo in Number
**Scenario:** User entered wrong number, already verified

**Solution:**
1. Click "Change"
2. Edit to correct number
3. Click "Verify"
4. Complete OTP verification

### Use Case 2: Change to Different Number
**Scenario:** User wants to use different mobile number

**Solution:**
1. Click "Change"
2. Enter completely new number
3. Click "Verify"
4. Complete OTP verification

### Use Case 3: Test Multiple Numbers
**Scenario:** Developer/QA testing different numbers

**Solution:**
1. Verify first number
2. Click "Change"
3. Try second number
4. Repeat as needed

---

## 🎯 VALIDATION RULES

### Before Verification
- ❌ Form cannot be submitted
- ❌ "Next" button disabled
- ⚠️ Error: "Please verify your mobile number"

### After Verification
- ✅ Form can be submitted
- ✅ "Next" button enabled
- ✓ Success: "Mobile number verified successfully"

### After Clicking "Change"
- ❌ Form cannot be submitted (verification reset)
- ❌ "Next" button disabled
- ⚠️ Must verify again

---

## 🧪 TESTING CHECKLIST

### Basic Functionality
- [ ] Enter mobile → Click "Verify" → Completes verification
- [ ] After verification → "Verified" badge appears
- [ ] After verification → "Change" button appears
- [ ] After verification → Mobile field is gray/disabled

### Change Functionality
- [ ] Click "Change" → Verified badge disappears
- [ ] Click "Change" → "Verify" button appears
- [ ] Click "Change" → Mobile field becomes white/editable
- [ ] Click "Change" → Can type in field

### Re-Verification
- [ ] After change → Edit number
- [ ] Click "Verify" → OTP sent to new number
- [ ] Enter OTP → New number gets verified
- [ ] Verified badge reappears
- [ ] "Change" button reappears

### Form Submission
- [ ] Cannot submit without verification
- [ ] Can submit after initial verification
- [ ] Cannot submit after clicking "Change" (before re-verification)
- [ ] Can submit after re-verification

---

## 🎨 RELATED FEATURE: Clinic Type "Other"

### Already Implemented ✅

When user selects "Other" in Clinic Type dropdown:

**Before Selecting "Other":**
```
┌────────────────────────────┐
│ Clinic Type * [Dropdown]   │
└────────────────────────────┘
```

**After Selecting "Other":**
```
┌────────────────────────────┐
│ Clinic Type * [Other ▼]    │
└────────────────────────────┘
┌────────────────────────────┐
│ Specify Clinic Type *      │  ← NEW FIELD APPEARS
└────────────────────────────┘
```

**Implementation:**
```javascript
const selectedClinicType = watch?.('clinicType');
const showOtherField = selectedClinicType === 'OTHER';

{showOtherField && (
  <FormInput
    name="clinicTypeOther"
    placeholder="Specify Clinic Type"
    required
    maxLength={50}
  />
)}
```

**Validation:**
- Required when "Other" is selected
- Min 2 characters, Max 50 characters
- Stored in `clinicTypeOther` field

---

## 📝 FILES MODIFIED

### OwnerDetailsCard.jsx
**Changes:**
1. Added "Change" button next to verified badge
2. Added onClick handler to reset verification
3. Updated layout to accommodate Change button
4. Both "Verified" badge and "Change" button show when verified

### ClinicDetailsCard.jsx
**Status:** Already implemented ✅
- Conditional "Specify Clinic Type" field
- Shows when clinicType === 'OTHER'
- Required with validation

---

## 🎉 SUMMARY

### Mobile Number Change Feature
- ✅ "Change" button appears after verification
- ✅ Clicking "Change" makes field editable
- ✅ User can enter new number
- ✅ Can re-verify new number
- ✅ Validation resets until re-verified

### Clinic Type Other Feature
- ✅ Already implemented
- ✅ Shows "Specify" field when "Other" selected
- ✅ Required field with validation
- ✅ Max 50 characters

---

**Both Features Complete!** 🎊

**Test Instructions:**
1. Fill mobile number → Verify → See "Change" button
2. Click "Change" → Edit number → Verify again
3. Select "Other" in clinic type → See "Specify" field appear
