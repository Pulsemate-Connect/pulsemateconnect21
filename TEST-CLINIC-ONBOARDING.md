# 🧪 CLINIC ONBOARDING STEP 1 - TESTING GUIDE

**Branch**: `clinic-side-flow`  
**Status**: Ready for Testing

---

## 🚀 QUICK START

### 1. Start Backend
```bash
cd backend
npm run dev
```

**Expected Output**:
```
🚀 PulseMate API running on port 5000
📡 Socket.io ready
🌍 Environment: development
```

**Verify Routes Loaded**:
- Look for no errors in console
- Server should start without crashes

---

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

---

## 📋 MANUAL TESTING CHECKLIST

### A. Backend API Testing (Use Postman or curl)

#### 1. Test Authentication Required
```bash
# Should return 401 Unauthorized
curl http://localhost:5000/api/clinic/onboarding/progress
```

**Expected Response**:
```json
{
  "success": false,
  "message": "No token provided" // or similar
}
```

---

#### 2. Test Get Progress (New User)
```bash
# Replace YOUR_JWT with actual CLINIC_OWNER token
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/clinic/onboarding/progress
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "currentStep": 1,
    "completedSteps": [],
    "clinicData": null,
    "profileCompleted": false
  }
}
```

---

#### 3. Test Save Step 1 (Valid Data)
```bash
curl -X POST http://localhost:5000/api/clinic/onboarding/step1 \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Test Apollo Clinic",
    "clinicType": "MULTI_SPECIALTY",
    "ownerName": "Dr. Test Kumar",
    "ownerEmail": "test@example.com",
    "ownerMobile": "9876543210",
    "mobileVerified": true,
    "primaryContactPhone": "9876543210",
    "sameAsOwner": true,
    "latitude": 12.9716,
    "longitude": 77.5946,
    "addressLine1": "123 Test Road",
    "addressLine2": "Test Area",
    "landmark": "Near Test Metro",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "country": "India"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Step 1 completed successfully",
  "data": {
    "clinicId": "uuid-here",
    "onboardingStep": 1,
    "clinic": {
      "id": "uuid-here",
      "name": "Test Apollo Clinic",
      "clinicType": "MULTI_SPECIALTY",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address": "123 Test Road, Test Area, Near Test Metro, Bangalore, Karnataka, 560001",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "approvalStatus": "PENDING",
      "isActive": false,
      ...
    }
  }
}
```

---

#### 4. Test Save Step 1 (Missing Required Field)
```bash
curl -X POST http://localhost:5000/api/clinic/onboarding/step1 \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Test Clinic"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Required fields missing"
}
```

---

#### 5. Test Save Step 1 (Mobile Not Verified)
```bash
curl -X POST http://localhost:5000/api/clinic/onboarding/step1 \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Test Clinic",
    "clinicType": "CLINIC",
    "ownerName": "Test",
    "ownerEmail": "test@test.com",
    "ownerMobile": "9876543210",
    "mobileVerified": false,
    "latitude": 12.9716,
    "longitude": 77.5946,
    "addressLine1": "Test",
    "addressLine2": "Test",
    "city": "Test",
    "state": "Karnataka",
    "pincode": "560001"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Please verify your mobile number before proceeding"
}
```

---

#### 6. Test Reverse Geocoding
```bash
# Bangalore coordinates
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:5000/api/location/reverse-geocode?lat=12.9716&lng=77.5946"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "formattedAddress": "MG Road, Bangalore, Karnataka 560001, India",
    "addressLine1": "MG Road",
    "addressLine2": "Bangalore Central",
    "landmark": null,
    "city": "Bangalore",
    "district": "Bangalore Urban",
    "state": "Karnataka",
    "pincode": "560001",
    "country": "India",
    "countryCode": "IN",
    "neighbourhood": "Shantala Nagar",
    "road": "MG Road"
  }
}
```

---

#### 7. Test Reverse Geocoding (Invalid Coordinates)
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:5000/api/location/reverse-geocode?lat=999&lng=999"
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Invalid latitude. Must be between -90 and 90"
}
```

---

#### 8. Test Location Search
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:5000/api/location/search?q=Apollo%20Hospital%20Bangalore"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "Apollo Hospital, Bangalore, Karnataka, India",
      "latitude": 12.9698,
      "longitude": 77.6469,
      "type": "hospital",
      "importance": 0.7,
      "address": { ... }
    },
    ...
  ]
}
```

---

#### 9. Test Resume Onboarding (After Saving)
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/clinic/onboarding/resume
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "hasProgress": true,
    "currentStep": 1,
    "step1Data": {
      "clinicName": "Test Apollo Clinic",
      "clinicType": "MULTI_SPECIALTY",
      "ownerName": "Dr. Test Kumar",
      "ownerEmail": "test@example.com",
      "ownerMobile": "9876543210",
      "mobileVerified": true,
      "primaryContactPhone": "9876543210",
      "sameAsOwner": true,
      "latitude": 12.9716,
      "longitude": 77.5946,
      "addressLine1": "123 Test Road",
      "addressLine2": "Test Area, Near Test Metro, Bangalore, Karnataka, 560001",
      "landmark": "Near Test Metro",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "country": "India"
    },
    "clinic": { ... }
  }
}
```

---

### B. Frontend Testing

#### 1. Access Onboarding Page
```
URL: http://localhost:5173/clinic/onboarding
```

**Expected**:
- Redirects to `/clinic/onboarding/step-1`
- Two-column layout visible (desktop)
- Sidebar shows progress with Step 1 active
- Form loads with all sections

---

#### 2. Test Form Validation

**Clinic Name**:
- [ ] Type 1 character → Shows error "Must be at least 2 characters"
- [ ] Clear field → Shows error "Clinic name is required"
- [ ] Type valid name → Error disappears

**Clinic Type**:
- [ ] Leave unselected → Shows error "Please select clinic type"
- [ ] Select "Other" → Shows additional input field
- [ ] Select any other type → Additional field hides

**Owner Name**:
- [ ] Type numbers → Shows error "Only letters and spaces allowed"
- [ ] Type valid name → Error disappears

**Owner Email**:
- [ ] Type "test" → Shows error "Invalid email format"
- [ ] Type "test@test.com" → Error disappears

**Owner Mobile**:
- [ ] Type "123" → Shows error "Must be exactly 10 digits"
- [ ] Type "5123456789" → Shows error "Must start with 6, 7, 8, or 9"
- [ ] Type "9876543210" → Error disappears

**Address**:
- [ ] Leave city empty → Shows error
- [ ] Leave state empty → Shows error
- [ ] Type pincode "123" → Shows error "Must be exactly 6 digits"
- [ ] Type pincode "123456" → Error disappears

---

#### 3. Test Map Integration

**Click on Map**:
- [ ] Click anywhere on map
- [ ] Marker should appear at clicked location
- [ ] Coordinates should display below map
- [ ] Confirmation message should show "Location selected"

**Drag Marker**:
- [ ] Click and drag marker to new location
- [ ] Coordinates should update
- [ ] Location should update

**Current Location Button**:
- [ ] Click "Use Current Location" button
- [ ] Browser should prompt for location permission
- [ ] If allowed, map should center on user location
- [ ] Marker should appear at user location

**Reverse Geocoding** (requires backend running):
- [ ] Click on map
- [ ] Wait for geocoding request
- [ ] Address fields should auto-fill
- [ ] Check network tab for API call

---

#### 4. Test OTP Verification UI

**Mobile Verification**:
- [ ] Fill owner mobile number
- [ ] Click "Verify Mobile" button
- [ ] OTP modal should open
- [ ] Enter 6-digit OTP
- [ ] Click "Verify" button
- [ ] (Backend validation would happen here)
- [ ] Modal should close
- [ ] Checkbox "Mobile verified" should check

---

#### 5. Test Primary Contact Checkbox

**Same as Owner**:
- [ ] Check "Same as Owner" checkbox
- [ ] Primary contact field should disable
- [ ] Primary contact value should match owner mobile
- [ ] Uncheck checkbox
- [ ] Field should enable
- [ ] Can edit different number

---

#### 6. Test Auto-Save (localStorage)

**Save on Change**:
- [ ] Fill clinic name
- [ ] Wait 1 second
- [ ] Check browser localStorage (DevTools → Application → Local Storage)
- [ ] Should see `clinicOnboarding_step1` key with form data

**Restore on Refresh**:
- [ ] Fill some form fields
- [ ] Refresh page (F5)
- [ ] Toast should show "Restored your previous progress"
- [ ] Form should have previously entered data
- [ ] Map marker should restore if location was selected

---

#### 7. Test Save & Exit

**Save Button**:
- [ ] Fill all required fields
- [ ] Click "Save & Exit" button
- [ ] Toast should show success message
- [ ] Data should save to backend
- [ ] (Currently stays on page - could redirect to dashboard in future)

---

#### 8. Test Next Button

**Validation**:
- [ ] Leave required fields empty
- [ ] Click "Next" button
- [ ] Should show validation errors
- [ ] Button should stay disabled
- [ ] Fill all required fields
- [ ] Button should enable
- [ ] Click "Next"
- [ ] Data should save to backend
- [ ] Should redirect to Step 2 (when built)

---

#### 9. Test Responsive Design

**Desktop (≥1024px)**:
- [ ] Two-column layout visible
- [ ] Sidebar 320px wide
- [ ] Content area flexible width
- [ ] All sections display properly

**Tablet (768-1023px)**:
- [ ] Narrower sidebar
- [ ] Adjusted spacing
- [ ] Form still functional

**Mobile (<768px)**:
- [ ] Sidebar collapses
- [ ] Compact header at top
- [ ] Progress indicator horizontal
- [ ] Full-width content
- [ ] Sticky action bar at bottom
- [ ] Map still interactive
- [ ] All fields accessible

---

### C. Database Verification

After saving Step 1, check database:

```sql
-- Check User updated
SELECT id, name, email, mobile, isPhoneVerified, role
FROM users
WHERE mobile = '9876543210';

-- Check Clinic created
SELECT id, name, clinicType, latitude, longitude, address, city, state, pincode, approvalStatus, isActive
FROM clinics
WHERE name = 'Test Apollo Clinic';

-- Check ClinicOwnerProfile created
SELECT id, userId, primaryClinicId, profileCompleted
FROM clinic_owner_profiles
WHERE userId = 'user-id-from-above';
```

**Expected**:
- ✅ User record updated with owner details
- ✅ New Clinic record created
- ✅ ClinicOwnerProfile record created/updated
- ✅ All relationships linked correctly

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: "Cannot GET /api/clinic/onboarding/progress"
**Solution**: Routes not mounted. Restart backend server.

### Issue 2: Map not loading
**Solution**: 
- Check Leaflet CSS imported in main.jsx or index.html
- Check browser console for errors

### Issue 3: Reverse geocoding not working
**Solution**:
- Check backend console for Nominatim API errors
- Rate limit: max 1 request/second
- Wait a moment and try again

### Issue 4: Form not submitting
**Solution**:
- Check browser console for errors
- Verify all required fields filled
- Check network tab for API response
- Verify JWT token is valid

### Issue 5: LocalStorage not restoring
**Solution**:
- Check browser localStorage in DevTools
- Verify JSON parse not failing
- Check console for errors

---

## ✅ SUCCESS CRITERIA

### Backend Tests Passing:
- [ ] All 6 endpoints respond correctly
- [ ] Authentication works
- [ ] Authorization works (CLINIC_OWNER only)
- [ ] Validation catches errors
- [ ] Database records created
- [ ] Geocoding service working

### Frontend Tests Passing:
- [ ] Page loads without errors
- [ ] All form fields functional
- [ ] Validation working
- [ ] Map integration working
- [ ] OTP UI working
- [ ] Auto-save working
- [ ] Restore working
- [ ] Responsive design working

### Integration Tests Passing:
- [ ] Frontend → Backend save working
- [ ] Resume data working
- [ ] Geocoding working
- [ ] End-to-end flow complete

---

## 📝 TESTING NOTES

### Test Accounts Needed:
- CLINIC_OWNER role user with valid JWT
- User should not have existing clinic onboarding progress (or use resume endpoint)

### Test Data:
- Use real Indian coordinates for geocoding
- Use valid 10-digit mobile numbers
- Use real Indian state names from dropdown

### Performance:
- Page should load in < 2 seconds
- Map should load in < 3 seconds
- API responses should be < 1 second
- Geocoding should be < 5 seconds

---

## 🎯 FINAL CHECKLIST

Before marking as complete:

- [ ] All backend endpoints tested ✅
- [ ] All frontend features tested ✅
- [ ] Database records verified ✅
- [ ] Responsive design tested ✅
- [ ] Auto-save tested ✅
- [ ] Resume tested ✅
- [ ] Map integration tested ✅
- [ ] Geocoding tested ✅
- [ ] Validation tested ✅
- [ ] Error handling tested ✅
- [ ] No console errors ✅
- [ ] Code committed to `clinic-side-flow` ✅
- [ ] Documentation complete ✅

---

**Once all tests pass**: Ready to merge to `main` and deploy! 🚀
