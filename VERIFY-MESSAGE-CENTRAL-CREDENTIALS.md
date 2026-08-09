# 🔍 VERIFY MESSAGE CENTRAL CREDENTIALS

**Current Error:** "Failed to generate authentication token"  
**Action:** Let's verify your credentials are correct

---

## 🎯 CHECK YOUR CREDENTIALS

### Option 1: Test with Direct API Call

Run this PowerShell command to test Message Central directly:

```powershell
$customerId = "C-B6442109CBD3438"
$password = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ"

$uri = "https://cpaas.messagecentral.com/auth/v1/authentication/token?customerId=$customerId&key=$password&scope=NEW&country=91&email=tech@pulsemateconnect.in"

Invoke-RestMethod -Uri $uri -Method GET
```

**Expected Response if credentials are valid:**
```json
{
  "responseCode": 200,
  "message": "SUCCESS",
  "data": {
    "authToken": "some-long-token",
    "customerId": "C-B6442109CBD3438"
  }
}
```

**If you get error:**
- 401: Invalid credentials
- 403: Account disabled/suspended
- 500: Message Central service issue

---

## 🔧 FIX STEPS

### If Credentials Are Valid:

**Check Render Environment Variable:**

1. Go to Render → Environment
2. Find `MESSAGE_CENTRAL_PASSWORD`
3. Make sure it's the COMPLETE token (no truncation)
4. Should be exactly:
   ```
   eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
   ```

5. If different, update it
6. Restart Render service
7. Test again

---

### If Credentials Are Invalid:

**Get New Credentials:**

1. Go to Message Central dashboard
2. Generate new API credentials
3. Update in Render
4. Test again

**OR**

**Switch to Firebase** (already working, zero setup needed)

---

## 🎯 DECISION TIME

Run the PowerShell test above and tell me the result:

**Option A: Credentials work** → Update Render, test again (5 min)

**Option B: Credentials fail** → Contact Message Central OR use Firebase

**Option C: Too much hassle** → Use Firebase, ship app today

---

Which do you want to do?
