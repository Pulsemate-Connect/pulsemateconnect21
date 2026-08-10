# 🧪 MANUAL TEST STEPS — Past Slot Validation

**Quick 5-minute test you can do right now**

---

## 🚀 OPTION 1: Run Automated Test Script

### Windows (PowerShell)
```powershell
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
.\test-slot-validation-now.ps1
```

### Linux/Mac (Bash)
```bash
cd ~/pulsemateconnect21
chmod +x test-slot-validation-now.sh
./test-slot-validation-now.sh
```

**The script will**:
1. Login with your mobile number (or paste JWT)
2. Find available doctors automatically
3. Fetch slots and show past/available breakdown
4. Test backend validation by trying to book past slot
5. Generate detailed test report

---

## 🔧 OPTION 2: Manual Testing with Browser

### Step 1: Get Your JWT Token (30 seconds)
1. Open https://www.pulsemateconnect.in/login
2. Login as **PATIENT**
3. Press **F12** (DevTools)
4. Go to **Application** tab
5. Click **Local Storage** → `https://www.pulsemateconnect.in`
6. Find key `token`
7. Copy the value (starts with `eyJ...`)

---

### Step 2: Get Doctor/Clinic IDs (30 seconds)
1. In PulseMate web app, search for a doctor
2. Keep DevTools open, go to **Network** tab
3. Click on a doctor profile
4. Look for API call: `GET /api/patient/doctors`
5. Click on it → **Response** tab
6. Find `id` (this is doctorId)
7. Find `doctorClinics[0].clinic.id` (this is clinicId)

**Or use these test commands**:
```powershell
# Search doctors
curl "https://api.pulsemateconnect.in/api/patient/doctors?limit=5" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Copy doctorId and clinicId from response
```

---

### Step 3: Test Slot API — Frontend Filtering (1 minute)

**Command**:
```bash
curl "https://api.pulsemateconnect.in/api/doctor/DOCTOR_ID/slots?clinicId=CLINIC_ID&date=2026-08-10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example** (replace IDs):
```bash
curl "https://api.pulsemateconnect.in/api/doctor/cm123abc/slots?clinicId=cl456def&date=2026-08-10" \
  -H "Authorization: Bearer eyJhbGc..."
```

**What to Check**:
```json
{
  "data": {
    "slots": [
      {
        "time": "09:00",
        "label": "9:00 AM",
        "available": false,
        "booked": false,
        "past": true          ← ✅ Check this is true for past slots
      },
      {
        "time": "10:30",
        "label": "10:30 AM",
        "available": true,
        "booked": false,
        "past": false         ← ✅ Future slots should be false
      }
    ]
  }
}
```

**✅ PASS Criteria**:
- Slots before current IST time have `"past": true`
- Past slots have `"available": false`
- Future slots have `"available": true`

---

### Step 4: Test Backend Validation — Security Layer (1 minute)

**Command**:
```bash
curl -X POST "https://api.pulsemateconnect.in/api/patient/appointments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOCTOR_ID",
    "clinicId": "CLINIC_ID",
    "appointmentType": "OFFLINE",
    "appointmentDate": "2026-08-10",
    "slotTime": "09:00"
  }'
```

**Example** (trying to book 09:00 AM when current time is 10:00 AM):
```bash
curl -X POST "https://api.pulsemateconnect.in/api/patient/appointments" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "cm123abc",
    "clinicId": "cl456def",
    "appointmentType": "OFFLINE",
    "appointmentDate": "2026-08-10",
    "slotTime": "09:00"
  }'
```

**Expected Response** (HTTP 400):
```json
{
  "success": false,
  "message": "This time slot (09:00) has already passed or will start within 5 minutes. Please select the next available slot."
}
```

**✅ PASS Criteria**:
- HTTP status code: **400** (Bad Request)
- Error message mentions "already passed" or "within 5 minutes"
- Booking is **rejected**, not created

---

### Step 5: Test Future Date (30 seconds)

**Command**:
```bash
curl "https://api.pulsemateconnect.in/api/doctor/DOCTOR_ID/slots?clinicId=CLINIC_ID&date=2026-08-11" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**What to Check**:
- All morning slots (09:00, 09:15, etc.) should have `"past": false`
- Past slot filtering **ONLY applies to TODAY**
- Future dates show all session slots as bookable

**✅ PASS Criteria**:
- Tomorrow's 09:00 AM slot is `"available": true` (even though it's "past" for today)
- No slots marked as `"past": true` for future dates

---

## 🎯 QUICK VERIFICATION CHECKLIST

| Test | Expected Result | Pass/Fail |
|------|-----------------|-----------|
| **TODAY Slots API** | Past slots marked `past: true` | ☐ |
| **TODAY Slots API** | Past slots marked `available: false` | ☐ |
| **TODAY Backend** | Rejects past slot booking (HTTP 400) | ☐ |
| **TODAY Backend** | Error message clear and helpful | ☐ |
| **FUTURE Date** | All slots `past: false` | ☐ |
| **FUTURE Date** | Morning slots `available: true` | ☐ |

---

## 📊 UNDERSTANDING THE RESULTS

### Scenario A: Morning Session Active
```
Current Time: 09:30 AM IST
Expected: Slots before 09:35 AM marked as past (5-min buffer)

API Response:
✓ 09:00 → past: true, available: false
✓ 09:15 → past: true, available: false
✓ 09:30 → past: true, available: false (too close)
✓ 09:45 → past: false, available: true
```

### Scenario B: All Morning Passed
```
Current Time: 01:30 PM IST
Expected: All morning slots (09:00-01:00 PM) marked as past

API Response:
✓ All morning slots → past: true
✓ Afternoon/evening slots → past: false
```

### Scenario C: Early Morning
```
Current Time: 08:30 AM IST
Expected: No slots marked as past yet

API Response:
✓ 09:00 → past: false, available: true
✓ 09:15 → past: false, available: true
```

---

## 🐛 TROUBLESHOOTING

### Problem: All slots show `past: false`
**Cause**: Current time is before first session start  
**Solution**: Normal — test again during session hours

---

### Problem: Future date slots show `past: true`
**Cause**: Bug in implementation  
**Solution**: Check console logs, report issue

---

### Problem: Backend allows past slot booking
**Cause**: Critical bug  
**Solution**: Check backend deployment, verify code is latest

---

### Problem: `401 Unauthorized` error
**Cause**: JWT token expired or invalid  
**Solution**: Login again and get fresh token

---

## 🎓 REAL-WORLD TEST TIMES

Test at different times to see different behaviors:

| Time | What to Test |
|------|--------------|
| **08:30 AM** | No slots past yet |
| **10:00 AM** | Morning slots 09:00-10:00 past |
| **01:30 PM** | All morning past, afternoon available |
| **07:00 PM** | Morning + afternoon past, evening available |
| **10:00 PM** | All sessions past, only future dates work |

---

## 📱 MOBILE APP TEST (1 minute)

1. Open PulseMate mobile app
2. Login as patient
3. Search for any doctor
4. Click "Book Appointment"
5. Select **TODAY**
6. **Check**: 
   - Past morning slots hidden
   - Only future slots visible
   - Auto-selects next available session
7. Select **TOMORROW**
8. **Check**:
   - All morning slots visible
   - No filtering applied

---

## ✅ SUCCESS INDICATORS

### Frontend Working
- ✅ API returns `past: true` for old slots
- ✅ API returns `available: false` for past slots
- ✅ Future dates don't mark slots as past

### Backend Working
- ✅ HTTP 400 for past slot booking
- ✅ Clear error message
- ✅ Booking not created

### Mobile App Working
- ✅ Past slots hidden from UI
- ✅ Only future slots selectable
- ✅ Auto-session selection works

---

## 🚀 READY TO TEST

Choose your method:
1. **Automated**: Run `test-slot-validation-now.ps1` (easiest)
2. **Manual**: Follow steps above with curl commands
3. **Mobile**: Test in actual app with real booking flow

**All methods should show past slot validation is working!** ✅
