# 🔴 URGENT: Fix Render Environment Variables

## Problem
Your backend on Render has **SWAPPED** Message Central credentials, causing the error:
```
"Failed to generate authentication token"
```

## Current (WRONG) Configuration on Render
```
MESSAGE_CENTRAL_AUTH_KEY=C-B6442109CBD3438
MESSAGE_CENTRAL_CUSTOMER_ID=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
```

## ✅ CORRECT Configuration (Copy This)

Go to [Render Dashboard](https://dashboard.render.com) → `pulsemate-backend` → **Environment** tab:

### Delete These Variables
- ❌ `MESSAGE_CENTRAL_AUTH_KEY` (this variable shouldn't exist)

### Update/Add These Variables
```
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
MESSAGE_CENTRAL_PASSWORD=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com
```

## Steps to Fix

1. **Open Render Dashboard**
   ```
   https://dashboard.render.com
   ```

2. **Navigate to Backend Service**
   - Click on `pulsemate-backend` service
   - Go to **Environment** tab

3. **Delete Wrong Variable**
   - Find `MESSAGE_CENTRAL_AUTH_KEY`
   - Click the ❌ (delete) button

4. **Update Customer ID**
   - Find `MESSAGE_CENTRAL_CUSTOMER_ID`
   - Change value to: `C-B6442109CBD3438`
   - Click **Save Changes**

5. **Update Password**
   - Find `MESSAGE_CENTRAL_PASSWORD`
   - Change value to: `eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ`
   - Click **Save Changes**

6. **Verify Base URL**
   - Find `MESSAGE_CENTRAL_BASE_URL`
   - Should be: `https://cpaas.messagecentral.com`

7. **Save All Changes**
   - Click **Save Changes** at the bottom
   - Render will automatically redeploy the backend

8. **Wait for Deployment**
   - Monitor the **Logs** tab
   - Wait for "Service is live" message
   - Should take 1-2 minutes

## Verify Fix

After Render redeploys, test OTP on your Android app:

1. **Restart Android emulator** (or reconnect)
2. **Launch PulseMate Connect app**
3. **Enter mobile number**: `9876543210`
4. **Click "Send OTP"**
5. **Check if OTP is sent** (you should receive SMS)

## If Still Not Working

Check Message Central account:
- Login to: https://cpaas.messagecentral.com
- Check **account balance/credits**
- Check **API rate limits**
- Check **SMS service status**

## Backend Verification Commands

If you want to test backend locally with correct credentials:

```bash
# In backend folder
cd backend

# Check .env file (already correct)
cat .env | grep MESSAGE_CENTRAL

# Should show:
# MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
# MESSAGE_CENTRAL_PASSWORD=eyJhbGci...
# MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com

# Start backend locally
npm start
```

## Summary

**Root Cause:** Environment variables were swapped
- **Wrong:** CUSTOMER_ID = password, AUTH_KEY = customer ID
- **Correct:** CUSTOMER_ID = customer ID, PASSWORD = password

**Impact:** Backend can't authenticate with Message Central API
**Fix Time:** 2-3 minutes (update Render env vars + redeploy)
**Testing:** Try Send OTP after Render shows "Service is live"

---

**Status:** 🔴 Waiting for Render environment variable fix
**Next Step:** Fix Render env vars → Restart emulator → Test OTP
