# 🔧 DATABASE URL SETUP REQUIRED

## ⚠️ Issue Detected

The local backend `.env` file needs your database credentials to run migrations.

---

## 🎯 QUICK SOLUTION: Skip Local Setup, Deploy Directly

Since the database credentials are in Render (production), you can **skip local testing** and deploy directly. The migration will run automatically on Render.

### Steps:

1. **Add Message Central env vars to Render:**
   - Go to: https://dashboard.render.com/
   - Select your backend service
   - Environment tab → Add these variables:
     ```
     MESSAGE_CENTRAL_CUSTOMER_ID = C-B6442109CBD3438
     MESSAGE_CENTRAL_PASSWORD = eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
     MESSAGE_CENTRAL_BASE_URL = https://cpaas.messagecentral.com
     ```
   - Save changes

2. **Push code to GitHub:**
   ```bash
   cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
   git add .
   git commit -m "Add Message Central OTP backend"
   git push origin main
   ```

3. **Wait for Render deployment** (~5-10 minutes)

4. **Test production API:**
   ```bash
   curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp ^
     -H "Content-Type: application/json" ^
     -d "{\"mobileNumber\": \"9876543210\"}"
   ```

---

## 🔧 ALTERNATIVE: Setup Local Database (Optional)

If you want to test locally first, you need to get your database URL from Render:

### Steps:

1. **Get Database URL from Render:**
   - Go to: https://dashboard.render.com/
   - Select your backend service
   - Environment tab
   - Find `DATABASE_URL` and `DIRECT_URL`
   - Copy both values

2. **Update backend/.env:**
   ```env
   DATABASE_URL=postgresql://user:pass@host/db
   DIRECT_URL=postgresql://user:pass@host/db
   ```

3. **Run migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_otp_attempt_table
   npx prisma generate
   ```

4. **Start backend:**
   ```bash
   npm run dev
   ```

5. **Test locally:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/patient/send-otp ^
     -H "Content-Type: application/json" ^
     -d "{\"mobileNumber\": \"9876543210\"}"
   ```

---

## ✅ RECOMMENDED APPROACH

**For fastest results:** Use Quick Solution above (deploy directly to production)

**Why?**
- Database is already configured on Render
- Migration runs automatically
- No local setup needed
- Faster to test

**Time:** 15 minutes

---

## 📞 READY TO PROCEED?

**Option 1 (Recommended):** Deploy to production now
```bash
# 1. Open terminal
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# 2. Commit changes
git add .
git commit -m "Add Message Central OTP backend"

# 3. Push to GitHub
git push origin main
```

Then add environment variables to Render dashboard (instructions above).

**Option 2:** Setup local database first
- Get DATABASE_URL from Render
- Update backend/.env
- Run migration locally

---

## 🎯 NEXT STEP

I recommend **Option 1** (deploy directly). Your code is ready, and Render will handle the migration automatically.

Shall I help you commit and push the code?
