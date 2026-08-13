# 📧 Email OTP Registration Implementation Plan

**Date:** 2026-08-12  
**Requirement:** Use Email OTP for clinic partner registration (not mobile)  
**Status:** Implementation Plan Ready

---

## Requirements

### Registration Flow
- **Input:** Full Name + Email (NO mobile field visible)
- **OTP:** Sent to email (not mobile)
- **Test Emails:** Fixed OTP (test@example.com → 123456)
- **Real Emails:** Resend service sends actual email OTP

### Login Flow  
- **Keep as is:** Mobile + OTP (already working)

---

## Implementation Steps

### 1. Backend: Create Email OTP Registration Handlers

**File:** `backend/src/controllers/auth.controller.js`

Add new handlers:

```javascript
/**
 * POST /api/auth/register-email-otp/send
 * Send OTP to email for registration
 */
const sendRegistrationEmailOtp = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return sendError(res, 'Invalid email format', 400);
    }
    
    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, role: true },
    });
    
    // Allow existing users to add CLINIC_OWNER role
    if (existingUser) {
      logger.info(`[Auth] Existing user found for ${cleanEmail} with role ${existingUser.role}`);
    }
    
    // Check if test email
    const isTestMode = process.env.ENABLE_TEST_OTP === 'true';
    const testEmails = (process.env.TEST_OTP_EMAILS || 'test@example.com,demo@example.com').split(',');
    const testOtp = process.env.TEST_OTP_CODE || '123456';
    
    if (isTestMode && testEmails.includes(cleanEmail)) {
      logger.info(`[Auth] 🧪 TEST MODE: Using test OTP for ${cleanEmail}`);
      
      // Store in database for verification
      await prisma.otpVerification.create({
        data: {
          mobile: cleanEmail, // Reuse mobile field for email
          purpose: 'EMAIL_SIGNUP',
          otpHash: await hashPassword(testOtp),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          attempts: 0,
          maxAttempts: 5,
        }
      });

      logger.info(`[Auth] 🧪 TEST OTP: ${testOtp} for ${cleanEmail}`);

      return sendSuccess(res, {
        message: `TEST MODE: OTP is ${testOtp}`,
        expiresIn: 300,
        _testMode: true,
        _testOtp: testOtp,
      });
    }
    
    // Real email: Send via Resend
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit OTP
    
    // Send email via Resend
    await sendClinicOwnerVerificationOtpEmail(cleanEmail, otp, name);
    
    // Store OTP hash in database
    await prisma.otpVerification.create({
      data: {
        mobile: cleanEmail, // Reuse mobile field for email
        purpose: 'EMAIL_SIGNUP',
        otpHash: await hashPassword(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        maxAttempts: 5,
      }
    });
    
    logger.info(`[Auth] OTP sent to ${cleanEmail} via email`);
    
    return sendSuccess(res, {
      message: 'OTP sent successfully to your email',
      expiresIn: 600,
    });
  } catch (error) {
    logger.error('[Auth] Send registration email OTP error:', error);
    return sendError(res, error.message || 'Failed to send OTP', 500);
  }
};

/**
 * POST /api/auth/register-email-otp/verify
 * Verify email OTP and register user
 */
const verifyRegistrationEmailOtp = async (req, res, next) => {
  try {
    const { email, otp, name, role = 'CLINIC_OWNER' } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.replace(/\D/g, '');
    
    if (cleanOtp.length !== 6) {
      return sendError(res, 'Invalid OTP format', 400);
    }
    
    // Find OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        mobile: cleanEmail, // We stored email in mobile field
        expiresAt: { gte: new Date() },
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return sendError(res, 'OTP expired or not found', 401);
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return sendError(res, 'Maximum OTP attempts exceeded', 401);
    }

    // Verify OTP
    const isValid = await verifyPassword(cleanOtp, otpRecord.otpHash);
    
    if (!isValid) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      return sendError(res, `Invalid OTP. ${remainingAttempts} attempts remaining.`, 401);
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true, verifiedAt: new Date() },
    });

    logger.info(`[Auth] Email OTP verified successfully for ${cleanEmail}`);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: baseUserInclude,
    });

    let isNewUser = false;
    if (!user) {
      // Create new user with CLINIC_OWNER role
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: name,
          role: 'CLINIC_OWNER',
          approvalStatus: 'PENDING',
          isEmailVerified: true,
          authProvider: 'EMAIL_OTP',
          clinicOwnerProfile: { create: { profileCompleted: false } },
        },
        include: baseUserInclude,
      });
      isNewUser = true;
      logger.info(`[Auth] New CLINIC_OWNER registered: ${user.id} (${cleanEmail})`);
    } else {
      // Existing user - update email verification
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          lastLoginAt: new Date(),
          authProvider: 'EMAIL_OTP',
          ...(name && !user.name ? { name } : {}),
        },
        include: baseUserInclude,
      });
      logger.info(`[Auth] ${user.role} login via email OTP: ${user.id} (${cleanEmail})`);
    }

    // Issue JWT tokens
    const tokens = await issueAuthTokens(res, user, req);

    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'CLINIC_OWNER_REGISTERED_EMAIL_OTP' : 'CLINIC_OWNER_LOGIN_EMAIL_OTP',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      metadata: { provider: 'EMAIL_OTP' },
    });

    return sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: { ...toAuthUser(user), isNewUser },
      },
      isNewUser ? 'Account created successfully' : 'Login successful'
    );
  } catch (error) {
    logger.error('[Auth] Verify registration email OTP error:', error);
    next(error);
  }
};
```

**Export at bottom:**
```javascript
module.exports = {
  // ... existing exports
  sendRegistrationEmailOtp,
  verifyRegistrationEmailOtp,
};
```

---

### 2. Backend: Add Routes

**File:** `backend/src/routes/auth.routes.js`

Add new routes:

```javascript
// Email OTP Registration (Clinic Partner)
router.post(
  '/register-email-otp/send',
  otpSendLimiter, // Reuse existing rate limiter
  sendRegistrationEmailOtp
);

router.post(
  '/register-email-otp/verify',
  otpVerifyLimiter, // Reuse existing rate limiter
  verifyRegistrationEmailOtp
);
```

---

### 3. Frontend: Update ClinicAuthModal

**File:** `frontend/src/components/modals/ClinicAuthModal.jsx`

**Changes needed:**

1. **Keep Login view** - Mobile + OTP (no changes)

2. **Update Signup view** - Remove mobile, keep email:

```javascript
{/* SIGNUP VIEW */}
{view === 'signup' && (
  <>
    <h2>Create your clinic partner account</h2>
    
    {/* Full Name */}
    <div className="mb-4">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Full name"
        // ... styling
      />
    </div>

    {/* Email */}
    <div className="mb-4">
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email address"
        // ... styling
      />
    </div>

    {/* REMOVE MOBILE FIELD */}
    
    {/* Terms Checkbox */}
    <div className="mb-6">
      <label>
        <input type="checkbox" checked={formData.agreeTerms} />
        I agree to Terms...
      </label>
    </div>

    {/* Send OTP Button */}
    <button onClick={handleSendEmailOTP}>
      {loading ? 'Sending...' : 'Continue'}
    </button>
  </>
)}
```

3. **Update OTP view** - Show email instead of mobile:

```javascript
{/* OTP VERIFICATION VIEW */}
{view === 'otp' && (
  <>
    <h2>Verify your email</h2>
    <p>
      We've sent a 6-digit OTP to 
      <span style={{fontWeight: 500}}> {formData.email}</span>
    </p>
    
    {/* OTP input fields */}
    {/* ... rest of OTP view */}
  </>
)}
```

4. **Add new handler functions:**

```javascript
const handleSendEmailOTP = async () => {
  if (!validateForm()) return;

  setLoading(true);
  try {
    const response = await axios.post('/auth/register-email-otp/send', {
      email: formData.email,
      name: formData.name,
    });
    
    // Check if test mode
    if (response.data.data._testMode && response.data.data._testOtp) {
      toast.success(`TEST MODE: Your OTP is ${response.data.data._testOtp}`, {
        duration: 10000,
      });
    } else {
      toast.success('OTP sent successfully! Check your email.');
    }
    
    setView('otp');
    setCountdown(30);
  } catch (error) {
    console.error('Send Email OTP error:', error);
    toast.error(error.response?.data?.message || 'Failed to send OTP');
  } finally {
    setLoading(false);
  }
};

const handleVerifyEmailOTP = async () => {
  if (!validateForm()) return;

  const otpValue = formData.otp.join('');
  setLoading(true);
  
  try {
    const response = await axios.post('/auth/register-email-otp/verify', {
      email: formData.email,
      otp: otpValue,
      name: formData.name,
      role: 'CLINIC_OWNER',
    });
    
    if (response.data.success) {
      const { user, accessToken: token } = response.data.data;
      
      storeLogin({ user, token });
      toast.success('Registration successful!');
      onClose();
      
      // Redirect to clinic onboarding
      setTimeout(() => {
        window.location.href = '/clinic/onboarding/step-1';
      }, 500);
    }
  } catch (error) {
    console.error('Verify Email OTP error:', error);
    toast.error(error.response?.data?.message || 'Invalid OTP');
    setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
    otpInputRefs.current[0]?.focus();
  } finally {
    setLoading(false);
  }
};
```

---

### 4. Configuration

**File:** `backend/.env`

Already added:
```env
# Test email addresses
TEST_OTP_EMAILS=test@example.com,demo@example.com,admin@test.com
TEST_OTP_CODE=123456

# Resend configuration (for real emails)
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@pulsemateconnect.in
```

---

## Testing Plan

### Test 1: Test Email
```
Email: test@example.com
Name: Test User
Expected:
- Toast: "TEST MODE: Your OTP is 123456"
- Enter 123456
- Registration successful
- NO real email sent
```

### Test 2: Real Email
```
Email: your-email@gmail.com
Name: Real User
Expected:
- Toast: "OTP sent successfully! Check your email."
- Check email inbox for OTP
- Enter OTP from email
- Registration successful
```

### Test 3: Mobile Login (Should Still Work)
```
Mobile: 9999999999
OTP: 123456
Expected:
- Mobile OTP flow works as before
- No changes to login
```

---

## Summary

**What Changes:**
✅ Registration: Email + Name (no mobile visible)  
✅ Registration OTP: Sent to email  
✅ Test emails: Fixed OTP 123456  
✅ Real emails: Resend service  
✅ Login: Keep mobile OTP (no changes)

**Files to Modify:**
1. `backend/src/controllers/auth.controller.js` - Add email OTP handlers
2. `backend/src/routes/auth.routes.js` - Add email OTP routes
3. `frontend/src/components/modals/ClinicAuthModal.jsx` - Update signup form
4. `backend/.env` - Already updated

**Next Steps:**
1. Implement backend handlers
2. Add routes
3. Update frontend form
4. Test with test email
5. Configure Resend API key for real emails
6. Test with real email

---

**Status:** Plan complete, ready to implement.
