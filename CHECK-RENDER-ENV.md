# Check Render Environment Variables

## What to Check

Go to your Render dashboard:
1. Open https://dashboard.render.com
2. Find your backend service
3. Go to **Environment** tab
4. Verify these EXACT values:

### Required Environment Variables

```
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438

MESSAGE_CENTRAL_PASSWORD=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ

MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com
```

## Verification Checklist

- [ ] MESSAGE_CENTRAL_CUSTOMER_ID is exactly: `C-B6442109CBD3438`
- [ ] MESSAGE_CENTRAL_PASSWORD is exactly 205 characters long
- [ ] MESSAGE_CENTRAL_PASSWORD starts with: `eyJhbGciOiJIUzUxMiJ9`
- [ ] MESSAGE_CENTRAL_PASSWORD ends with: `oxBbx7WxnAQ`
- [ ] MESSAGE_CENTRAL_BASE_URL is: `https://cpaas.messagecentral.com`
- [ ] No extra spaces or line breaks in any value
- [ ] After updating, click "Save Changes"
- [ ] Check "Events" tab - should see "Deploy live for {service-name}" within 1 minute

## Common Issues

### Issue 1: Password Truncated
If the password is cut off or split across lines:
- Delete the variable
- Add it again as a single line
- Paste the full 205-character token

### Issue 2: Deployment Not Triggered
If changing env vars didn't trigger a deploy:
- Go to **Manual Deploy** → **Deploy latest commit**
- Wait for deployment to complete (2-3 minutes)

### Issue 3: Still Getting Authentication Error
After fixing env vars:
1. Go to **Logs** tab
2. Look for "[MessageCentral]" log lines
3. Check if you see "Token generation failed" errors
4. Share the exact error message

## Test After Fixing

Once you've verified the environment variables:

```powershell
$body = @{
    mobileNumber = "9876543210"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.pulsemateconnect.in/api/auth/patient/send-otp" -Method POST -Body $body -ContentType "application/json"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "verificationId": "...",
    "expiresIn": 60,
    "message": "OTP sent successfully"
  }
}
```

## Quick Actions

1. **Check env vars right now**: Open Render → Environment tab
2. **Check last deployment**: Open Render → Events tab (should be within last hour)
3. **Check logs**: Open Render → Logs tab (look for MessageCentral errors)

---

**DO THIS NOW:**
1. Open Render dashboard
2. Go to Environment tab
3. Take a screenshot of MESSAGE_CENTRAL_PASSWORD value (first 50 and last 20 characters)
4. Check if it's exactly 205 characters

Let me know what you see!
