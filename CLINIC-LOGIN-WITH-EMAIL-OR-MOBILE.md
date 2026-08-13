# Clinic Login with Email or Mobile OTP

## Current State
- ✅ Login: Mobile OTP only
- ✅ Signup: Email OTP only

## Requested Feature
Add option for clinic owners to login using EITHER:
- Email + OTP
- Mobile + OTP

---

## Implementation Plan

### UI Changes

#### Step 1: Login Screen - Add Choice
```
┌────────────────────────────────────┐
│ Login                              │
│                                    │
│ Login with:                        │
│ ○ Mobile Number                    │
│ ○ Email Address                    │
│                                    │
│ [Input Field - changes based on    │
│  selection]                        │
│                                    │
│ [Send One Time Password]           │
│                                    │
│ ────────────────────────────────   │
│ New? Create account                │
└────────────────────────────────────┘
```

### Backend Requirements

#### Existing Endpoints:
1. ✅ `/auth/send-otp` - Send mobile OTP
2. ✅ `/auth/verify-otp` - Verify mobile OTP and login
3. ✅ `/auth/register-email-otp/send` - Send email OTP (signup)
4. ✅ `/auth/register-email-otp/verify` - Verify email OTP (signup/login)

#### What We Need:
Create a **unified login endpoint** that handles BOTH email and mobile:

**Option A: Use existing endpoints**
- For mobile: Use `/auth/send-otp` and `/auth/verify-otp`
- For email: Use `/auth/register-email-otp/send` and `/auth/register-email-otp/verify`

**Option B: Create new unified endpoints** (Recommended)
- `POST /auth/clinic-owner/login/send-otp` - Send OTP to email OR mobile
- `POST /auth/clinic-owner/login/verify-otp` - Verify OTP and login

---

## Detailed UI Flow

### Login Flow - Mobile
```
1. User clicks "Login"
2. Modal opens with radio buttons
3. User selects "Mobile Number"
4. Shows: [🇮🇳 +91] [__________]
5. User enters: 9999999999
6. Clicks "Send One Time Password"
7. Modal shows OTP input screen
8. User enters 6-digit OTP
9. Clicks "Verify & Login"
10. → Redirects to dashboard
```

### Login Flow - Email
```
1. User clicks "Login"
2. Modal opens with radio buttons
3. User selects "Email Address"
4. Shows: [____________________@____]
5. User enters: clinic@example.com
6. Clicks "Send One Time Password"
7. Modal shows OTP input screen
8. User enters 6-digit OTP
9. Clicks "Verify & Login"
10. → Redirects to dashboard
```

---

## Code Changes Required

### 1. Frontend - ClinicAuthModal.jsx

#### Add State:
```javascript
const [loginMethod, setLoginMethod] = useState('mobile'); // 'mobile' or 'email'
```

#### Add UI for Login Method Selection:
```javascript
{view === 'login' && (
  <>
    <h2>Login</h2>
    
    {/* Login Method Selection */}
    <div className="mb-6">
      <p className="mb-3 text-sm font-medium text-gray-700">Login with:</p>
      <div className="flex gap-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="loginMethod"
            value="mobile"
            checked={loginMethod === 'mobile'}
            onChange={(e) => setLoginMethod(e.target.value)}
            className="mr-2"
          />
          <span>Mobile Number</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="loginMethod"
            value="email"
            checked={loginMethod === 'email'}
            onChange={(e) => setLoginMethod(e.target.value)}
            className="mr-2"
          />
          <span>Email Address</span>
        </label>
      </div>
    </div>
    
    {/* Conditional Input */}
    {loginMethod === 'mobile' ? (
      <div className="mb-6">
        {/* Mobile input - existing code */}
      </div>
    ) : (
      <div className="mb-6">
        {/* Email input - new */}
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Email address"
          className="..."
        />
      </div>
    )}
    
    <button onClick={handleSendLoginOTP}>
      Send One Time Password
    </button>
  </>
)}
```

#### Add Unified Send OTP Function:
```javascript
const handleSendLoginOTP = async () => {
  setLoading(true);
  try {
    if (loginMethod === 'mobile') {
      await handleSendMobileOTP();
    } else {
      await handleSendEmailLoginOTP();
    }
  } finally {
    setLoading(false);
  }
};

const handleSendEmailLoginOTP = async () => {
  // Call email OTP endpoint for login
  const response = await axios.post('/auth/register-email-otp/send', {
    email: formData.email,
    name: '', // Not needed for login
  });
  
  if (response.data.success) {
    toast.success('OTP sent to your email');
    setView('otp');
    setCountdown(60);
  }
};
```

#### Update Verify Function:
```javascript
const handleVerifyLoginOTP = async () => {
  setLoading(true);
  try {
    if (loginMethod === 'mobile') {
      await handleVerifyMobileOTP();
    } else {
      await handleVerifyEmailLoginOTP();
    }
  } finally {
    setLoading(false);
  }
};

const handleVerifyEmailLoginOTP = async () => {
  const otpString = formData.otp.join('');
  
  const response = await axios.post('/auth/register-email-otp/verify', {
    email: formData.email,
    otp: otpString,
  });
  
  if (response.data.success) {
    const { accessToken, user } = response.data.data;
    storeLogin(user, accessToken);
    toast.success('Login successful!');
    navigate('/clinic/dashboard');
    onClose();
  }
};
```

### 2. Backend - auth.controller.js

The existing `/auth/register-email-otp/verify` endpoint already handles login if user exists! We just need to make sure it works correctly.

Current code already does:
```javascript
// If user exists with email, log them in
if (existingUser) {
  // Issue tokens and return user
  return sendSuccess(res, { accessToken, user }, 'Login successful');
}
```

✅ **No backend changes needed!** The email OTP endpoints already support login.

---

## Testing Checklist

### Test Mobile Login
- [ ] Select "Mobile Number"
- [ ] Enter valid mobile (9999999999)
- [ ] Click "Send OTP"
- [ ] OTP received (check console or SMS)
- [ ] Enter OTP
- [ ] Click "Verify & Login"
- [ ] Redirected to dashboard
- [ ] User logged in

### Test Email Login
- [ ] Select "Email Address"
- [ ] Enter registered email (test@example.com)
- [ ] Click "Send OTP"
- [ ] OTP received (check email or console)
- [ ] Enter OTP
- [ ] Click "Verify & Login"
- [ ] Redirected to dashboard
- [ ] User logged in

### Test Email Login - New Email
- [ ] Select "Email Address"
- [ ] Enter NEW email (newemail@test.com)
- [ ] Click "Send OTP"
- [ ] Should get error: "No account found with this email"
- [ ] OR Should show "Create account first"

### Edge Cases
- [ ] Switch between Mobile/Email and back
- [ ] Invalid mobile number
- [ ] Invalid email format
- [ ] Wrong OTP
- [ ] Expired OTP
- [ ] Account with PENDING status

---

## UI/UX Considerations

### Radio Button Design
```css
.login-method-radio {
  /* Modern radio button style */
  accent-color: #2F73E8;
  width: 18px;
  height: 18px;
  cursor: pointer;
}
```

### Input Transitions
When switching between mobile and email:
- Smooth transition
- Clear placeholder text
- Proper keyboard types (tel vs email)

### Error Messages
```javascript
const errorMessages = {
  mobile: {
    invalid: 'Please enter a valid 10-digit mobile number',
    notFound: 'No account found with this mobile number',
    pending: 'Your application is pending approval',
  },
  email: {
    invalid: 'Please enter a valid email address',
    notFound: 'No account found with this email',
    pending: 'Your application is pending approval',
  },
};
```

---

## Summary

### Frontend Changes:
1. Add `loginMethod` state ('mobile' | 'email')
2. Add radio buttons for method selection
3. Conditional input rendering
4. Unified `handleSendLoginOTP()` function
5. Unified `handleVerifyLoginOTP()` function

### Backend Changes:
✅ **NONE REQUIRED!** Existing endpoints already support login.

### Next Steps:
1. Review this plan
2. Confirm UI/UX approach
3. Implement frontend changes
4. Test thoroughly

---

**Ready to implement?** Let me know if you want me to proceed with these changes!
