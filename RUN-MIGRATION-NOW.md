# 🚨 RUN MIGRATION NOW - QUICK FIX

**Issue:** Table `otp_attempts` doesn't exist  
**Solution:** Run migration manually on Render (takes 2 minutes)

---

## ⚡ FASTEST FIX - Do This Right Now:

### Option 1: Render Shell (Recommended - 2 minutes)

**1. Go to Render Dashboard:**
```
https://dashboard.render.com/
```

**2. Click on your backend service**

**3. Click "Shell" tab** (left sidebar)

**4. Wait for shell to connect** (~10 seconds)

**5. Copy and paste this command:**
```bash
npx prisma migrate deploy && npx prisma generate
```

**6. Press Enter and wait** (~30 seconds)

**7. You should see:**
```
✅ Applying migration...
✅ Migration `add_otp_attempt_table` applied
✅ Prisma Client generated
```

**8. Done!** No restart needed, works immediately.

---

## ✅ THEN TEST IMMEDIATELY

After running the migration, test with your phone number:

```powershell
$body = '{"mobileNumber": "YOUR_10_DIGIT_NUMBER"}'; Invoke-RestMethod -Uri "https://api.pulsemateconnect.in/api/auth/patient/send-otp" -Method POST -Body $body -ContentType "application/json"
```

**Replace YOUR_10_DIGIT_NUMBER with your actual number!**

**Expected:**
```json
{
  "success": true,
  "data": {
    "verificationId": "some-verification-id",
    "expiresIn": 60,
    "message": "OTP sent successfully"
  }
}
```

**AND SMS ON YOUR PHONE!** 📱

---

## 🎯 CURRENT SITUATION

**What's working:**
- ✅ Backend code deployed
- ✅ Environment variables set
- ✅ API endpoint responding

**What's missing:**
- ⏳ Database table `otp_attempts` (needs migration)

**Fix time:** 2 minutes

---

## 📱 FULL TEST SEQUENCE

### Test 1: Send OTP
```powershell
$body = '{"mobileNumber": "9876543210"}'; Invoke-RestMethod -Uri "https://api.pulsemateconnect.in/api/auth/patient/send-otp" -Method POST -Body $body -ContentType "application/json"
```

**Look for:** `verificationId` in response + SMS on phone

---

### Test 2: Verify OTP
```powershell
$body = '{"verificationId": "PASTE_ID_HERE", "otp": "123456", "mobileNumber": "+919876543210"}'; Invoke-RestMethod -Uri "https://api.pulsemateconnect.in/api/auth/patient/verify-otp" -Method POST -Body $body -ContentType "application/json"
```

**Look for:** `accessToken` and `refreshToken` in response

---

## 🎉 AFTER BOTH TESTS PASS

**Tell your team:**

> "✅ Message Central OTP is WORKING on production!
> 
> Test results:
> - SMS delivery: Confirmed ✅
> - OTP verification: Working ✅
> - JWT tokens: Generated ✅
> 
> Backend is ready. Can proceed with mobile app build.
> 
> Build guide: BUILD-MESSAGE-CENTRAL-APP.md
> Time: 2-3 hours"

---

## ⚠️ IF SHELL DOESN'T WORK

Try Option 2:

### Option 2: Manual Deploy with Build Command

**1. Go to Render → Settings**

**2. Find "Build Command"**

**3. Change to:**
```
npm install && npx prisma migrate deploy && npx prisma generate
```

**4. Click "Manual Deploy" → "Deploy latest commit"**

**5. Wait 5-10 minutes**

**6. Test again**

---

## 🎯 SUMMARY

**You need to:**
1. Go to Render Shell
2. Run: `npx prisma migrate deploy && npx prisma generate`
3. Test API with your phone number
4. Check for SMS

**Total time:** 3 minutes

**Then:** If SMS arrives = SUCCESS! Ready to build app! 🚀

---

**Go to Render Shell now:** https://dashboard.render.com/

**Run the command, then let me know if you received SMS!**
