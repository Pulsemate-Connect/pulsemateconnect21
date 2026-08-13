# 🎨 Visual Layout Guide - Onboarding Redesign

**Detailed ASCII mockups of the new clinic partner onboarding interface**

---

## 📐 Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ┌──┐ PulseMate Connect                          Need help? Contact PulseMate Support ℹ│ ← Header (64px)
└─────────────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────────────────────────────────────────────────┐
│  Sidebar (384px)     │  Content Area (Flexible)                                         │
│                      │                                                                  │
│ ┌──────────────────┐ │  ┌──────────────────────────────────────────────────────────┐  │
│ │ Complete your    │ │  │  Clinic Information                                  (40px)│  │
│ │ clinic           │ │  │  Tell us about your clinic so we can create your...  (18px)│  │
│ │ registration     │ │  └──────────────────────────────────────────────────────────┘  │
│ │                  │ │                                                                  │
│ │ Set up your      │ │  ┌──────────────────────────────────────────────────────────┐  │
│ │ clinic on        │ │  │  Clinic details                                          │  │
│ │ PulseMate        │ │  │  Patients will see these details on PulseMate Connect.  │  │
│ └──────────────────┘ │  │  ─────────────────────────────────────────────────────  │  │
│                      │  │                                                          │  │
│ ┌──────────────────┐ │  │  Clinic Name *                                           │  │
│ │ ◉  Step 1        │ │  │  ┌────────────────────────────────────────────────────┐│  │
│ │ │  Clinic Info   │ │  │  │ Enter clinic name                                  ││  │
│ │ │  Clinic name,  │ │  │  └────────────────────────────────────────────────────┘│  │
│ │ │  owner and...  │ │  │  This is the official name of your clinic               │  │
│ │ │                │ │  │                                                          │  │
│ │ │  Continue →    │ │  │  Clinic Type *                                           │  │
│ │ │                │ │  │  ┌────────────────────────────────────────────────────┐│  │
│ ├──────────────────┤ │  │  │ Select clinic type                          ▼      ││  │
│ │ ○  Step 2        │ │  │  └────────────────────────────────────────────────────┘│  │
│ │    Services &... │ │  │  Choose the category that best describes your clinic    │  │
│ │    Services,... │ │  │                                                          │  │
│ ├──────────────────┤ │  │  Clinic Display Name                                    │  │
│ │ ○  Step 3        │ │  │  ┌────────────────────────────────────────────────────┐│  │
│ │    Clinic Docs   │ │  │  │ Name shown to patients (optional)                  ││  │
│ │    Verify your...│ │  │  └────────────────────────────────────────────────────┘│  │
│ ├──────────────────┤ │  │  If different from official name, e.g., 'ABC - Branch' │  │
│ │ ○  Step 4        │ │  └──────────────────────────────────────────────────────────┘  │
│ │    Partner Agr.. │ │                                                                  │
│ │    Review and... │ │  ┌──────────────────────────────────────────────────────────┐  │
│ └──────────────────┘ │  │  Owner / administrator details                           │  │
│                      │  │  Your registration details have been pre-filled. Please  │  │
│ ┌──────────────────┐ │  │  verify and complete the mobile verification.            │  │
│ │ 📄  Documents    │ │  │  ─────────────────────────────────────────────────────  │  │
│ │     required     │ │  │                                                          │  │
│ │     for          │ │  │  Full Name *                                             │  │
│ │     registration │ │  │  ┌────────────────────────────────────────────────────┐│  │
│ │              →   │ │  │  │ Test Clinic Owner                                  ││  │
│ └──────────────────┘ │  │  └────────────────────────────────────────────────────┘│  │
│                      │  │                                                          │  │
│ ┌──────────────────┐ │  │  Email Address *                                         │  │
│ │ ℹ️  Need help?   │ │  │  ┌────────────────────────────────────────────────────┐│  │
│ │                  │ │  │  │ test@example.com                                 ✓ ││  │ ← Read-only
│ │ Contact          │ │  │  └────────────────────────────────────────────────────┘│  │
│ │ PulseMate        │ │  │  ℹ This email is verified from your registration and... │  │
│ │ Support     →    │ │  │                                                          │  │
│ └──────────────────┘ │  │  Mobile Number *                                         │  │
│                      │  │  ┌─────────────────────────────────────┬──────────────┐│  │
│                      │  │  │ +91 | Enter mobile number           │  Verify      ││  │
│                      │  │  └─────────────────────────────────────┴──────────────┘│  │
│                      │  │  Clinic's primary contact                                │  │
│                      │  └──────────────────────────────────────────────────────────┘  │
│                      │                                                                  │
│                      │  ┌──────────────────────────────────────────────────────────┐  │
│                      │  │  Primary contact                                         │  │
│                      │  │  ─────────────────────────────────────────────────────  │  │
│                      │  │                                                          │  │
│                      │  │  ☑ Same as owner mobile number                          │  │
│                      │  │  Use the owner's mobile number as the primary contact    │  │
│                      │  └──────────────────────────────────────────────────────────┘  │
│                      │                                                                  │
│                      │  ┌──────────────────────────────────────────────────────────┐  │
│                      │  │  Clinic location and address                             │  │
│                      │  │  Add your clinic's exact location so patients can find   │  │
│                      │  │  you easily.                                             │  │
│                      │  │  ─────────────────────────────────────────────────────  │  │
│                      │  │                                                          │  │
│                      │  │  ┌──────────────────────────────────────────────────┐  │  │
│                      │  │  │  [INTERACTIVE MAP - 400px height]                │  │  │
│                      │  │  │  • Click to select location                      │  │  │
│                      │  │  │  • Drag marker to adjust                         │  │  │
│                      │  │  │  • Zoom controls                                 │  │  │
│                      │  │  │  📍 Marker showing selected location             │  │  │
│                      │  │  └──────────────────────────────────────────────────┘  │  │
│                      │  │                                                          │  │
│                      │  │  ┌────────────────────────────────────────────────────┐│  │
│                      │  │  │ ✓ Clinic location selected                         ││  │
│                      │  │  │ Latitude: 28.613900                                ││  │
│                      │  │  │ Longitude: 77.209000                               ││  │
│                      │  │  └────────────────────────────────────────────────────┘│  │
│                      │  │                                                          │  │
│                      │  │  ┌────────────────────────────────────────────────────┐│  │
│                      │  │  │ ℹ Why is this important?                           ││  │
│                      │  │  │ Your clinic's location will be shown to patients...││  │
│                      │  │  └────────────────────────────────────────────────────┘│  │
│                      │  └──────────────────────────────────────────────────────────┘  │
│                      │                                                                  │
│                      │  ┌──────────────────────────────────────────────────────────┐  │
│                      │  │  Add more address details                                │  │
│                      │  │  Provide complete address information for your clinic.   │  │
│                      │  │  ─────────────────────────────────────────────────────  │  │
│                      │  │                                                          │  │
│                      │  │  Address Line 1 *                                        │  │
│                      │  │  ┌────────────────────────────────────────────────────┐│  │
│                      │  │  │ Building / clinic number, street                   ││  │
│                      │  │  └────────────────────────────────────────────────────┘│  │
│                      │  │  e.g., Shop No. 12, MG Road                              │  │
│                      │  │                                                          │  │
│                      │  │  Address Line 2 *                                        │  │
│                      │  │  ┌────────────────────────────────────────────────────┐│  │
│                      │  │  │ Area / locality                                    ││  │
│                      │  │  └────────────────────────────────────────────────────┘│  │
│                      │  │  e.g., Koramangala 4th Block                             │  │
│                      │  │                                                          │  │
│                      │  │  Landmark                                                │  │
│                      │  │  ┌────────────────────────────────────────────────────┐│  │
│                      │  │  │ Nearby landmark (optional)                         ││  │
│                      │  │  └────────────────────────────────────────────────────┘│  │
│                      │  │  e.g., Near Sony World Signal, Opposite ICICI Bank       │  │
│                      │  │                                                          │  │
│                      │  │  ┌──────────────────────┬──────────────────────────────┐│  │
│                      │  │  │ City *               │ State *                      ││  │
│                      │  │  │ ┌──────────────────┐ │ ┌──────────────────────────┐││  │
│                      │  │  │ │ City             │ │ │ Select state        ▼   │││  │
│                      │  │  │ └──────────────────┘ │ └──────────────────────────┘││  │
│                      │  │  └──────────────────────┴──────────────────────────────┘│  │
│                      │  │                                                          │  │
│                      │  │  ┌──────────────────────┬──────────────────────────────┐│  │
│                      │  │  │ Pincode *            │ Country *                    ││  │
│                      │  │  │ ┌──────────────────┐ │ ┌──────────────────────────┐││  │
│                      │  │  │ │ 6-digit pincode  │ │ │ India (read-only)        │││  │
│                      │  │  │ └──────────────────┘ │ └──────────────────────────┘││  │
│                      │  │  └──────────────────────┴──────────────────────────────┘│  │
│                      │  │                                                          │  │
│                      │  │  ┌────────────────────────────────────────────────────┐│  │
│                      │  │  │ ⚠ Please verify your address                       ││  │
│                      │  │  │ Make sure your clinic address is accurate. Patients││  │
│                      │  │  │ will use this information to find your clinic...   ││  │
│                      │  │  └────────────────────────────────────────────────────┘│  │
│                      │  └──────────────────────────────────────────────────────────┘  │
│                      │                                                                  │
│                      │  [Spacing for bottom action bar]                                │
│                      │                                                                  │
└──────────────────────┴──────────────────────────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────────────────────────────────────────────────┐
│  [Empty space]       │  💾 Save & Exit    ● All changes saved       [Next →]           │ ← Bottom Bar (Fixed)
└──────────────────────┴──────────────────────────────────────────────────────────────────┘
     384px offset                                                      Aligned with content
```

---

## 📱 Mobile Layout (<768px)

```
┌─────────────────────────────────────────────┐
│  [PM] PulseMate Connect     Help ℹ         │ ← Top Header (64px)
├─────────────────────────────────────────────┤
│  Step 1 of 4                                │ ← Progress Header (72px)
│  Clinic Information                         │
│  ●●○○                                       │
├─────────────────────────────────────────────┤
│                                             │
│  Clinic Information          (text-3xl)    │
│  Tell us about your clinic... (text-base)  │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Clinic details                       │ │
│  │  ───────────────────────────────────  │ │
│  │                                       │ │
│  │  Clinic Name *                        │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ Enter clinic name               │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │  This is the official name...        │ │
│  │                                       │ │
│  │  Clinic Type *                        │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ Select clinic type          ▼  │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  Clinic Display Name                  │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ Name shown to patients...       │ │ │
│  │  └─────────────────────────────────┘ │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Owner / administrator details        │ │
│  │  Your registration details...         │ │
│  │  ───────────────────────────────────  │ │
│  │                                       │ │
│  │  Full Name *                          │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ Test Clinic Owner               │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  Email Address *                      │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ test@example.com             ✓ │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │  ℹ This email is verified...         │ │
│  │                                       │ │
│  │  Mobile Number *                      │ │
│  │  ┌───────────────────┬───────────┐  │ │
│  │  │ +91 | 9999999999  │  Verify   │  │ │
│  │  └───────────────────┴───────────┘  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Primary contact                      │ │
│  │  ───────────────────────────────────  │ │
│  │  ☑ Same as owner mobile number       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Clinic location and address          │ │
│  │  ───────────────────────────────────  │ │
│  │                                       │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │  [MAP]                          │ │ │
│  │  │  400px height                   │ │ │
│  │  │  📍 Marker                      │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  ✓ Location selected                 │ │
│  │  Lat: 28.613900                      │ │
│  │  Lng: 77.209000                      │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Add more address details             │ │
│  │  ───────────────────────────────────  │ │
│  │                                       │ │
│  │  Address Line 1 *                     │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ Building / clinic number...     │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  Address Line 2 *                     │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ Area / locality                 │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  Landmark                             │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ Nearby landmark (optional)      │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  City *                               │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ City                            │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  State *                              │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ Select state                ▼  │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  Pincode *                            │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ 6-digit pincode                 │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  Country *                            │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ India (read-only)               │ │ │
│  │  └─────────────────────────────────┘ │ │
│  │                                       │ │
│  │  ⚠ Please verify your address        │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [Space for bottom bar]                    │
│                                             │
├─────────────────────────────────────────────┤
│  💾 Save    ● Saved       [Next →]        │ ← Bottom Action Bar
└─────────────────────────────────────────────┘
```

---

## 🎨 Component Breakdown

### **1. Top Header (OnboardingHeader)**

```
┌──────────────────────────────────────────────────────────┐
│  Logo                              Help Link             │
│  ┌──┐                                                    │
│  │PM│ PulseMate Connect      Need help? Contact... ℹ    │
│  └──┘                                                    │
└──────────────────────────────────────────────────────────┘
Height: 64px
Background: White (#FFFFFF)
Border-bottom: 1px solid #E5E7EB
Position: Sticky top-0 z-50
```

### **2. Left Sidebar (OnboardingSidebar)**

```
┌────────────────────────────────┐
│  Header Section                │
│  ┌──────────────────────────┐  │
│  │ Complete your clinic     │  │
│  │ registration             │  │
│  │                          │  │
│  │ Set up your clinic on    │  │
│  │ PulseMate Connect        │  │
│  └──────────────────────────┘  │
│                                │
│  Steps Section                 │
│  ┌──────────────────────────┐  │
│  │ ◉  Step 1                │  │ ← Active (blue bg, blue border-left)
│  │ │  Clinic Information    │  │
│  │ │  Clinic name, owner... │  │
│  │ │  Continue →            │  │
│  ├──────────────────────────┤  │
│  │ ○  Step 2                │  │ ← Inactive (gray)
│  │    Services & Operations │  │
│  │    Services, timings...  │  │
│  ├──────────────────────────┤  │
│  │ ○  Step 3                │  │
│  │    Clinic Documents      │  │
│  │    Verify your documents │  │
│  ├──────────────────────────┤  │
│  │ ○  Step 4                │  │
│  │    Partner Agreement     │  │
│  │    Review and accept     │  │
│  └──────────────────────────┘  │
│                                │
│  Footer Section                │
│  ┌──────────────────────────┐  │
│  │ 📄 Documents required    │  │ ← Clickable card
│  │    for registration  →   │  │
│  ├──────────────────────────┤  │
│  │ ℹ️  Need help?           │  │
│  │    Contact PulseMate →   │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
Width: 384px (w-96)
Background: White
Height: 100vh
Position: Sticky top-0
```

### **3. Card Design (All content cards)**

```
┌──────────────────────────────────────────┐
│  Card Heading (text-2xl, semibold)      │
│  Card description (text-sm, gray)       │
│  ───────────────────────────────────────│ ← Border
│                                          │
│  Field Label *  (text-sm, medium)       │
│  ┌────────────────────────────────────┐ │
│  │ Input field                        │ │
│  └────────────────────────────────────┘ │
│  Helper text (text-xs, gray)            │
│                                          │
│  [More fields...]                        │
│                                          │
└──────────────────────────────────────────┘
Background: White (#FFFFFF)
Border: 1px solid #E5E7EB
Border-radius: 16px (rounded-2xl)
Padding: 32px (p-8)
Spacing: 24px between sections (space-y-6)
```

### **4. Bottom Action Bar (BottomActionBar)**

```
┌───────────────┬──────────────────────────────────────────┐
│  [384px gap]  │  Content aligned with main content area  │
├───────────────┼──────────────────────────────────────────┤
│               │  💾 Save & Exit    ● All changes saved   │
│               │                          [Next →]        │
└───────────────┴──────────────────────────────────────────┘
Position: Fixed bottom-0
Height: 72px
Background: White (#FFFFFF)
Border-top: 1px solid #E5E7EB
Shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1)
Desktop: Left margin 384px (ml-96)
Mobile: Full width
```

---

## 📏 Spacing & Sizing

### **Page Layout:**
```
Content max-width: 1152px (max-w-6xl)
Content padding: 48px (px-12)
Section spacing: 32px (space-y-8)
Card spacing: 32px apart
```

### **Card Layout:**
```
Card padding: 32px (p-8)
Header margin-bottom: 24px (mb-6)
Field spacing: 20px (space-y-5)
Label margin-bottom: 6px (mb-1.5)
Helper text margin-top: 6px (mt-1.5)
```

### **Typography Sizing:**
```
Page heading:    40px (text-4xl)
Card heading:    24px (text-2xl)
Section heading: 20px (text-xl)
Body text:       16px (text-base)
Helper text:     14px (text-sm)
Small text:      12px (text-xs)
```

### **Icon Sizing:**
```
Step icons: 48px circle (w-12 h-12)
Icon itself: 20px (w-5 h-5)
Button icons: 20px (w-5 h-5)
Helper icons: 16px (w-4 h-4)
Small icons: 14px (w-3.5 h-3.5)
```

---

## 🎨 Color Usage Map

### **Sidebar:**
```css
Background: #FFFFFF
Border: #E5E7EB
Active step bg: #EFF6FF (blue-50)
Active step border: #2F73E8 (border-l-4)
Active step text: #2F73E8
Inactive text: #6B7280
Completed icon: #10B981 (green)
```

### **Content Area:**
```css
Background: #F9FAFB (gray-50)
Card background: #FFFFFF
Card border: #E5E7EB
Heading text: #111827 (gray-900)
Body text: #374151 (gray-700)
Helper text: #6B7280 (gray-600)
```

### **Form Fields:**
```css
Border: #E5E7EB (gray-200)
Focus border: #2F73E8 (blue-500)
Error border: #EF4444 (red-500)
Disabled bg: #F9FAFB (gray-50)
Placeholder: #9CA3AF (gray-400)
```

### **Info Boxes:**
```css
Success bg: #ECFDF5 (green-50)
Success border: #BBF7D0 (green-200)
Success text: #166534 (green-800)

Info bg: #EFF6FF (blue-50)
Info border: #DBEAFE (blue-100)
Info text: #1E40AF (blue-800)

Warning bg: #FEF3C7 (amber-50)
Warning border: #FDE68A (amber-200)
Warning text: #92400E (amber-900)

Error bg: #FEE2E2 (red-50)
Error border: #FECACA (red-200)
Error text: #991B1B (red-800)
```

---

## ✅ Visual Checklist

Use this to verify the design matches specs:

### **Header:**
- [ ] Logo gradient: blue-500 to teal-500
- [ ] Logo size: 40×40px
- [ ] Font size: text-xl (20px)
- [ ] Help icon: CircleHelp, 16px

### **Sidebar:**
- [ ] Width exactly 384px
- [ ] Header text: text-2xl
- [ ] Step icons: 48px circles
- [ ] Active step: blue-50 background + blue border-left
- [ ] Connector lines: 0.5px gray-200
- [ ] Footer cards: hover bg-gray-50

### **Content:**
- [ ] Page heading: text-4xl (36-40px)
- [ ] Subtitle: text-lg (18px)
- [ ] Card heading: text-2xl (24px)
- [ ] Card border-radius: rounded-2xl (16px)
- [ ] Card padding: p-8 (32px)

### **Pre-fill:**
- [ ] Email field: gray-50 background
- [ ] Email field: disabled attribute
- [ ] Green check icon: 20px
- [ ] Info icon: blue-500, 14px
- [ ] Helper text: text-xs (12px)

### **Action Bar:**
- [ ] Height: ~72px
- [ ] Desktop offset: ml-96 (384px)
- [ ] Save icon: 16px
- [ ] Next icon: 20px
- [ ] Green dot: 8px, animate-pulse

---

**Use these layouts as reference when implementing or verifying the design! 🎨**
