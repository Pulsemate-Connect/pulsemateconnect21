# OTP Configuration Guide - Message Central Setup

**Date:** 2026-08-12  
**Status:** Waiting for Message Central Credentials

---

## Current Situation Summary

### ✅ What's Working

1. **Test Numbers (Development Mode)**
   - Numbers: `9999999999`, `8888888888`, `7777777777`
   - Fixed OTP: `123456`
   - No real SMS sent (saves costs during development)
   - Backend stores OTP in database for verification
   - Frontend shows test OTP in toast notification (10 seconds)

2. **OTP Flow Structure**
   - Send OTP → Store in database → Verify OTP → Login/Register
   - Proper error handling and attempt limits (5 max attempts)
   - OTP expiration (5 minutes)
   - Resend cooldown (30 seconds)

### ❌ What's NOT Working

1. **Real Phone Numbers (Production Mode)**
   - Example: `8762697832`
   - **Error:** "Message Central Token Generation Failed: API_ERROR: No authToken or token in response data"
   - **Root Cause:** Invalid Message Central credentials in `.env` file

2. **Multi-Role Support (Backend)**
   - Existing PATIENT users cannot add CLINIC_OWNER role yet
   - Backend needs `user_roles` table (see spec)
   - `verifyOtpHandler` doesn't implement role addition logic

---

## Issue 1: Message Central Credentials (URGENT)

### Current Invalid Credentials

```env
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438  # ✅ Valid
MESSAGE_CENTRAL_EMAIL=YOUR_ACTUAL_EMAIL@example.com  # ❌ Placeholder
MESSAGE_CENTRAL_PASSWORD=YOUR_ACTUAL_API_KEY_OR_BASE64_PASSWORD  # ❌ Placeholder
```

### Action Required

You need to provide **actual Message Central credentials** to send real SMS OTP.

#### Step 1: Get Credentials from Message Central Dashboard

1. Go to: https://cpaas.messagecentral.com/
2. Login with your account
3. Navigate to **Settings** → **API Keys** or **Credentials**
4. Copy the following:
   - ✅ Customer ID (already set: `C-B6442109CBD3438`)
   - ❌ Email (your registered email)
   - ❌ API Key / Password

#### Step 2: Update `.env` File

Open `backend/.env` and update lines 106-108:

```env
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
MESSAGE_CENTRAL_EMAIL=your_actual_email@domain.com  # Replace this
MESSAGE_CENTRAL_PASSWORD=your_actual_api_key_here   # Replace this
```

**Important Notes:**
- If Message Central provides an **API Key**, use it directly
- If Message Central provides a **Password**, Base64-encode it first:
  ```bash
  # On Windows PowerShell:
  [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your_password"))
  ```
- Don't use quotes around the values in `.env`

#### Step 3: Restart Backend Server

After updating `.env`:

```bash
cd backend
# Stop the server (Ctrl+C)
npm start
# Or if using nodemon, it will auto-restart
```

#### Step 4: Test with Real Number

1. Open frontend: http://localhost:3000/clinic-partner
2. Enter mobile: `8762697832` (or your test number)
3. Click "Send One Time Password"
4. Check:
   - SMS received on phone
   - Backend logs (should show: "OTP sent successfully")
   - Message Central dashboard (should show sent SMS)

---

## Issue 2: Frontend Cache ("This login is only for clinic owners")

### Problem

User reported seeing error: **"This login is only for clinic owners"** for test number `9999999999`.

However, this error **was already removed** from `ClinicAuthModal.jsx` in our previous fix.

### Solution: Clear Browser Cache

The error is likely cached in the browser. Do **HARD REFRESH**:

- **Chrome/Edge:** Ctrl + Shift + R
- **Firefox:** Ctrl + F5
- Or open DevTools → Network tab → Check "Disable cache" → Refresh

---

## Issue 3: Multi-Role Support (Not Yet Implemented)

### Current Behavior

When existing PATIENT (9999999999) tries to become CLINIC_OWNER:
1. ✅ Gets OTP successfully
2. ✅ Verifies OTP successfully
3. ❌ Stays as PATIENT only (no CLINIC_OWNER role added)
4. ✅ Redirected to clinic onboarding (but as PATIENT)

### What Needs to Be Implemented

According to the spec (`.kiro/specs/unified-multi-role-otp-auth/`):

#### Database Change (Task 1.1)

Create `user_roles` junction table:

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'ADMIN')),
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, role)
);
```

#### Backend Logic Change (Task 2.5)

Update `verifyOtpHandler` to:

```javascript
// After OTP verification
let user = await prisma.user.findUnique({
  where: { mobile: cleanNumber },
  include: { 
    ...baseUserInclude,
    userRoles: true // Include roles
  }
});

if (!user) {
  // Create new user with requested role
  user = await prisma.user.create({
    data: {
      mobile: cleanNumber,
      // ...other fields
      userRoles: {
        create: { role: userRole }
      }
    }
  });
} else {
  // Existing user - check if they already have this role
  const hasRole = user.userRoles.some(r => r.role === userRole);
  
  if (!hasRole && userRole === 'CLINIC_OWNER') {
    // Add CLINIC_OWNER role to existing PATIENT
    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: 'CLINIC_OWNER'
      }
    });
    
    // Create clinic owner profile if not exists
    if (!user.clinicOwnerProfile) {
      await prisma.clinicOwnerProfile.create({
        data: {
          userId: user.id,
          profileCompleted: false
        }
      });
    }
  }
  
  // Reload user with updated roles
  user = await prisma.user.findUnique({
    where: { id: user.id },
    include: { ...baseUserInclude, userRoles: true }
  });
}

// Update JWT payload to include roles array
const tokens = await issueAuthTokens(res, user, req);
```

**This is NOT implemented yet.** Users currently have only one role (single `role` enum field).

---

## Testing Checklist

### Test Mode (Development)

- [ ] Test number `9999999999` → OTP `123456` → Login successful
- [ ] Test number `8888888888` → OTP `123456` → Login successful
- [ ] Frontend shows test OTP in toast (10 seconds)
- [ ] Backend logs: "🧪 TEST MODE: Using test OTP"
- [ ] No real SMS sent

### Production Mode (After Message Central Setup)

- [ ] Real number `8762697832` → SMS received
- [ ] OTP verification successful
- [ ] Backend logs: "✅ OTP sent successfully"
- [ ] Message Central dashboard shows sent SMS
- [ ] User logged in successfully

### Multi-Role (Future - After Implementation)

- [ ] Existing PATIENT → Can add CLINIC_OWNER role
- [ ] Existing DOCTOR → Can add PATIENT role
- [ ] JWT includes roles array
- [ ] Workspace switching works
- [ ] No duplicate users created

---

## Quick Commands Reference

### Backend Operations

```bash
# Start backend server
cd backend
npm start

# View backend logs (real-time)
# Check terminal where backend is running

# Check environment variables
# Open backend/.env in editor
```

### Frontend Operations

```bash
# Start frontend server
cd frontend
npm run dev

# Clear cache and restart
# Ctrl+C to stop
npm run dev
# Then hard refresh browser
```

### Database Operations

```bash
# Connect to Supabase database
cd backend
npx prisma studio  # Visual database browser

# Run migrations (after creating user_roles table)
npx prisma migrate dev --name add_user_roles
```

---

## What to Do Next

### Immediate Action (To Test Real SMS)

1. **Get Message Central credentials** (email + API key/password)
2. **Update `backend/.env`** with actual values
3. **Restart backend server**
4. **Test with real phone number** (8762697832)

### Future Implementation (Multi-Role Support)

1. **Create `user_roles` table** (Prisma migration)
2. **Update `verifyOtpHandler`** (add role assignment logic)
3. **Update JWT payload** (include roles array)
4. **Test multi-role scenarios** (PATIENT → CLINIC_OWNER)

---

## Support

If you encounter errors:

1. **Check backend logs** (terminal where `npm start` is running)
2. **Check frontend console** (Browser DevTools → Console)
3. **Check Message Central dashboard** (if using real numbers)
4. **Share error message** with full context

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "No authToken or token in response" | Invalid Message Central credentials | Update `.env` with correct credentials |
| "This login is only for clinic owners" | Browser cache | Hard refresh (Ctrl+Shift+R) |
| "OTP expired" | OTP older than 5 minutes | Request new OTP |
| "Maximum OTP attempts exceeded" | Wrong OTP 5+ times | Request new OTP |
| "Invalid mobile number format" | Number not 10 digits | Enter 10-digit number only |

---

**Status:** Awaiting Message Central credentials from user to enable real SMS OTP.
