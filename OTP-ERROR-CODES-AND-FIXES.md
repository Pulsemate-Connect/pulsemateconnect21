# OTP Error Codes & Fixes — What to do if something goes wrong

## **Backend Log Messages Reference**

When you send OTP from the production app, check the backend logs in Render dashboard.

**Location:** https://dashboard.render.com → pulsemate-backend → Logs tab

---

## **MESSAGE 1: Success (What you want to see)**

```
[Firebase] ✓ OTP SMS sent to +917022818878 via Firebase
```

✅ **Status:** Everything is working!
- OTP was sent to the phone
- User should receive SMS within 30 seconds
- No action needed

---

## **MESSAGE 2: Service Account Not Configured**

```
[Firebase] Admin SDK not configured — falling back to mock. 
           Set FIREBASE_SERVICE_ACCOUNT_JSON in Render.
[SMS-MOCK] To: +917022818878 | OTP: 123456
```

❌ **Status:** Service account JSON is missing
- OTP only printed to console
- Not sent to phone
- User won't receive SMS

**Fix:**
1. Download Firebase service account JSON (see PRODUCTION-OTP-FIX-CHECKLIST.md)
2. Add to Render: FIREBASE_SERVICE_ACCOUNT_JSON
3. Save → Backend restarts
4. Retry OTP

---

## **MESSAGE 3: Malformed/Invalid JSON**

```
[Firebase] Admin credential error: SyntaxError: Unexpected token...
```

or

```
[Firebase] Admin credential error: Invalid JSON Web Token...
```

❌ **Status:** Service account JSON was pasted incorrectly
- JSON is corrupted or incomplete
- Backend cannot parse it

**Fix:**
1. Go to Render dashboard → pulsemate-backend → Environment
2. Find FIREBASE_SERVICE_ACCOUNT_JSON
3. **Clear the entire value** (delete everything)
4. Click "Save Changes"
5. Wait for backend to stabilize
6. Download the service account JSON again
7. **Copy the ENTIRE file** (from first `{` to last `}`)
8. Paste it carefully
9. Make sure it starts with `{` and ends with `}`
10. Save

**Check:** Open the JSON file in a text editor and verify:
- Starts with: `{`
- Ends with: `}`
- No extra characters before or after
- No quotes around the entire JSON

---

## **MESSAGE 4: Firebase Phone Auth Not Enabled**

```
[Firebase] sendVerificationCode failed: MISSING_CLIENT_IDENTIFIER
[Firebase] Falling back to mock — check Firebase Console: 
           Authentication → Phone → Enable
```

❌ **Status:** Firebase Phone Auth is disabled in Firebase Console
- Service account is configured ✓
- But Firebase Phone Auth provider is not enabled

**Fix:**
1. Go to: https://console.firebase.google.com/project/pulsemateconnect/authentication/providers
2. Look for **"Phone"** provider (might be in a list)
3. Click on it
4. Look for a toggle switch that says **"Enable"** or **"Enabled"**
5. **Toggle it ON** (it should turn blue/green)
6. Click "Save" if there's a button
7. Go back to the project
8. Go to Render and **manually restart** the backend (or just retry OTP)
9. Test OTP again

**What it should look like after enabling:**
- The Phone provider shows: ✓ (checkmark)
- Status shows: "Enabled"

---

## **MESSAGE 5: Invalid Access Token**

```
[Firebase] Network error: socket hang up
```

or

```
[Firebase] Network error: ECONNREFUSED
```

❌ **Status:** Network connectivity issue (rare)
- Backend cannot reach Firebase servers
- Could be temporary
- Could be a Render region issue

**Fix:**
1. Wait 1-2 minutes and retry
2. If still fails, go to Render → pulsemate-backend → Settings
3. Note the region (probably Singapore or Singapore-Singapore)
4. Create a new issue ticket with:
   - The error message
   - When it started
   - How many times it happened

---

## **MESSAGE 6: Quota Exceeded**

```
[Firebase] sendVerificationCode failed: ...QUOTA_EXCEEDED...
```

or

```
[Firebase] sendVerificationCode failed: ...quota...
```

⚠️ **Status:** Firebase SMS quota exceeded for the day/month
- Backend is configured correctly
- Service account is working
- But Firebase has rate limits

**What happened:**
- Firebase has a free quota (usually 10-20 SMS per day)
- You've exceeded it
- Firebase blocked further SMS sending

**Fix:**
1. **Wait until the next day** (quota resets daily)
2. Or: **Switch to 2Factor.in** (alternative SMS provider)
   - Go to Render → Environment
   - Change: SMS_PROVIDER = "2factor"
   - Add: SMS_API_KEY = (your 2factor key from https://2factor.in)
   - Save

**To increase Firebase quota:**
1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/quotas
2. Check if you can increase the SMS limit
3. May require Firebase paid plan

---

## **MESSAGE 7: Invalid Phone Number**

```
[Firebase] sendVerificationCode failed: INVALID_PHONE_NUMBER
```

❌ **Status:** The phone number format is wrong
- User entered: "9876543210" (10 digits without country code)
- Firebase needs: "+919876543210" (with +91 for India)

**This shouldn't happen because:**
- The app normalizes the phone number before sending
- But if it does, check that the app is using the correct format

**Fix:** Retry with proper +91 prefix

---

## **MESSAGE 8: Too Many Requests**

```
[Firebase] sendVerificationCode failed: TOO_MANY_ATTEMPTS
```

⚠️ **Status:** Too many OTP requests from this number
- Firebase rate limits: ~3-5 requests per phone number per hour
- User is trying to send too many OTPs

**Fix:**
1. User should wait 1-2 hours
2. Try again later

---

## **MESSAGE 9: Session Expired**

```
[Firebase] sendVerificationCode failed: SESSION_EXPIRED
```

❌ **Status:** Firebase verification session expired
- User took too long to verify the OTP
- Firebase OTP is only valid for ~5 minutes

**Fix:** User should retry OTP verification within the time limit

---

## **MESSAGE 10: Backend Crashes / Keeps Restarting**

```
[Error] Cannot parse env: FIREBASE_SERVICE_ACCOUNT_JSON
```

or

```
[Error] Unexpected token in JSON at position...
```

or

**Backend status shows "Crashed" in Render dashboard**

❌ **Status:** Invalid JSON caused backend startup failure
- Backend cannot start because it's trying to parse bad JSON
- It crashes and retries in a loop

**Fix:**
1. Go to Render → pulsemate-backend → Environment
2. Find FIREBASE_SERVICE_ACCOUNT_JSON
3. **Delete the entire value** (leave it empty)
4. Click "Save Changes"
5. Wait 2 minutes — backend should stabilize and restart
6. Once it's running again (green status), download the service account JSON again
7. Triple-check the JSON:
   - Copy from a text editor, not directly from browser
   - Make sure there's no extra whitespace at the start/end
   - Verify it starts with `{` and ends with `}`
8. Paste carefully into Render
9. Save

**Pro tip:** If you're unsure about the JSON formatting:
1. Paste the JSON into: https://jsonlint.com/
2. If it shows "Valid JSON" (green check), then it's good
3. Then paste it into Render

---

## **TROUBLESHOOTING FLOWCHART**

```
Did you add the Firebase service account JSON? 
  ├─ NO → Do PRODUCTION-OTP-FIX-CHECKLIST.md Step 1 & 2
  └─ YES → Did you see this message in logs?
      ├─ "[Firebase] ✓ OTP SMS sent" 
      │   └─ ✅ SUCCESS! OTP is working. Check phone for SMS.
      │
      ├─ "Admin SDK not configured"
      │   └─ ❌ Service account not actually added. Retry Step 2.
      │
      ├─ "SyntaxError" / "Invalid token"
      │   └─ ❌ JSON was pasted wrong. Clear field, re-paste carefully.
      │
      ├─ "MISSING_CLIENT_IDENTIFIER"
      │   └─ ❌ Phone Auth not enabled in Firebase Console. Enable it.
      │
      ├─ "QUOTA_EXCEEDED"
      │   └─ ⚠️ Firebase quota hit. Wait until tomorrow or use 2Factor.in
      │
      ├─ "Backend keeps restarting"
      │   └─ ❌ Invalid JSON. Clear field, backend stabilizes, retry.
      │
      └─ Other error?
          └─ Screenshot the error and check next section
```

---

## **IF YOU'RE REALLY STUCK**

1. **Screenshot the backend log message** (copy the entire error)
2. **Write down:**
   - When did it start failing?
   - How many times have you retried?
   - What steps did you already try?
3. **Go to:** https://dashboard.render.com/logs?name=pulsemate-backend
4. **Copy the entire log output** (Ctrl+A → Ctrl+C)
5. **Share both the screenshot and logs**

Then we can debug the specific issue.

---

## **COMMON MISTAKES**

### Mistake 1: Pasting only the private key
```json
// ❌ WRONG
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBg...
-----END PRIVATE KEY-----
```

**Fix:** Paste the entire JSON file, not just the private key:
```json
// ✅ CORRECT
{
  "type": "service_account",
  "project_id": "pulsemateconnect",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  ...
}
```

---

### Mistake 2: Adding extra quotes
```
// ❌ WRONG
"{\"type\": \"service_account\", ...}"
```

**Fix:** Paste the raw JSON without surrounding quotes:
```
// ✅ CORRECT
{"type": "service_account", ...}
```

---

### Mistake 3: Pasting after the correct value
```
// ❌ WRONG
{"type": "service_account", ...}
{"type": "service_account", ...}
```

**Fix:** There should only be ONE JSON object:
```
// ✅ CORRECT
{"type": "service_account", ...}
```

---

## **SUCCESS INDICATORS**

After the fix is applied, you should see:

1. **In Render logs:**
   ```
   [Firebase] ✓ OTP SMS sent to +917022818878 via Firebase
   ```

2. **On your phone:**
   ```
   Your PulseMate OTP is 123456. Valid for 5 minutes. 
   Do not share it with anyone. -PULSE
   ```

3. **In app:**
   - OTP screen shows the 6-digit code you received
   - You can verify the OTP successfully

**All three = Everything is working! ✅**

---

## **NEED MORE HELP?**

Check these docs in order:
1. PRODUCTION-OTP-FIX-CHECKLIST.md - Step by step
2. OTP-ARCHITECTURE-EXPLAINED.md - Technical details
3. This file (OTP-ERROR-CODES-AND-FIXES.md) - Troubleshooting

If you're still stuck, gather:
- Backend logs screenshot
- Error message
- Steps you've already tried
- Phone number you're testing with (can be masked)

We can then debug the specific issue.
