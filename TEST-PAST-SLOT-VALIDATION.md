# 🧪 QUICK TEST GUIDE — Past Slot Validation

**Status**: ✅ Deployed to production  
**Commit**: 49efcd4  
**Files Modified**: 3 backend controllers + documentation

---

## 🚀 WHAT WAS DEPLOYED

### The Fix
When patients book appointments for **TODAY**, the system now:
- ❌ Hides slots that have already passed
- ❌ Hides slots starting within the next 5 minutes
- ✅ Shows only future bookable slots
- 🌏 Uses **Asia/Kolkata (IST) timezone** for Indian clinics

### Example
```
Current IST Time: 10:07 AM
Morning Session: 09:00 AM - 01:00 PM

Slots Displayed:
  09:00 AM  ❌ Hidden (past)
  09:15 AM  ❌ Hidden (past)
  09:30 AM  ❌ Hidden (past)
  09:45 AM  ❌ Hidden (past)
  10:00 AM  ❌ Hidden (past)
  10:15 AM  ✅ Shown (8 minutes away)
  10:30 AM  ✅ Shown
  10:45 AM  ✅ Shown
```

---

## 🧪 SIMPLE TESTING (5 MINUTES)

### Test 1: Check Slot API (Frontend)
```bash
# Get today's slots for a doctor
curl "https://api.pulsemateconnect.in/api/doctor/DOCTOR_ID/slots?clinicId=CLINIC_ID&date=2026-08-10" \
  -H "Authorization: Bearer YOUR_JWT"
```

**Look for**:
- Slots before current IST time have `"past": true`
- Slots before current IST time have `"available": false`
- Future slots have `"available": true`

---

### Test 2: Try Booking Past Slot (Backend Validation)
```bash
# Try to book a slot that already passed (should fail)
curl -X POST https://api.pulsemateconnect.in/api/patient/appointments \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOCTOR_ID",
    "clinicId": "CLINIC_ID",
    "appointmentType": "OFFLINE",
    "appointmentDate": "2026-08-10",
    "slotTime": "09:00",
    "sessionId": "SESSION_ID"
  }'
```

**Expected Response** (HTTP 400):
```json
{
  "success": false,
  "message": "This time slot (09:00) has already passed or will start within 5 minutes. Please select the next available slot."
}
```

---

### Test 3: Mobile App Visual Test (1 minute)
1. Open PulseMate app
2. Search for any doctor
3. Click "Book Appointment"
4. Select **TODAY's date**
5. **Check**: Past morning slots are hidden
6. Select **TOMORROW's date**
7. **Check**: All morning slots are shown

---

## 🎯 EXPECTED BEHAVIORS

### ✅ What Should Work
- [x] TODAY: Only future slots visible
- [x] TOMORROW: All session slots visible
- [x] Backend rejects past slot bookings with clear error
- [x] Mobile app filters slots automatically
- [x] Auto-selects next available session if current ended

### ❌ What Should NOT Happen
- [ ] Past slots showing as available for TODAY
- [ ] Future dates hiding morning slots
- [ ] Existing appointments being modified
- [ ] "Slot already passed" error for future dates

---

## 🕐 TIME-BASED TEST SCENARIOS

### Scenario A: Morning Session Active
**Time**: 09:30 AM  
**Expected**: 
- Morning slots 09:45 AM onwards shown
- Slots before 09:35 AM hidden (5-min buffer)

### Scenario B: Morning Session Ended
**Time**: 01:10 PM  
**Expected**:
- Morning session fully hidden
- Afternoon session auto-selected
- First afternoon slot auto-selected

### Scenario C: All Sessions Ended
**Time**: 09:00 PM  
**Expected**:
- No slots available for TODAY
- Message: "No slots available"
- Patient must select future date

### Scenario D: Evening Approaching
**Time**: 05:45 PM  
**Expected**:
- Evening session (06:00 PM onwards) shown
- Morning/afternoon sessions hidden
- 06:00 PM slot available (15 min away)

---

## 🐛 TROUBLESHOOTING

### Problem: All Slots Hidden for TODAY
**Likely Cause**: Current time is after last session end  
**Solution**: Expected behavior — select future date or wait for next day

**Quick Check**:
```bash
# Check clinic sessions
curl "https://api.pulsemateconnect.in/api/clinics/CLINIC_ID/sessions" \
  -H "Authorization: Bearer YOUR_JWT"

# Verify current IST time
# If current time > last session end time → all slots past
```

---

### Problem: Past Slots Still Showing
**Likely Cause**: Deployment not complete or cache issue  
**Solution**:
1. Check deployment status on Render dashboard
2. Wait 2-3 minutes for full deployment
3. Clear mobile app cache (logout/login)
4. Verify commit is live: check backend logs

---

### Problem: Future Dates Hiding Slots
**Likely Cause**: Implementation bug (should not happen)  
**Solution**: 
1. Check API response for future date
2. Verify `isToday` logic in availability.controller.js
3. Report issue with date tested

---

## 📊 MONITORING

### Check Backend Logs (Render Dashboard)
Look for:
- ✅ `[Booking] Fetched clinic sessions`
- ✅ `[Booking] Initiating payment`
- ❌ `This time slot has already passed` (rejection logged)

### Check API Response
```bash
# Get slots and verify timezone handling
curl "https://api.pulsemateconnect.in/api/doctor/DOCTOR_ID/slots?clinicId=CLINIC_ID&date=2026-08-10" \
  -H "Authorization: Bearer YOUR_JWT" | jq '.data.slots[] | select(.past == true)'

# Should show slots before current IST time
```

---

## 🎓 TESTING TIPS

### Get Your JWT Token
1. Login to https://www.pulsemateconnect.in/login
2. Open browser DevTools (F12)
3. Go to Application → Local Storage
4. Find `token` key
5. Copy the value

### Get Doctor/Clinic IDs
1. Search for doctors in the app
2. Open Network tab in DevTools
3. Click a doctor → see API call
4. Copy `doctorId` and `clinicId` from URL

### Simulate Different Times
The system uses real current time, so test at different times:
- **Morning (09:00 AM)**: Test morning session filtering
- **Afternoon (02:00 PM)**: Test session switching
- **Evening (06:00 PM)**: Test evening session availability
- **Night (10:00 PM)**: Test "no slots" scenario

---

## ✅ SUCCESS CHECKLIST

After testing, verify:
- [ ] Fetched today's slots → past slots marked as unavailable
- [ ] Tried booking past slot → got clear error message
- [ ] Fetched tomorrow's slots → all slots available
- [ ] Mobile app shows only future slots for today
- [ ] Auto-selects next available session when current ended
- [ ] No errors in backend logs
- [ ] Existing appointments unchanged

---

## 📞 REPORT ISSUES

If you find a problem:
1. Note the exact time (IST) when tested
2. Copy the API request (curl command)
3. Copy the API response
4. Screenshot the mobile app issue
5. Check backend logs on Render

**All tests passed?** ✅ Implementation successful!  
**Found issues?** ⚠️ Check troubleshooting section above or report with details.

---

## 🚀 NEXT PRODUCTION TESTS

### Week 1: Monitor Real Usage
- Track "slot already passed" error rate
- Check patient booking patterns
- Verify no increase in booking failures

### Week 2: Edge Case Testing
- Test at exact session boundaries (09:00 AM, 01:00 PM, etc.)
- Test on public holidays
- Test with doctor unavailability

### Month 1: Performance
- Monitor API response times
- Check database query performance
- Verify no timezone conversion overhead

---

**Ready for Production** ✅  
**Commit Hash**: 49efcd4  
**Deployment**: Automatic via GitHub → Render  
**ETA**: 5-10 minutes from push
