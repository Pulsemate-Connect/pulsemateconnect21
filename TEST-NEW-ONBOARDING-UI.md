# 🧪 Testing Guide: New Onboarding UI

**Quick checklist to verify the redesigned clinic partner onboarding**

---

## 🚀 Start Testing

### **1. Start the Frontend**

```bash
cd frontend
npm run dev
```

**Expected:** Vite dev server starts at `http://localhost:3000`

---

### **2. Register New Clinic Partner**

1. Go to: `http://localhost:3000/clinic-partner`
2. Click **"Create account"**
3. Enter:
   - Name: `Test Clinic Owner`
   - Email: `test@example.com`
   - Check: "I agree to Terms of Service"
4. Click **"Continue"**
5. Enter OTP: `123456`
6. Click **"Verify & Continue"**

**Expected:** Redirected to `/clinic/onboarding/step-1`

---

## ✅ Visual Checks (Desktop)

### **Top Header**
- [ ] White background with border-bottom
- [ ] **Left:** PulseMate Connect logo (blue gradient box with "PM")
- [ ] **Right:** "Need help? Contact PulseMate Support" with CircleHelp icon
- [ ] Header is sticky (stays at top when scrolling)

### **Left Sidebar**
- [ ] Width: 384px (w-96)
- [ ] White background
- [ ] **Header Section:**
  - [ ] "Complete your clinic registration" (text-2xl)
  - [ ] "Set up your clinic on PulseMate Connect" (text-sm gray)
- [ ] **4 Steps visible:**
  - [ ] Step 1: Building2 icon (active - blue bg, blue left border)
  - [ ] Step 2: Stethoscope icon (gray, inactive)
  - [ ] Step 3: FileText icon (gray, inactive)
  - [ ] Step 4: Handshake icon (gray, inactive)
- [ ] **Connector lines** between steps
- [ ] **Current step shows:** "Continue" button
- [ ] **Footer:**
  - [ ] "Documents required for registration" card
  - [ ] "Need help? Contact PulseMate Support" card

### **Right Content Area**
- [ ] **Page Heading:** "Clinic Information" (text-4xl, semibold)
- [ ] **Subtitle:** "Tell us about your clinic..." (text-lg, gray)
- [ ] **Cards visible:**
  - [ ] Card 1: Clinic details
  - [ ] Card 2: Owner/Administrator details
  - [ ] Card 3: Primary Contact
  - [ ] Card 4: Clinic Location (with map)
  - [ ] Card 5: Address Details
- [ ] All cards have:
  - [ ] White background
  - [ ] Rounded corners (rounded-2xl)
  - [ ] Subtle border
  - [ ] 32px padding

### **Bottom Action Bar**
- [ ] Fixed at bottom
- [ ] White background with shadow
- [ ] **Left side:**
  - [ ] "Save & Exit" button with Save icon
  - [ ] Green dot + "All changes saved"
- [ ] **Right side:**
  - [ ] "Next" button (blue) with ArrowRight icon
- [ ] Action bar offset from sidebar (ml-96 on desktop)

---

## ✅ Icon Checks

### **Lucide Icons Rendering:**
- [ ] Step 1: Building2 icon (looks like a building/hospital)
- [ ] Step 2: Stethoscope icon (medical instrument)
- [ ] Step 3: FileText icon (document)
- [ ] Step 4: Handshake icon (partnership)
- [ ] Documents card: File icon
- [ ] Help card: CircleHelp icon
- [ ] Save button: Save icon
- [ ] Next button: ArrowRight icon
- [ ] All icons have consistent stroke width

---

## ✅ Pre-fill Functionality

### **Owner/Administrator Details Card:**
- [ ] **Full Name field:**
  - [ ] Pre-filled with: `Test Clinic Owner`
  - [ ] Field is editable (white background)
- [ ] **Email field:**
  - [ ] Pre-filled with: `test@example.com`
  - [ ] Field is **disabled** (gray background)
  - [ ] Green checkmark icon on right side
  - [ ] Helper text: "This email is verified from your registration and cannot be changed"
- [ ] **Mobile field:**
  - [ ] Empty (ready for input)
  - [ ] "Verify" button visible

---

## ✅ Form Interaction Checks

### **Clinic Details Card:**
- [ ] Clinic Name input works
- [ ] Clinic Type dropdown opens (14 options)
- [ ] If "Other" selected, "Specify Clinic Type" field appears
- [ ] Display Name input works (optional)

### **Owner Details Card:**
- [ ] Name can be edited
- [ ] Email cannot be edited (disabled)
- [ ] Mobile number accepts 10 digits
- [ ] "Verify" button clickable

### **Primary Contact Card:**
- [ ] "Same as owner mobile" checkbox works
- [ ] When checked, uses owner's mobile

### **Clinic Location Card:**
- [ ] Map renders (Leaflet map)
- [ ] Can click on map to select location
- [ ] Coordinates display after selection
- [ ] Blue info box: "Why is this important?" visible

### **Address Details Card:**
- [ ] Address Line 1 input works
- [ ] Address Line 2 input works
- [ ] Landmark input works (optional)
- [ ] City input works
- [ ] State dropdown opens (36 Indian states)
- [ ] Pincode accepts 6 digits
- [ ] Country shows "India" (read-only, gray)
- [ ] Amber warning box at bottom visible

---

## ✅ Validation Checks

### **Required Fields:**
1. Leave all fields empty
2. Scroll to bottom
3. Click **"Next"**

**Expected:**
- [ ] Error messages appear below each required field
- [ ] Red error summary box appears at bottom
- [ ] "Next" button stays disabled
- [ ] No navigation occurs

### **Fix Errors:**
1. Fill required fields:
   - Clinic Name: `Test Clinic`
   - Clinic Type: `General Clinic`
   - Owner Name: `Test Owner` (pre-filled)
   - Owner Email: `test@example.com` (pre-filled, disabled)
   - Owner Mobile: `9999999999`
2. Click "Verify" on mobile (OTP: 123456)
3. Click map to select location
4. Fill address:
   - Address Line 1: `123 Test Street`
   - Address Line 2: `Test Area`
   - City: `Mumbai`
   - State: `Maharashtra`
   - Pincode: `400001`
5. Click **"Next"**

**Expected:**
- [ ] All errors cleared
- [ ] Form validates successfully
- [ ] "Next" button enabled
- [ ] Success toast appears
- [ ] (Step 2 navigation when implemented)

---

## ✅ Action Bar Checks

### **Save & Exit:**
1. Fill some fields (don't complete form)
2. Click **"Save & Exit"**

**Expected:**
- [ ] Save icon shows loading spinner
- [ ] Success toast: "Progress saved"
- [ ] Redirect to clinic dashboard (or appropriate page)

### **Auto-save Indicator:**
- [ ] Green dot visible
- [ ] "All changes saved" text visible
- [ ] Dot pulses/animates

### **Next Button States:**
- [ ] **Disabled:** Gray background, gray text, no hover effect
- [ ] **Enabled:** Blue background, white text, hover effect
- [ ] **Loading:** Spinner icon, "Processing..." text

---

## ✅ Mobile Checks (<768px)

### **Use Browser DevTools:**
1. Open DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M)
3. Select iPhone 12 Pro or similar

### **Mobile Layout:**
- [ ] **Top Header:**
  - [ ] Logo visible
  - [ ] Help link visible (may be abbreviated)
- [ ] **Compact Progress Header:**
  - [ ] "Step 1 of 4" text
  - [ ] "Clinic Information" title
  - [ ] 4 progress dots: ●●○○
  - [ ] Current step highlighted
- [ ] **Sidebar:** Hidden (not visible)
- [ ] **Content:** Full width
- [ ] **Cards:** Stack vertically
- [ ] **Action Bar:**
  - [ ] Full width
  - [ ] "Save & Exit" may be abbreviated
  - [ ] "Next" button visible
- [ ] **No horizontal scroll**

---

## ✅ Responsive Breakpoints

### **Desktop (≥1024px):**
- [ ] Sidebar visible (384px)
- [ ] Content area on right
- [ ] Action bar offset from sidebar

### **Tablet (768-1023px):**
- [ ] Sidebar may be narrower or hidden
- [ ] Content responsive

### **Mobile (<768px):**
- [ ] Sidebar hidden
- [ ] Compact progress header
- [ ] Full-width content

---

## ✅ Hover States

### **Sidebar:**
- [ ] "Documents required" card: hover → bg-gray-50
- [ ] Arrow icon translates on hover
- [ ] "Contact PulseMate Support" link: hover → underline

### **Action Bar:**
- [ ] "Save & Exit": hover → bg-gray-100
- [ ] "Next": hover → bg-blue-700, scale-105

---

## ✅ Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Edge (latest)

**Check:**
- [ ] Icons render
- [ ] Layout correct
- [ ] No console errors
- [ ] Hover effects work
- [ ] Forms functional

---

## 🐛 Common Issues & Fixes

### **Issue 1: Icons not showing**
**Cause:** lucide-react not installed  
**Fix:**
```bash
cd frontend
npm install lucide-react
npm run dev
```

---

### **Issue 2: Sidebar overlapping content**
**Cause:** Layout flex issue  
**Check:** OnboardingLayout.jsx has `flex` class

---

### **Issue 3: Email not pre-filled**
**Cause:** User not authenticated or authStore empty  
**Check:**
```javascript
// In browser console:
JSON.parse(localStorage.getItem('pulsemate-auth-storage'))
```
Should show user object with email

---

### **Issue 4: Action bar not offset**
**Cause:** Missing `ml-96` class on desktop  
**Check:** BottomActionBar has `lg:ml-96`

---

### **Issue 5: Mobile header covering content**
**Cause:** Missing top padding  
**Check:** Content has `pt-24 lg:pt-0`

---

## 📸 Screenshot Checklist

Take screenshots of:
- [ ] Full desktop view
- [ ] Sidebar close-up (showing icons)
- [ ] Owner details card (showing pre-filled email)
- [ ] Bottom action bar
- [ ] Mobile compact header
- [ ] Mobile cards stacked
- [ ] Map with location selected
- [ ] Validation errors
- [ ] Success states

---

## ✅ Final Checklist

Before considering complete:
- [ ] All Lucide icons render correctly
- [ ] Owner email pre-filled and read-only
- [ ] Owner name pre-filled but editable
- [ ] Map picker works
- [ ] Mobile verification works
- [ ] Form validation works
- [ ] Save & Exit works
- [ ] Next button works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No visual glitches
- [ ] Hover states smooth
- [ ] Professional appearance

---

## 🎉 Success Criteria

If all checks pass:
✅ **New Onboarding UI is ready for use!**

The redesigned interface provides:
- Professional healthcare aesthetic
- Zomato-inspired layout
- Pre-filled registration data
- Clear step navigation
- Mobile-responsive design
- All existing functionality preserved

---

**Happy Testing! 🚀**
