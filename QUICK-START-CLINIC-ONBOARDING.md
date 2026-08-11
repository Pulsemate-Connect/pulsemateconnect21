# ⚡ CLINIC ONBOARDING - QUICK START GUIDE

**Branch**: `clinic-side-flow`  
**Status**: ✅ Ready to Test

---

## 🚀 START IN 60 SECONDS

### 1. Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```

Wait for: `🚀 PulseMate API running on port 5000`

---

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

Wait for: `➜  Local:   http://localhost:5173/`

---

### 3. Open in Browser
```
http://localhost:5173/clinic/onboarding
```

**Auto-redirects to**: `/clinic/onboarding/step-1`

---

## ✅ WHAT YOU'LL SEE

### Desktop View
- **Left Sidebar**: Progress steps (Step 1 active)
- **Right Panel**: Form with 5 sections:
  1. Clinic Details
  2. Owner Details
  3. Primary Contact
  4. Clinic Location (Interactive Map)
  5. Address Details
- **Bottom Bar**: Save & Exit | Next buttons

### Mobile View
- Compact header with progress
- Full-width form
- Sticky bottom action bar

---

## 🧪 QUICK TEST

### Fill the Form (2 minutes)
1. ✅ Clinic Name: "Test Apollo Clinic"
2. ✅ Clinic Type: Select "Multi-specialty Clinic"
3. ✅ Owner Name: "Dr. Rajesh Kumar"
4. ✅ Owner Email: "test@example.com"
5. ✅ Owner Mobile: "9876543210"
6. ✅ Click "Verify Mobile" (OTP modal appears - UI only for now)
7. ✅ Check "Mobile verified"
8. ✅ Check "Same as owner mobile" for primary contact
9. ✅ Click anywhere on map to select location
10. ✅ Watch address auto-fill (if backend running)
11. ✅ Fill any remaining address fields
12. ✅ Click "Next" button

### Expected Result
- ✅ Form validates
- ✅ Data saves to database
- ✅ Success toast appears
- ✅ Database records created

---

## 🔍 VERIFY IT WORKED

### Check Database
```sql
-- Find the clinic
SELECT * FROM clinics 
WHERE name = 'Test Apollo Clinic';

-- Find the owner
SELECT * FROM users 
WHERE email = 'test@example.com';

-- Find the profile
SELECT * FROM clinic_owner_profiles 
WHERE userId = '...';
```

### Check localStorage
1. Open DevTools (F12)
2. Application → Local Storage → http://localhost:5173
3. Look for key: `clinicOnboarding_step1`
4. Should contain form data JSON

---

## 🐛 TROUBLESHOOTING

### Map not loading?
- Check Leaflet CSS is imported
- Open browser console for errors
- Verify internet connection (map tiles from OSM)

### Geocoding not working?
- Check backend console for errors
- Nominatim rate limit: 1 request/second
- Try again after a few seconds

### Form not submitting?
- Check browser console
- Check Network tab for API response
- Verify all required fields filled
- Make sure mobile is "verified"

### "Cannot POST /api/clinic/onboarding/step1"?
- Backend not running or routes not loaded
- Restart backend server
- Check `npm run dev` output for errors

---

## 📚 FULL DOCUMENTATION

For complete testing:
- **Testing Guide**: `TEST-CLINIC-ONBOARDING.md`
- **Backend API**: `CLINIC-ONBOARDING-BACKEND-COMPLETE.md`
- **Frontend Details**: `CLINIC-ONBOARDING-FRONTEND-COMPLETE.md`
- **Complete Status**: `CLINIC-ONBOARDING-STEP1-COMPLETE.md`
- **Executive Summary**: `CLINIC-ONBOARDING-SUMMARY.md`

---

## 🎯 API ENDPOINTS (for Postman)

### Save Step 1
```bash
POST http://localhost:5000/api/clinic/onboarding/step1
Authorization: Bearer YOUR_CLINIC_OWNER_JWT
Content-Type: application/json

{
  "clinicName": "Test Apollo Clinic",
  "clinicType": "MULTI_SPECIALTY",
  "ownerName": "Dr. Rajesh Kumar",
  "ownerEmail": "test@example.com",
  "ownerMobile": "9876543210",
  "mobileVerified": true,
  "primaryContactPhone": "9876543210",
  "sameAsOwner": true,
  "latitude": 12.9716,
  "longitude": 77.5946,
  "addressLine1": "123 MG Road",
  "addressLine2": "Bangalore Central",
  "landmark": "Near Metro Station",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "country": "India"
}
```

### Get Progress
```bash
GET http://localhost:5000/api/clinic/onboarding/progress
Authorization: Bearer YOUR_JWT
```

### Reverse Geocode
```bash
GET http://localhost:5000/api/location/reverse-geocode?lat=12.9716&lng=77.5946
Authorization: Bearer YOUR_JWT
```

---

## ✅ SUCCESS CHECKLIST

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Page loads at /clinic/onboarding
- [ ] Two-column layout visible (desktop)
- [ ] All form fields render
- [ ] Map loads and is interactive
- [ ] Can click on map to select location
- [ ] Form validation works
- [ ] Can fill all required fields
- [ ] "Next" button enables when form valid
- [ ] Clicking "Next" saves to backend
- [ ] Success toast appears
- [ ] Database records created

---

## 🎉 ALL WORKING?

**Congratulations!** Clinic Onboarding Step 1 is fully functional!

### Next Steps:
1. ✅ Test all edge cases (see `TEST-CLINIC-ONBOARDING.md`)
2. ✅ Test on mobile devices
3. ✅ Test with real coordinates
4. ✅ Verify all validation rules
5. ✅ Deploy to staging
6. ✅ Merge to `main` after approval

---

## 📞 NEED HELP?

### Review Documentation
- All documentation is in the root folder
- Look for `CLINIC-ONBOARDING-*.md` files
- Most comprehensive: `TEST-CLINIC-ONBOARDING.md`

### Check Git History
```bash
git log --oneline | grep "clinic"
```

### Inspect Code
- Frontend: `frontend/src/pages/clinic/onboarding/`
- Backend: `backend/src/controllers/clinic/`
- Backend: `backend/src/routes/clinic/`
- Service: `backend/src/services/geocoding.service.js`

---

**Branch**: `clinic-side-flow`  
**Status**: 100% Complete ✅  
**Ready**: For Testing 🚀

Happy Testing! 🎉
