# 🔧 FIX: Run Database Migration on Render

**Issue Found:** ✅ Identified!  
**Problem:** Table `otp_attempts` doesn't exist in database  
**Solution:** Run Prisma migration on Render (2 minutes)

---

## 🎯 THE FIX (Choose One Method)

### ⭐ METHOD 1: Render Shell (Recommended - 2 minutes)

1. **Go to Render Dashboard:**
   ```
   https://dashboard.render.com/
   ```

2. **Select your backend service**

3. **Click "Shell" tab** (in the left sidebar)

4. **Wait for shell to connect** (~10 seconds)

5. **Run these commands one by one:**

   ```bash
   npx prisma migrate deploy
   ```
   
   Wait for it to finish, then:
   
   ```bash
   npx prisma generate
   ```

6. **You should see:**
   ```
   ✅ Migration applied successfully
   ✅ Prisma Client generated
   ```

7. **Restart is automatic** - migration takes effect immediately

---

### METHOD 2: Automatic via Deploy Command (Alternative)

1. **In Render Dashboard → Your Service**

2. **Click "Settings" tab**

3. **Scroll to "Build & Deploy"**

4. **Find "Build Command"** and add:
   ```
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

5. **Click "Save Changes"**

6. **Manually deploy:**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait 5-10 minutes

---

## ✅ AFTER RUNNING MIGRATION

### Test Again:

Once migration completes, test with YOUR real phone number:

```powershell
$body = '{"mobileNumber": "YOUR_10_DIGIT_NUMBER"}'; Invoke-RestMethod -Uri "https://api.pulsemateconnect.in/api/auth/patient/send-otp" -Method POST -Body $body -ContentType "application/json"
```

**Expected Response:**
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

**AND you should receive SMS on your phone!** 📱

---

## 🎉 SUCCESS INDICATORS

You'll know it's working when:

1. ✅ No database error
2. ✅ Response contains `"success": true`
3. ✅ Response contains `verificationId`
4. ✅ **SMS arrives on your phone!**
5. ✅ Can verify OTP and get JWT tokens

---

## 📞 FULL TEST SEQUENCE

### Test 1: Send OTP
```powershell
$body = '{"mobileNumber": "9876543210"}'; Invoke-RestMethod -Uri "https://api.pulsemateconnect.in/api/auth/patient/send-otp" -Method POST -Body $body -ContentType "application/json"
```

### Test 2: Verify OTP (after receiving SMS)
```powershell
$body = '{"verificationId": "PASTE_ID_HERE", "otp": "123456", "mobileNumber": "+919876543210"}'; Invoke-RestMethod -Uri "https://api.pulsemateconnect.in/api/auth/patient/verify-otp" -Method POST -Body $body -ContentType "application/json"
```

---

## 🎯 NEXT ACTION

**Right now:**
1. Go to Render Dashboard: https://dashboard.render.com/
2. Open Shell tab
3. Run: `npx prisma migrate deploy`
4. Run: `npx prisma generate`
5. Test API again (use commands above)

**Time needed:** 2-3 minutes

---

**After this works, you can build the mobile app!** 🚀
