# 🏥 CLINIC PARTNER LANDING PAGE - SPECIFICATION

**Inspired by**: Zomato Partner Onboarding Flow  
**Purpose**: Marketing page → Auth Modal → Onboarding Form  
**Branch**: `clinic-side-flow`

---

## 🎯 COMPLETE USER FLOW

```
Step 1: Landing Page
/clinic-partner
↓
User clicks "Apply as a Clinic"
↓
Step 2: Auth Modal (Pop-up)
Two tabs: Login | Register
- Login: Mobile/Email + OTP
- Register: Full Name + Email + Mobile + OTP + Auto role CLINIC_OWNER
↓
After successful auth
↓
Step 3: Auto-redirect to Onboarding
/clinic/onboarding/step-1
(4-step progressive form we already built)
```

---

## 📄 PAGE 1: CLINIC PARTNER LANDING PAGE

**Route**: `/clinic-partner`  
**Purpose**: Marketing/Information page to attract clinic partners

### Section 1: Hero
```
HERO SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Partner with PulseMate Connect
Grow your clinic. Connect with more patients.
Simplify clinic management.

[Button: Apply as a Clinic]
[Link: Already a Partner? Login]
```

**Design**:
- Full-width hero with gradient background (blue to green)
- Large heading (48px)
- Subtitle (20px)
- Primary CTA button (blue, large)
- Secondary text link

---

### Section 2: Benefits

```
WHY PARTNER WITH PULSEMATE CONNECT?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Card 1]
👥 Reach More Patients
Help patients discover your clinic
and available doctors.

[Card 2]
📅 Simplify Appointments
Manage bookings and appointments
from one platform.

[Card 3]
🩺 Manage Your Clinic
Manage doctors, schedules and
live patient queues.

[Card 4]
📊 Grow With Insights
Understand appointments, patient
activity and clinic operations.
```

**Design**:
- 4 cards in a grid (2x2 on desktop, 1 column on mobile)
- Icon at top (use emoji or react-icons)
- Card title (bold)
- Card description (2-3 lines)
- White cards with shadow on light background

---

### Section 3: How It Works

```
HOW IT WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

01 → Apply as a Clinic
02 → Complete Clinic Profile
03 → Submit Required Documents
04 → Get Verified & Go Live
```

**Design**:
- 4 numbered steps horizontal (stack on mobile)
- Large numbers in circles
- Arrow between steps
- Step title below number
- Clean, minimal design

---

### Section 4: What You'll Need

```
WHAT YOU'LL NEED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keep these details ready for a smooth sign-up:

✓ Clinic basic information
✓ Owner / administrator details
✓ Clinic contact number
✓ Clinic address and location
✓ Clinic services and operating hours
✓ Required clinic documents
```

**Design**:
- Checkmark list
- Light blue background box
- Clear, readable text

---

### Section 5: Who Is This For?

```
WHO IS PULSEMATE FOR?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Icon] Physiotherapy Clinics
[Icon] Orthopedic Clinics
[Icon] Multispecialty Clinics
[Icon] Rehabilitation Centres
[Icon] Other Healthcare Clinics
```

**Design**:
- 5 cards/badges in a row (wrap on mobile)
- Icon + text
- Clean, minimal

---

### Section 6: Trust/Platform Section

```
BUILT FOR MODERN CLINIC OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

One platform for appointments, doctors,
patient queues and clinic management.

[Maybe add a screenshot of dashboard - future]
```

**Design**:
- Centered text
- Clean, professional
- Later can add clinic success stories

---

### Section 7: FAQ

```
FREQUENTLY ASKED QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▼ What is PulseMate Connect?
   [Expandable answer]

▼ Who can register their clinic?
   [Expandable answer]

▼ How long does verification take?
   [Expandable answer]

▼ What documents are required?
   [Expandable answer]

▼ Is there a fee to register?
   [Expandable answer]

▼ How can I get support?
   [Expandable answer]
```

**Design**:
- Accordion-style FAQ
- Click to expand/collapse
- Clean borders between items

---

### Section 8: Final CTA

```
READY TO BRING YOUR CLINIC TO PULSEMATE?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Button: Apply as a Clinic →]

Already registered? [Login]
```

**Design**:
- Centered
- Large CTA button
- Light background section

---

## 🔐 PAGE 2: AUTH MODAL (Pop-up)

**Triggered by**: Clicking "Apply as a Clinic" on landing page  
**Component**: `ClinicAuthModal.jsx`

### Modal Structure

```
┌─────────────────────────────────────┐
│  [X] Close                          │
│                                     │
│  PulseMate Connect                  │
│  Partner with us                    │
│                                     │
│  [ Login ] [ Register ]  ← Tabs    │
│  ─────────  ─────────              │
│                                     │
│  [Tab Content]                      │
│                                     │
│  [Action Button]                    │
│                                     │
│  [Link to other tab]                │
└─────────────────────────────────────┘
```

---

### Tab 1: Login

```
LOGIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Toggle: Mobile | Email]

Mobile Login:
┌─────────────────────────┐
│ Mobile Number           │
│ +91 [__________]        │
└─────────────────────────┘

[Button: Send OTP]

After OTP sent:
┌─────────────────────────┐
│ Enter OTP               │
│ [__] [__] [__] [__]     │
└─────────────────────────┘

[Button: Verify & Login]

Resend OTP in 30s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email Login:
┌─────────────────────────┐
│ Email Address           │
│ [__________________]    │
└─────────────────────────┘

[Button: Send OTP]

After OTP sent:
┌─────────────────────────┐
│ Enter OTP               │
│ [__] [__] [__] [__]     │
└─────────────────────────┘

[Button: Verify & Login]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Don't have an account? [Register]
```

---

### Tab 2: Register

```
REGISTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────┐
│ Full Name               │
│ [__________________]    │
└─────────────────────────┘

┌─────────────────────────┐
│ Email Address           │
│ [__________________]    │
└─────────────────────────┘

┌─────────────────────────┐
│ Mobile Number           │
│ +91 [__________]        │
└─────────────────────────┘

[Button: Send OTP]

After OTP sent:
┌─────────────────────────┐
│ Enter OTP               │
│ [__] [__] [__] [__]     │
└─────────────────────────┘

[Button: Verify & Register]

Resend OTP in 30s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Already have an account? [Login]
```

---

## 🎨 DESIGN SYSTEM

### Colors
```
Primary Blue: #2563EB
Primary Hover: #1D4ED8
Success Green: #16A34A
Background: #F8FAFC
Card Background: #FFFFFF
Border: #E2E8F0
Text Primary: #111827
Text Secondary: #6B7280
```

### Typography
```
Hero Title: 48px, bold
Section Title: 36px, bold
Card Title: 20px, semi-bold
Body: 16px, regular
Button: 16px, medium
```

### Spacing
```
Section Padding: 80px (vertical)
Container Max Width: 1200px
Card Padding: 32px
Button Padding: 16px 32px
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### Files to Create

1. **Landing Page**:
   - `frontend/src/pages/public/ClinicPartnerPage.jsx`

2. **Auth Modal**:
   - `frontend/src/components/modals/ClinicAuthModal.jsx`

3. **Backend** (reuse existing):
   - POST `/api/auth/send-otp`
   - POST `/api/auth/verify-otp`
   - POST `/api/auth/register` (modify to support CLINIC_OWNER)

### State Management

```javascript
// Landing page state
const [showAuthModal, setShowAuthModal] = useState(false);
const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

// Modal state
const [step, setStep] = useState('input'); // 'input' | 'otp'
const [loginMethod, setLoginMethod] = useState('mobile'); // 'mobile' | 'email'
const [formData, setFormData] = useState({
  name: '',
  email: '',
  mobile: '',
  otp: ''
});
```

### Auth Flow Logic

```javascript
// Register flow
1. User fills: name, email, mobile
2. Click "Send OTP"
3. Backend: POST /api/auth/send-otp { mobile, purpose: 'REGISTER' }
4. User enters OTP
5. Click "Verify & Register"
6. Backend: POST /api/auth/register { name, email, mobile, otp, role: 'CLINIC_OWNER' }
7. Frontend: Store JWT, redirect to /clinic/onboarding/step-1

// Login flow
1. User enters mobile or email
2. Click "Send OTP"
3. Backend: POST /api/auth/send-otp { mobile/email, purpose: 'LOGIN' }
4. User enters OTP
5. Click "Verify & Login"
6. Backend: POST /api/auth/verify-otp { mobile/email, otp }
7. Frontend: Store JWT, redirect to /clinic/onboarding/step-1
```

---

## 📱 RESPONSIVE DESIGN

### Desktop (≥1024px)
- Hero: Full width, centered content
- Benefits: 2x2 grid
- How it works: Horizontal steps
- Modal: 500px width, centered

### Tablet (768-1023px)
- Benefits: 2x2 grid (slightly narrower)
- How it works: Horizontal with smaller spacing

### Mobile (<768px)
- Benefits: 1 column
- How it works: Vertical stack
- Modal: Full width with padding

---

## ✅ ACCEPTANCE CRITERIA

### Landing Page
- [ ] Hero section with CTA button
- [ ] 4 benefit cards
- [ ] 4-step "How it works"
- [ ] "What you'll need" checklist
- [ ] 5 clinic type badges
- [ ] Accordion FAQ (6 questions)
- [ ] Final CTA section
- [ ] Responsive on all devices
- [ ] "Apply as a Clinic" opens modal
- [ ] "Login" link opens modal in login mode

### Auth Modal
- [ ] Two tabs: Login | Register
- [ ] Login: Mobile/Email toggle + OTP
- [ ] Register: Name + Email + Mobile + OTP
- [ ] OTP countdown timer (30s)
- [ ] Resend OTP functionality
- [ ] Form validation (all fields)
- [ ] Error messages display
- [ ] Success toast on completion
- [ ] Auto-close on successful auth
- [ ] Auto-redirect to /clinic/onboarding/step-1
- [ ] Close button works
- [ ] Click outside to close (optional)

### Backend Integration
- [ ] Reuse existing OTP endpoints
- [ ] Register sets role as CLINIC_OWNER
- [ ] JWT token generated and returned
- [ ] Frontend stores token in authStore
- [ ] Protected route allows access after auth

---

## 🚀 DEPLOYMENT

### Route Changes in App.jsx
```javascript
// Add new route
<Route path="/clinic-partner" element={<ClinicPartnerPage />} />

// Keep onboarding route (already exists)
<Route path="/clinic/onboarding/*" element={
  <ProtectedRoute requiredRole="CLINIC_OWNER">
    <ClinicOnboarding />
  </ProtectedRoute>
} />

// Remove old route
// <Route path="/portal/apply-clinic" element={...} /> ← DELETE
```

---

## 📊 METRICS TO TRACK (Future)

- Landing page visits
- "Apply as a Clinic" click rate
- Registration completion rate
- Time to complete registration
- Drop-off points in flow

---

**Status**: Specification Complete  
**Next**: Build implementation  
**Estimated Time**: 3-4 hours

