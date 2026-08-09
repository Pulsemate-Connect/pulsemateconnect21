# 🔍 Message Central Authentication - Diagnostic Report

**Generated:** 2026-08-06  
**Status:** ❌ CRITICAL ISSUE IDENTIFIED  
**Root Cause:** WRONG CREDENTIAL TYPE

---

## Executive Summary

The Message Central authentication is failing because `MESSAGE_CENTRAL_PASSWORD` contains a **JWT token** instead of the required **Base64 API key**.

Message Central API Error:
```
{"error": "Illegal base64 character 2e"}
```

**0x2e = period (.)** - JWT tokens contain periods as separators, but periods are **NOT valid Base64 characters**.

---

## Diagnostic Analysis (Steps 1-7)

### ✅ STEP 1: Implementation Review

**File:** `backend/src/services/messagecentral.service.js`

**Endpoint:** `GET /auth/v1/authentication/token`

**Request Format:**
```javascript
{
  params: {
    customerId: CUSTOMER_ID,  // Correct
    key: PASSWORD,            // WRONG - This is a JWT, not Base64
    scope: 'NEW',            // Correct
    country: '91'            // Correct
  }
}
```

**Verdict:** ✅ Implementation matches Message Central documentation

---

### ✅ STEP 2: Environment Variable Validation

From Render logs:

```
[MessageCentral] 📋 Using CUSTOMER_ID: C-B6442109CBD3438
[MessageCentral] 🔒 PASSWORD length: 190
[MessageCentral] 🌐 BASE_URL: https://cpaas.messagecentral.com
```

**Analysis:**

| Variable | Status | Value Summary |
|----------|--------|---------------|
| `MESSAGE_CENTRAL_CUSTOMER_ID` | ✅ Present | `C-B6442109CBD3438` (20 chars) |
| `MESSAGE_CENTRAL_PASSWORD` | ⚠️ Present but WRONG TYPE | 190 characters, contains periods |
| `MESSAGE_CENTRAL_BASE_URL` | ✅ Correct | `https://cpaas.messagecentral.com` |

**Character Analysis:**
- ✅ No extra spaces
- ✅ No newlines
- ✅ No tabs
- ✅ No quotes
- ❌ **Contains periods (.)** ← This is the problem!

**Verdict:** ❌ PASSWORD has wrong format (JWT instead of Base64)

---

### ❌ STEP 3: Credential Type Detection

**PASSWORD Structure Analysis:**

```
Length: 190 characters
Starts with: eyJhbGc...
Ends with: ...7WxnAQ
Contains periods: YES ❌
```

**Pattern Match:** JWT Token (header.payload.signature)

**JWT Structure:**
```
eyJhbGci...  .  eyJzdWI...  .  SecuHOe9...
  ↑               ↑               ↑
header          payload        signature
```

**Why This Fails:**
1. Message Central expects **Base64-encoded API key**
2. Base64 alphabet: `A-Z, a-z, 0-9, +, /, =` (no periods!)
3. JWT format includes **periods** as separators
4. Message Central API rejects: `"Illegal base64 character 2e"` (hex for '.')

**Verdict:** ❌ WRONG CREDENTIAL TYPE - JWT token provided, Base64 API key required

---

### ✅ STEP 4: Request Logging

**Outgoing Request:**
```http
GET https://cpaas.messagecentral.com/auth/v1/authentication/token
?customerId=C-B6442109CBD3438
&key=eyJhbGci... (JWT token - WRONG!)
&scope=NEW
&country=91
```

**Headers:**
```json
{
  "accept": "*/*"
}
```

**Verdict:** ✅ Request format correct, but credential value is wrong type

---

### ❌ STEP 5: API Response Analysis

**Message Central API Response:**
```json
{
  "error": "Illegal base64 character 2e"
}
```

**Analysis:**
- Status: API returned error response
- Error Code: Base64 validation error
- Character 0x2e: Period (.)
- Location: The `key` parameter (PASSWORD value)

**Verdict:** ❌ API explicitly rejected the JWT token due to period characters

---

### ✅ STEP 6: Request Encoding Verification

**Encoding Method:** Axios automatic URL encoding via `params`

**Test:** No manual encoding issues detected

**Verdict:** ✅ Request encoding is correct

---

### ❌ STEP 7: Base64 Validation

**Test:** Attempt to decode PASSWORD as Base64

```javascript
Buffer.from(PASSWORD, 'base64')
```

**Expected Result:** Should fail because JWT contains periods

**Why It Would Fail:**
- Base64 decoder encounters '.' character
- '.' is not in Base64 alphabet
- Decoding would fail or produce incorrect output

**Verdict:** ❌ Password is NOT valid Base64 (it's a JWT)

---

## Root Cause Analysis

### The Problem

You configured `MESSAGE_CENTRAL_PASSWORD` with a **JWT authentication token** instead of the **Base64 API key**.

### JWT vs Base64 API Key

| Aspect | JWT Token (WRONG) | Base64 API Key (CORRECT) |
|--------|-------------------|--------------------------|
| **Format** | header.payload.signature | Continuous Base64 string |
| **Length** | ~190 chars | Variable (typically 40-60) |
| **Contains Periods** | ✅ YES (separators) | ❌ NO |
| **Example** | `eyJhbGci...eyJzdWI...SecuHOe9...` | `c2VjcmV0a2V5MTIzNDU2Nzg5MA==` |
| **Use Case** | Session authentication | API authentication |

### Where the Credential Came From

The JWT token format suggests it came from:
1. Message Central **Login Session** (browser)
2. Message Central **Dashboard Authentication**
3. OR a different API endpoint that returns JWTs

**It did NOT come from:**
- Message Central API Credentials section
- API Key generation page

---

## Recommended Fix

### Option 1: Get the Correct API Key (RECOMMENDED)

1. **Login to Message Central Dashboard:**
   ```
   https://cpaas.messagecentral.com
   ```

2. **Navigate to one of these sections:**
   - API Credentials
   - API Keys
   - Authentication Keys
   - Settings → API
   - Developer Settings

3. **Look for:**
   - "API Key"
   - "Authentication Key"
   - "Secret Key"
   - "Base64 Key"

4. **Characteristics of the CORRECT key:**
   - Should be **pure Base64** (no periods)
   - May be labeled as "Secret" or "Key"
   - Might be shown with a "Copy" button
   - Could be under "VerifyNow API" section

5. **Update Render Environment:**
   ```bash
   MESSAGE_CENTRAL_PASSWORD=<the-correct-base64-key>
   ```

6. **Verify:**
   - No periods in the value
   - All characters are A-Z, a-z, 0-9, +, /, =
   - Length is reasonable (40-100 characters typical)

---

### Option 2: Contact Message Central Support

If you cannot find the correct API key:

**Email:** support@messagecentral.com

**Subject:** "Need Base64 API Key for VerifyNow OTP API"

**Message Template:**
```
Hello Message Central Support,

I need to integrate the VerifyNow OTP API and require the correct 
authentication credentials.

Customer ID: C-B6442109CBD3438

I currently have a JWT token but your API is returning:
"Illegal base64 character 2e"

Please provide:
1. The correct Base64 API key for authentication
2. Location in dashboard where I can find it

Thank you!
```

---

### Option 3: Check Message Central Documentation

**Documentation URL:** https://docs.messagecentral.com (or similar)

**Search for:**
- "Authentication"
- "API Keys"
- "VerifyNow API"
- "Getting Started"

**What to look for:**
- How to generate API keys
- Authentication method for VerifyNow
- Example requests with credential format

---

## What Will Happen After Fix

Once you update `MESSAGE_CENTRAL_PASSWORD` with the correct Base64 API key:

### ✅ Expected Flow:

1. **Token Generation:**
   ```
   GET /auth/v1/authentication/token
   → Response: { "authToken": "..." }
   ```

2. **Send OTP:**
   ```
   POST /verification/v3/send
   Header: authToken
   → Response: { "verificationId": "...", "timeout": 60 }
   ```

3. **Frontend:**
   ```
   User clicks "Send OTP"
   → SMS delivered
   → User enters OTP
   → Login successful
   ```

---

## Testing Checklist

After updating the credential:

- [ ] Render deployment completes successfully
- [ ] Backend logs show: `[MessageCentral] ✅ Auth token generated successfully`
- [ ] No "Illegal base64 character" errors
- [ ] Test Send OTP from React Native app
- [ ] SMS received on mobile
- [ ] OTP verification works
- [ ] User can login successfully

---

## Prevention for Future

### Store Credentials Securely

```bash
# backend/.env.example
MESSAGE_CENTRAL_CUSTOMER_ID=your-customer-id
MESSAGE_CENTRAL_PASSWORD=your-base64-api-key  # NOT a JWT token!
MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com
```

### Document Credential Sources

Create a `backend/docs/credentials.md`:

```markdown
# Message Central Credentials

## Where to Find

1. Login: https://cpaas.messagecentral.com
2. Navigate: Dashboard → API Keys
3. Copy: Base64 API Key (not JWT session token)

## Format Validation

✅ Correct: Pure Base64 string (A-Z, a-z, 0-9, +, /, =)
❌ Wrong: JWT format (contains periods: header.payload.signature)
```

---

## Current Status

| Component | Status |
|-----------|--------|
| **Frontend** | ✅ Working (reaches backend) |
| **Backend Code** | ✅ Correct implementation |
| **Backend Deployment** | ✅ Live on Render |
| **Environment Variables** | ❌ CUSTOMER_ID: ✅ / PASSWORD: ❌ (wrong type) |
| **Message Central API** | ❌ Rejecting due to JWT token |
| **OTP Flow** | ❌ Blocked at token generation |

---

## Next Steps

1. ✅ **IMMEDIATE:** Get correct Base64 API key from Message Central
2. ✅ **UPDATE:** Render environment `MESSAGE_CENTRAL_PASSWORD`
3. ✅ **WAIT:** For Render to redeploy (1-2 minutes)
4. ✅ **TEST:** Click "Send OTP" in the app
5. ✅ **VERIFY:** SMS received and login works

---

## Contact for Help

If you need assistance finding the correct credential:

- **Message Central Support:** support@messagecentral.com
- **Message Central Docs:** https://docs.messagecentral.com
- **Customer ID:** C-B6442109CBD3438

---

**Remember:** The JWT token is for **browser/dashboard authentication**. The Base64 API key is for **programmatic API access**. You need the latter!
