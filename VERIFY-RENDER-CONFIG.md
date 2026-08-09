# 🔍 Verify Render Configuration

## What to Check on Render Dashboard

### 1. Go to Environment Tab
URL: https://dashboard.render.com → `pulsemate-backend` → **Environment**

### 2. Verify EXACT Variable Names and Values

You should see EXACTLY these three variables (no more, no less):

#### ✅ MESSAGE_CENTRAL_CUSTOMER_ID
```
C-B6442109CBD3438
```
**Common mistakes:**
- ❌ Variable name is `MESSAGE_CENTRAL_AUTH_KEY` (wrong name)
- ❌ Variable name has typos
- ❌ Value is the long token (swapped)

#### ✅ MESSAGE_CENTRAL_PASSWORD
```
eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
```
**Common mistakes:**
- ❌ Variable name is `MESSAGE_CENTRAL_KEY` or `MESSAGE_CENTRAL_AUTH_KEY`
- ❌ Value is `C-B6442109CBD3438` (swapped)
- ❌ Value is truncated or has spaces

#### ✅ MESSAGE_CENTRAL_BASE_URL
```
https://cpaas.messagecentral.com
```
**Common mistakes:**
- ❌ Missing `https://`
- ❌ Typo in domain name
- ❌ Trailing slash

### 3. Make Sure These DON'T Exist
- ❌ `MESSAGE_CENTRAL_AUTH_KEY` (delete this if you see it)
- ❌ `MESSAGE_CENTRAL_KEY` (delete this if you see it)

---

## 4. Check Deployment Status

### In the Logs Tab:
Look for these messages (recent timestamps):

✅ **Good Signs:**
```
Starting service...
Building...
Deploy successful
Service is live
```

❌ **Bad Signs:**
```
Deploy failed
Build error
Service crashed
```

### In the Events Tab:
Check the most recent event:
- Should show "Deploy live" with a recent timestamp
- If it shows "Deploy failed" or old timestamp, deployment didn't work

---

## 5. Manual Deployment (if needed)

If Render didn't automatically redeploy:

1. Go to your `pulsemate-backend` service
2. Click **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Wait for deployment to complete

---

## 6. Test Backend Directly

After deployment is complete, test from your computer:

### Windows PowerShell:
```powershell
curl.exe -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp `
  -H "Content-Type: application/json" `
  -d '{\"mobileNumber\":\"+919876543210\"}'
```

### Expected Response (Success):
```json
{
  "success": true,
  "data": {
    "verificationId": "some-id-here",
    "expiresIn": 60,
    "message": "OTP sent successfully"
  }
}
```

### Current Response (Failure):
```json
{
  "success": false,
  "message": "Failed to generate authentication token"
}
```

---

## Common Issues and Fixes

### Issue 1: "I saved but still get the error"
**Possible causes:**
- Environment variables not saved properly
- Old deployment is still running
- Cache issue

**Fix:**
1. Double-check environment variables are EXACTLY as shown above
2. Click "Save Changes" again
3. Go to Manual Deploy → "Deploy latest commit"
4. Wait 2-3 minutes
5. Test again

### Issue 2: "Deployment stuck or failed"
**Fix:**
1. Check Logs tab for error messages
2. Try Manual Deploy
3. Check if service is paused (top right corner)
4. Restart service if needed

### Issue 3: "Variables look correct but still failing"
**Possible causes:**
- Typo in variable name (even one character difference matters)
- Extra spaces in values
- Wrong credential values

**Fix:**
1. DELETE all three Message Central variables
2. ADD them again from scratch (copy-paste from below)
3. Save and wait for redeploy

---

## Copy-Paste Values (Use These Exactly)

### Variable 1:
**Name:**
```
MESSAGE_CENTRAL_CUSTOMER_ID
```
**Value:**
```
C-B6442109CBD3438
```

### Variable 2:
**Name:**
```
MESSAGE_CENTRAL_PASSWORD
```
**Value:**
```
eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
```

### Variable 3:
**Name:**
```
MESSAGE_CENTRAL_BASE_URL
```
**Value:**
```
https://cpaas.messagecentral.com
```

---

## Screenshot Checklist

Take a screenshot of your Render Environment tab and verify:
- [ ] Exactly 3 Message Central variables (no more, no less)
- [ ] Variable names match EXACTLY (case-sensitive)
- [ ] No typos in variable names
- [ ] CUSTOMER_ID has the short value `C-B6442109CBD3438`
- [ ] PASSWORD has the long JWT token value
- [ ] BASE_URL is `https://cpaas.messagecentral.com`
- [ ] No `MESSAGE_CENTRAL_AUTH_KEY` variable exists
- [ ] "Save Changes" button is grayed out (means changes are saved)

---

## Still Not Working?

If you've verified everything above and it still doesn't work:

1. **Check Message Central Account:**
   - Login to: https://cpaas.messagecentral.com
   - Verify account is active
   - Check credits/balance
   - Verify API key hasn't expired

2. **Test Locally:**
   - Use your local backend (already has correct .env)
   - Change axios base URL to local backend
   - Test if OTP works locally
   - If yes, problem is Render config
   - If no, problem is Message Central account

3. **Contact Message Central Support:**
   - If credentials are correct but API still fails
   - They can check if your account has issues
   - API might be down temporarily

---

**After verification, come back and tell me:**
1. What the Logs tab shows (deployment status)
2. Whether variables match exactly
3. Result of testing the endpoint directly
