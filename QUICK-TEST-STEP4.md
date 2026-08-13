# 🧪 Quick Test Guide - Step 4 Auto-Fill

## ✅ What Changed
1. **Removed:** "View Full Partner Agreement" button and modal
2. **Removed:** Designation dropdown field
3. **Added:** Auto-fetch owner name from database API
4. **Changed:** Owner name field is now read-only (gray background)

---

## 🎯 Quick Test Steps (5 Minutes)

### 1. Start Testing
```
✅ Backend running: http://localhost:5000
✅ Frontend running: http://localhost:3001
```

### 2. Navigate to Clinic Onboarding
```
http://localhost:3001/clinic/partner
```

### 3. Complete Steps 1-3 Quickly
Use these test values:

**Step 1 - Clinic Information:**
- Phone: `9999999999` (Firebase OTP: verify via Firebase)
- Email: `test@clinic.com` (OTP: `123456`)
- Owner Name: `Dr. John Smith` ← **THIS IS IMPORTANT**
- Clinic Name: `Test Clinic`
- Fill other required fields with any data
- Click Next

**Step 2 - Services & Operations:**
- Select any specialties
- Select consultation types
- Add opening/closing time
- Select appointment mode
- Click Next

**Step 3 - Clinic Documents:**
- Upload 3 required documents (any image files)
- Upload 4 clinic photos (any image files)
- Click Next

### 4. Test Step 4 - Partner Agreement

**Expected Behavior:**

✅ **Auto-Fill Check (MOST IMPORTANT):**
```
The "Full Name" field should show: "Dr. John Smith"
                                    ↑
                          (from Step 1 owner name)
```

✅ **Field Should Be:**
- Read-only (gray background)
- Show info icon with text: "Auto-filled from clinic owner information"

✅ **UI Should Show:**
- 🤝 Partner Agreement heading
- Blue box with 3 key terms
- Authorized Person section with read-only name field
- 4 checkboxes (all unchecked initially)
- Green info box: "What happens after submission?"
- Submit button (DISABLED initially)

✅ **No Modal Button:**
- ❌ Should NOT see "View Full Partner Agreement" button

✅ **No Designation Field:**
- ❌ Should NOT see dropdown for "Clinic Owner / Authorized Representative"

### 5. Test Submission

**Step-by-step:**
1. Verify owner name is auto-filled ✅
2. Check all 4 checkboxes ☑️☑️☑️☑️
3. Submit button should become ENABLED (green)
4. Click "Submit Application"
5. Full-screen loading overlay appears
6. Success modal appears after ~1-2 seconds

**Success Modal Should Show:**
- ✅ Green checkmark icon
- ✅ "Application Submitted Successfully!"
- ✅ 4 bullet points: Review process, Email notification, Start booking, Dashboard access
- ✅ Contact info section
- ✅ "Go to Dashboard" button

### 6. Verify Database

**Option A: Check in browser console**
```javascript
// Before submitting, check what will be sent:
console.log('Owner Name:', document.querySelector('input[id="authorizedPerson"]').value);
```

**Option B: After submission, check database**
```sql
SELECT 
  mobile,
  approvalStatus,
  clinicOnboardingData->'partnerAgreement'->'authorizedPerson' as authorized_person
FROM "User"
WHERE mobile = '9999999999';
```

**Expected:**
- `approvalStatus` = `"PENDING"`
- `authorized_person` = `"Dr. John Smith"`

---

## 🐛 Troubleshooting

### Issue 1: Owner Name is Empty

**Check:**
1. Did you complete Step 1 with an owner name?
2. Open DevTools → Network tab
3. Look for: `GET /api/auth/clinic-owner/get-onboarding-data`
4. Status should be 200, response should have ownerName

**Quick Fix:**
```javascript
// If API fails, manually type the name (field should accept input on error)
// This is expected fallback behavior
```

### Issue 2: Submit Button Stays Disabled

**Check:**
- Are ALL 4 checkboxes checked? ☑️☑️☑️☑️
- Is owner name field filled?
- Open React DevTools → find Step4PartnerAgreement component
- Check watch values for all checkbox states

### Issue 3: "Failed to fetch" Error

**Check:**
1. Backend running? → http://localhost:5000
2. Complete Steps 1-3 first
3. Check browser console for error details

---

## ✅ Test Completion Checklist

After testing, mark these as complete:

- [ ] Owner name auto-fills from database
- [ ] Field is gray (read-only)
- [ ] Info text shows below field
- [ ] NO "View Full Partner Agreement" button visible
- [ ] NO designation dropdown visible
- [ ] Submit button disabled until all 4 checkboxes checked
- [ ] Loading overlay shows during submission
- [ ] Success modal appears after submission
- [ ] Database shows approvalStatus = PENDING
- [ ] Database shows correct owner name in partnerAgreement

---

## 🎉 Success!

If all checks pass:
- ✅ Implementation is working correctly
- ✅ Ready to move to next feature
- ✅ Document any issues found

If any checks fail:
- 🐛 Open browser DevTools → Console tab
- 📸 Take screenshot of error
- 📝 Note which step failed
- 🔍 Check relevant section in STEP4-IMPLEMENTATION-COMPLETE.md

---

**Time Estimate:** 5-10 minutes for complete test  
**Priority:** HIGH - Core functionality test  
**Status:** Ready to test

---

## 📞 Quick Support

**Backend Check:**
```bash
curl http://localhost:5000/api/auth/clinic-owner/get-onboarding-data
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "clinicOnboardingData": {
      "clinicInformation": {
        "ownerName": "Dr. John Smith"
      }
    }
  }
}
```

**If 404 Error:**
- No user with onboarding data exists yet
- Complete Steps 1-3 first
