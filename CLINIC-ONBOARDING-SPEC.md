# 🏥 CLINIC ONBOARDING FLOW — TECHNICAL SPECIFICATION

**Branch**: `clinic-side-flow`  
**Status**: In Development  
**Designer**: Senior SaaS Product Designer + Full-Stack Developer

---

## 🎯 PROJECT GOAL

Build a **premium healthcare SaaS clinic partner onboarding experience** for PulseMate Connect, inspired by Zomato's UX structure but with original healthcare branding and professional design.

---

## 📋 ONBOARDING STEPS OVERVIEW

### Step 1: Clinic Information ✅ (CURRENT)
- Clinic name, type, display name
- Owner/administrator details
- Primary contact information
- Clinic location (interactive map)
- Address details

### Step 2: Services & Operations (TODO)
- Services offered
- Clinic timings & sessions
- Doctor associations
- Operational details

### Step 3: Clinic Documents (TODO)
- License documents
- GST certificate
- Registration certificates
- Document verification

### Step 4: Partner Agreement (TODO)
- Terms & conditions
- Partner agreement review
- Final submission

---

## 🏗️ ARCHITECTURE DECISIONS

### Frontend Stack
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State**: Zustand (existing pattern)
- **Forms**: React Hook Form + Yup validation
- **Maps**: Google Maps API (if configured) or Leaflet fallback
- **HTTP**: Axios (existing pattern)

### Backend Integration
- **Existing Model**: `Clinic` table (reuse)
- **Existing Profile**: `ClinicOwnerProfile` table (reuse)
- **Auth**: Existing auth middleware
- **Storage**: Cloudinary for image uploads

### Database Fields Used

From `Clinic` model:
```prisma
name                    // Clinic name
clinicType              // Type dropdown
ownerId                 // Authenticated user
phone                   // Primary contact
address                 // Full address
city, state, pincode    // Location details
latitude, longitude     // Map coordinates
landmark                // Optional landmark
googleMapsLocation      // Google Maps link
clinicLogoUrl           // Logo upload (future)
approvalStatus          // PENDING by default
isActive                // true by default
```

From `ClinicOwnerProfile` model:
```prisma
userId                  // Foreign key to User
businessName            // Optional
designation             // Optional
alternatePhone          // Optional alternate
profileCompleted        // Step tracking
```

From `User` model:
```prisma
name                    // Owner name
email                   // Owner email
mobile                  // Owner mobile (verified)
isPhoneVerified         // OTP verification
```

---

## 🎨 DESIGN SYSTEM

### Color Palette (Healthcare SaaS)
```css
--primary-blue: #2563EB      /* Primary actions */
--primary-hover: #1D4ED8     /* Button hover */
--success-green: #16A34A     /* Success states */
--success-light: #DCFCE7     /* Success backgrounds */
--error-red: #EF4444         /* Errors */
--warning-yellow: #F59E0B    /* Warnings */
--neutral-50: #F8FAFC        /* Page background */
--neutral-100: #F1F5F9       /* Card backgrounds */
--neutral-200: #E2E8F0       /* Borders */
--neutral-600: #475569       /* Secondary text */
--neutral-900: #0F172A       /* Primary text */
--white: #FFFFFF             /* Cards */
```

### Typography
```css
Font Family: 'Inter', 'Segoe UI', system-ui, sans-serif
Headings: font-weight: 600-700
Body: font-weight: 400-500
Line Height: 1.5 for body, 1.2 for headings
```

### Spacing Scale
```css
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### Border Radius
```css
Card: 16px
Input: 12px
Button: 10px
Modal: 20px
```

---

## 📐 LAYOUT STRUCTURE

### Desktop (>= 1024px)
```
┌─────────────────────────────────────────────────────────┐
│  Header (if needed)                                     │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Sidebar     │  Main Content                           │
│  (320px)     │  (Flexible)                             │
│              │                                          │
│  Progress    │  Form Sections                          │
│  Steps       │  - Cards with fields                    │
│              │  - Map integration                      │
│              │  - Validation                           │
│              │                                          │
│  Resources   │                                          │
│              │                                          │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│  Bottom Action Bar (Save & Exit | Next →)               │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
- Narrower sidebar (240px)
- Adjusted content padding

### Mobile (< 768px)
- Sidebar collapses to compact header
- "Step 1 of 4 • Clinic Information"
- Full-width form content
- Sticky bottom action bar

---

## 🧩 COMPONENT BREAKDOWN

### 1. `ClinicOnboardingLayout.jsx`
- Two-column layout wrapper
- Left sidebar + right content
- Responsive breakpoints
- Sticky positioning

### 2. `OnboardingSidebar.jsx`
- Progress steps list
- Current step highlighting
- Completed step checkmarks
- Help section at bottom

### 3. `OnboardingStep1.jsx` (Main Component)
- Form orchestration
- Section organization
- Validation coordination
- API submission

### 4. `ClinicDetailsCard.jsx`
- Clinic name, type, display name
- Inline validation
- Field grouping

### 5. `OwnerDetailsCard.jsx`
- Full name, email, mobile
- OTP verification flow
- Pre-fill from auth user

### 6. `PrimaryContactCard.jsx`
- Checkbox for "Same as owner"
- Conditional phone field
- Smart defaults

### 7. `ClinicLocationCard.jsx`
- Interactive map component
- Location search
- Current location button
- Marker dragging
- Reverse geocoding

### 8. `AddressDetailsCard.jsx`
- Address line 1, 2
- Landmark (optional)
- City, state, pincode
- Auto-fill from map

### 9. `BottomActionBar.jsx`
- Save & Exit (left)
- Next → (right)
- Validation state
- Loading states

### 10. Reusable Components
- `FormInput.jsx` - Text input with validation
- `FormSelect.jsx` - Dropdown with search
- `FormCheckbox.jsx` - Checkbox with label
- `ValidationError.jsx` - Error display
- `LoadingSpinner.jsx` - Loading states

---

## 📝 VALIDATION RULES

### Clinic Name
```javascript
{
  required: "Clinic name is required",
  minLength: { value: 2, message: "Minimum 2 characters" },
  maxLength: { value: 100, message: "Maximum 100 characters" }
}
```

### Clinic Type
```javascript
{
  required: "Please select clinic type"
}
// If "Other" selected:
{
  required: "Please specify clinic type",
  maxLength: { value: 50, message: "Maximum 50 characters" }
}
```

### Owner Name
```javascript
{
  required: "Owner name is required",
  minLength: { value: 2, message: "Minimum 2 characters" },
  pattern: { value: /^[a-zA-Z\s]+$/, message: "Only letters allowed" }
}
```

### Email
```javascript
{
  required: "Email is required",
  pattern: { 
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: "Invalid email format"
  }
}
```

### Mobile
```javascript
{
  required: "Mobile number is required",
  pattern: { 
    value: /^[6-9]\d{9}$/,
    message: "Invalid Indian mobile number"
  }
}
```

### Location
```javascript
{
  required: "Please select clinic location on map",
  latitude: { required: true },
  longitude: { required: true }
}
```

### Address Line 1
```javascript
{
  required: "Address line 1 is required",
  minLength: { value: 5, message: "Minimum 5 characters" }
}
```

### Address Line 2
```javascript
{
  required: "Area/locality is required",
  minLength: { value: 3, message: "Minimum 3 characters" }
}
```

### City
```javascript
{
  required: "City is required",
  minLength: { value: 2, message: "Minimum 2 characters" }
}
```

### State
```javascript
{
  required: "State is required"
}
```

### Pincode
```javascript
{
  required: "Pincode is required",
  pattern: { 
    value: /^\d{6}$/,
    message: "Must be 6 digits"
  }
}
```

---

## 🔌 API ENDPOINTS

### 1. Save Onboarding Progress
```
POST /api/clinic/onboarding/step1
Authorization: Bearer {jwt}

Request Body:
{
  clinicName: string,
  clinicType: string,
  clinicTypeOther?: string,
  displayName?: string,
  ownerName: string,
  ownerEmail: string,
  ownerMobile: string,
  ownerMobileVerified: boolean,
  primaryContactPhone: string,
  sameAsOwner: boolean,
  latitude: number,
  longitude: number,
  googleMapsLocation?: string,
  addressLine1: string,
  addressLine2: string,
  landmark?: string,
  city: string,
  state: string,
  pincode: string,
  country: "India"
}

Response (200):
{
  success: true,
  data: {
    clinicId: string,
    onboardingStep: 1,
    message: "Step 1 saved successfully"
  }
}
```

### 2. Get Onboarding Progress
```
GET /api/clinic/onboarding/progress
Authorization: Bearer {jwt}

Response (200):
{
  success: true,
  data: {
    currentStep: number,
    completedSteps: number[],
    clinicData: { /* saved fields */ },
    profileCompleted: boolean
  }
}
```

### 3. Send Mobile OTP
```
POST /api/auth/send-otp
Request Body:
{
  mobile: string,
  purpose: "VERIFY_MOBILE"
}

Response (200):
{
  success: true,
  message: "OTP sent successfully"
}
```

### 4. Verify Mobile OTP
```
POST /api/auth/verify-otp
Request Body:
{
  mobile: string,
  otp: string,
  purpose: "VERIFY_MOBILE"
}

Response (200):
{
  success: true,
  message: "Mobile verified successfully"
}
```

### 5. Reverse Geocode
```
GET /api/location/reverse-geocode?lat={lat}&lng={lng}
Authorization: Bearer {jwt}

Response (200):
{
  success: true,
  data: {
    address: string,
    city: string,
    state: string,
    pincode: string,
    country: string
  }
}
```

---

## 💾 LOCAL STATE MANAGEMENT

### Form State (React Hook Form)
```javascript
const defaultValues = {
  clinicName: '',
  clinicType: '',
  clinicTypeOther: '',
  displayName: '',
  ownerName: '',
  ownerEmail: '',
  ownerMobile: '',
  mobileVerified: false,
  sameAsOwner: true,
  primaryContactPhone: '',
  latitude: null,
  longitude: null,
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India'
};
```

### Auto-save Strategy
```javascript
// Debounced auto-save every 5 seconds
const [lastSaved, setLastSaved] = useState(null);
const [isSaving, setIsSaving] = useState(false);

// Save to localStorage on every change (backup)
useEffect(() => {
  const debouncedSave = debounce(() => {
    localStorage.setItem('clinic_onboarding_step1', JSON.stringify(formData));
  }, 1000);
  
  debouncedSave();
}, [formData]);

// Restore from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem('clinic_onboarding_step1');
  if (saved) {
    const data = JSON.parse(saved);
    reset(data);
  }
}, []);
```

---

## 🗺️ MAP INTEGRATION

### Option 1: Google Maps (Preferred)
```javascript
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const center = { lat: 28.6139, lng: 77.2090 }; // Default: New Delhi

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false
};
```

### Option 2: Leaflet (Fallback)
```javascript
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

<MapContainer
  center={[28.6139, 77.2090]}
  zoom={13}
  style={{ height: '400px', width: '100%' }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='© OpenStreetMap'
  />
  <Marker position={markerPosition} draggable={true} />
</MapContainer>
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Setup & Layout ✅
- [ ] Create component directory structure
- [ ] Setup Tailwind config with custom colors
- [ ] Create layout components
- [ ] Build responsive sidebar
- [ ] Test responsive breakpoints

### Phase 2: Form Components
- [ ] Build reusable form inputs
- [ ] Setup React Hook Form
- [ ] Add Yup validation schemas
- [ ] Create section cards

### Phase 3: Clinic Details Section
- [ ] Clinic name input
- [ ] Clinic type dropdown
- [ ] Display name (optional)
- [ ] Validation integration

### Phase 4: Owner Details Section
- [ ] Pre-fill from auth user
- [ ] Email input
- [ ] Mobile input with OTP
- [ ] OTP modal component
- [ ] Verification UI states

### Phase 5: Primary Contact Section
- [ ] "Same as owner" checkbox
- [ ] Conditional phone field
- [ ] Auto-fill logic

### Phase 6: Map Integration
- [ ] Google Maps or Leaflet setup
- [ ] Location search
- [ ] Current location button
- [ ] Draggable marker
- [ ] Reverse geocoding API
- [ ] Location confirmation card

### Phase 7: Address Section
- [ ] Address line 1 & 2
- [ ] Landmark (optional)
- [ ] City, state dropdown
- [ ] Pincode input
- [ ] Auto-fill from geocoding

### Phase 8: Bottom Actions
- [ ] Save & Exit button
- [ ] Next button with validation
- [ ] Loading states
- [ ] Error handling

### Phase 9: Backend Integration
- [ ] Create onboarding controller
- [ ] Save progress endpoint
- [ ] Get progress endpoint
- [ ] OTP endpoints integration
- [ ] Geocoding endpoint

### Phase 10: Polish & Testing
- [ ] Auto-save implementation
- [ ] localStorage backup
- [ ] Resume onboarding flow
- [ ] Mobile responsive testing
- [ ] Browser compatibility
- [ ] API error handling
- [ ] Form validation UX
- [ ] Loading states
- [ ] Success states

---

## 📂 FILE STRUCTURE

```
frontend/src/
├── pages/
│   └── clinic/
│       └── onboarding/
│           ├── ClinicOnboarding.jsx          (Main page)
│           ├── steps/
│           │   ├── Step1ClinicInfo.jsx       (Step 1 - Current)
│           │   ├── Step2Services.jsx         (Step 2 - Future)
│           │   ├── Step3Documents.jsx        (Step 3 - Future)
│           │   └── Step4Agreement.jsx        (Step 4 - Future)
│           └── components/
│               ├── OnboardingLayout.jsx
│               ├── OnboardingSidebar.jsx
│               ├── BottomActionBar.jsx
│               ├── sections/
│               │   ├── ClinicDetailsCard.jsx
│               │   ├── OwnerDetailsCard.jsx
│               │   ├── PrimaryContactCard.jsx
│               │   ├── ClinicLocationCard.jsx
│               │   └── AddressDetailsCard.jsx
│               └── shared/
│                   ├── FormInput.jsx
│                   ├── FormSelect.jsx
│                   ├── FormCheckbox.jsx
│                   ├── ValidationError.jsx
│                   ├── OTPModal.jsx
│                   └── MapPicker.jsx
├── api/
│   └── clinic/
│       ├── onboarding.js
│       └── location.js
├── hooks/
│   ├── useClinicOnboarding.js
│   └── useMapLocation.js
└── utils/
    ├── validation/
    │   └── clinicOnboardingSchema.js
    └── constants/
        └── clinicTypes.js

backend/src/
├── controllers/
│   └── clinic/
│       └── onboarding.controller.js
├── routes/
│   └── clinic/
│       └── onboarding.routes.js
├── services/
│   └── geocoding.service.js
└── middleware/
    └── clinicAuth.middleware.js
```

---

## 🎯 SUCCESS CRITERIA

### Functional
- [x] All required fields validated
- [x] OTP verification working
- [x] Map location selection functional
- [x] Address auto-fill from geocoding
- [x] Form data persists on refresh
- [x] Resume onboarding works
- [x] Mobile responsive
- [x] Save & Exit works
- [x] Next navigation works
- [x] API integration complete

### UX
- [x] Professional healthcare design
- [x] Clear progress indication
- [x] Helpful validation messages
- [x] Smooth transitions
- [x] Loading states clear
- [x] Error states user-friendly
- [x] No data loss on errors
- [x] Auto-save feedback

### Technical
- [x] No duplicate API calls
- [x] Proper error handling
- [x] Optimistic UI updates
- [x] Debounced auto-save
- [x] localStorage backup
- [x] Clean code structure
- [x] Reusable components
- [x] TypeScript-ready (if needed)

---

## 📝 NOTES

1. **Do NOT copy Zomato branding** - Use original PulseMate design
2. **Reuse existing architecture** - Don't duplicate tables
3. **Professional healthcare tone** - Not casual/playful
4. **Desktop-first approach** - Mobile responsive but desktop priority
5. **Progressive onboarding** - Save incomplete progress
6. **Clear error messages** - No technical jargon to users
7. **Prevent data loss** - Auto-save + localStorage backup
8. **OTP verification required** - Cannot proceed without verified mobile
9. **Map is mandatory** - Exact location required for patient discovery
10. **Step 1 only for now** - Other steps will be built later

---

**Ready to implement!** 🚀

Next: Start building the component structure and layout.
