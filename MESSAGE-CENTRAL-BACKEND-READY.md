# ✅ MESSAGE CENTRAL BACKEND - IMPLEMENTATION COMPLETE

**Date:** August 5, 2026  
**Status:** Backend code ready, needs environment setup and deployment

---

## 🎉 WHAT'S BEEN DONE

### ✅ Backend Implementation (Complete)

1. **✅ Message Central Service** (`backend/src/services/messagecentral.service.js`)
   - Token caching (24 hours)
   - sendOTP() method
   - validateOTP() method
   - Comprehensive error handling
   - User-friendly error messages

2. **✅ Auth Controller Methods** (`backend/src/controllers/auth.controller.js`)
   - `sendOtpHandler()` - Send OTP endpoint
   - `verifyOtpHandler()` - Verify OTP and login/register
   - Rate limiting logic (2-minute window)
   - User creation/login flow
   - JWT token generation
   - Audit logging

3. **✅ API Routes** (`backend/src/routes/auth.routes.js`)
   - POST `/api/auth/patient/send-otp`
   - POST `/api/auth/patient/verify-otp`
   - Rate limiting applied
   - Proper route comments

4. **✅ Database Schema** (`backend/prisma/schema.prisma`)
   - Added `OtpAttempt` model for rate limiting
   - Indexes for performance
   - Provider tracking (MESSAGE_CENTRAL vs FIREBASE)

---

## 🚀 NEXT STEPS (Your Actions Required)

### Step 1: Add Environment Variables (5 min) ⚡

You need to add Message Central credentials to your backend `.env` file.

**File:** `backend/.env`

Add these lines:

```env
# Message Central VerifyNow OTP
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
MESSAGE_CENTRAL_PASSWORD=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com
```

**⚠️ SECURITY:** Never commit `.env` to Git! It should already be in `.gitignore`.

---

### Step 2: Run Database Migration (2 min) 🗄️

The `OtpAttempt` model needs to be created in your database.

**Commands:**

```bash
cd backend
npx prisma migrate dev --name add_otp_attempt_table
```

This will:
- Create a new migration file
- Apply it to your local database
- Regenerate Prisma Client with the new model

**Verify:**
```bash
npx prisma studio
```
- You should see the `otp_attempts` table in Prisma Studio

---

### Step 3: Install Dependencies (1 min) 📦

Make sure axios is installed (should already be):

```bash
cd backend
npm install
```

---

### Step 4: Test Backend Locally (10 min) 🧪

Start your backend server:

```bash
cd backend
npm run dev
```

**Test 1: Send OTP**

```bash
curl -X POST http://localhost:3000/api/auth/patient/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"mobileNumber\": \"9876543210\"}"
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

**Check your phone for SMS!**

---

**Test 2: Verify OTP**

Use the `verificationId` from Test 1 and the OTP you received:

```bash
curl -X POST http://localhost:3000/api/auth/patient/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"verificationId\": \"YOUR_VERIFICATION_ID\", \"otp\": \"123456\", \"mobileNumber\": \"+919876543210\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "user-uuid",
      "name": null,
      "phone": "+919876543210",
      "role": "PATIENT",
      "isNewUser": true
    }
  },
  "message": "Account created successfully"
}
```

---

### Step 5: Deploy to Render (15 min) ☁️

Once local testing works, deploy to production.

#### 5.1 Add Environment Variables to Render

1. Go to: https://dashboard.render.com/
2. Select your backend service (PulseMate Connect Backend)
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**

Add these **3 variables**:

| Key | Value |
|-----|-------|
| `MESSAGE_CENTRAL_CUSTOMER_ID` | `C-B6442109CBD3438` |
| `MESSAGE_CENTRAL_PASSWORD` | `eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ` |
| `MESSAGE_CENTRAL_BASE_URL` | `https://cpaas.messagecentral.com` |

5. Click **"Save Changes"**

**What happens:**
- Render will automatically restart your backend
- Takes ~2-3 minutes to deploy
- New environment variables will be available

---

#### 5.2 Push Code to GitHub

Your code changes need to be deployed:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

git add backend/
git commit -m "Add Message Central OTP backend implementation"
git push origin main
```

**What happens:**
- Render detects the new commit
- Automatically builds and deploys
- Takes ~5-10 minutes
- Database migration runs automatically

---

#### 5.3 Test Production Backend

Once deployment completes:

**Test Send OTP (Production):**

```bash
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"mobileNumber\": \"9876543210\"}"
```

**Test Verify OTP (Production):**

```bash
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"verificationId\": \"YOUR_VERIFICATION_ID\", \"otp\": \"123456\", \"mobileNumber\": \"+919876543210\"}"
```

---

## 📊 BACKEND STATUS CHECKLIST

Use this checklist to track your progress:

### Local Development:
- [ ] Environment variables added to `backend/.env`
- [ ] Database migration run (`npx prisma migrate dev`)
- [ ] Dependencies installed (`npm install`)
- [ ] Backend server starts without errors
- [ ] Test 1: Send OTP works
- [ ] Test 2: SMS received on phone
- [ ] Test 3: Verify OTP works
- [ ] Test 4: JWT tokens returned

### Production Deployment:
- [ ] Environment variables added to Render dashboard
- [ ] Code pushed to GitHub (`git push`)
- [ ] Render deployment successful
- [ ] Database migration applied automatically
- [ ] Production send OTP test passes
- [ ] Production verify OTP test passes

---

## 🔍 TROUBLESHOOTING

### Problem: "Failed to generate authentication token"

**Cause:** Message Central credentials are incorrect or not set

**Fix:**
1. Check `MESSAGE_CENTRAL_CUSTOMER_ID` is correct: `C-B6442109CBD3438`
2. Check `MESSAGE_CENTRAL_PASSWORD` is the full token (very long string)
3. Restart backend after adding env vars

---

### Problem: "Invalid mobile number format"

**Cause:** Phone number format is wrong

**Fix:**
- Use 10-digit number without country code: `"9876543210"`
- Or with country code: `"+919876543210"`
- Don't use spaces or dashes

---

### Problem: "Please wait 2 minutes before requesting another OTP"

**Cause:** Rate limiting - too many requests

**Fix:**
- Wait 2 minutes before sending another OTP to the same number
- This is a security feature to prevent abuse

---

### Problem: Migration fails on Render

**Cause:** Render might not auto-run migrations

**Fix:**
1. Go to Render dashboard → Your service → Shell
2. Run manually:
   ```bash
   npx prisma migrate deploy
   ```

---

## 📁 FILES MODIFIED

### ✅ Created:
- `backend/src/services/messagecentral.service.js` (NEW)
- `MESSAGE-CENTRAL-BACKEND-READY.md` (this file)

### ✅ Updated:
- `backend/src/controllers/auth.controller.js` (added `sendOtpHandler`, `verifyOtpHandler`)
- `backend/src/routes/auth.routes.js` (added Message Central routes)
- `backend/prisma/schema.prisma` (added `OtpAttempt` model)

### 📝 To Update:
- `backend/.env` (add Message Central credentials)
- Render environment variables

---

## 🎯 AFTER BACKEND IS DEPLOYED

Once backend is working, you can:

1. **Keep using Firebase** - Both systems can coexist
2. **Test Message Central** - Build a test version of the mobile app
3. **Migrate gradually** - Switch users over time
4. **Remove Firebase later** - Once Message Central is proven stable

---

## 📞 API ENDPOINTS SUMMARY

### Message Central OTP (NEW):
```
POST /api/auth/patient/send-otp
Body: { "mobileNumber": "9876543210" }
Response: { "verificationId": "xxx", "expiresIn": 60 }

POST /api/auth/patient/verify-otp
Body: { "verificationId": "xxx", "otp": "123456", "mobileNumber": "+919876543210" }
Response: { "accessToken": "...", "refreshToken": "...", "user": {...} }
```

### Firebase Phone Auth (EXISTING):
```
POST /api/auth/patient/firebase-phone-login
Body: { "firebaseIdToken": "xxx" }
Response: { "accessToken": "...", "refreshToken": "...", "user": {...} }
```

Both endpoints work independently and can coexist.

---

## 💰 COST TRACKING

### Message Central Pricing:
- **Free Credits:** Check your dashboard
- **Pay-as-you-go:** After free credits exhausted
- **Per SMS:** Contact Message Central for rates

### Firebase (Current):
- **Free:** 10,000 verifications/month
- **After limit:** $0.01 per verification

**Recommendation:** Test Message Central with free credits first, then compare costs.

---

## 🚀 READY TO PROCEED?

Your backend code is **100% ready**. Just follow the 5 steps above:

1. ✅ Add environment variables
2. ✅ Run database migration
3. ✅ Test locally
4. ✅ Deploy to Render
5. ✅ Test production

**Estimated time:** 30 minutes total

---

**Questions?** Check the troubleshooting section or review the detailed guides:
- `MESSAGE-CENTRAL-MIGRATION-PLAN.md`
- `QUICK-START-MESSAGE-CENTRAL.md`

**Good luck! 🎉**
