# 📦 Package Name Change Guide

## Changes Made to Code:

✅ **app.json updated:**
- App name: `PulseMate` → `PulseMate Connect`
- Package: `in.pulsemateconnect.app` → `in.pulsemateconnect.patient`
- iOS bundle: `in.pulsemateconnect.app` → `in.pulsemateconnect.patient`

---

## ⚠️ CRITICAL: You Must Do These Steps

### Step 1: Update Firebase (REQUIRED)

**Why?** Firebase config is tied to package name. You must add the new package.

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: **pulsemateconnect**
3. Click gear icon ⚙️ → **Project settings**
4. Scroll down to **"Your apps"** section
5. Find Android app with package `in.pulsemateconnect.app`
6. Click **"Add app"** (or Add another app)
7. Select **Android** icon
8. Enter package name: `in.pulsemateconnect.patient`
9. Enter app nickname: `PulseMate Connect (Patient)`
10. Click **"Register app"**
11. **Download the NEW google-services.json**
12. Replace the file in your project root

**OR** you can just add the new package to existing app:
1. In Firebase Console → Project Settings
2. Under "Your apps" find the Android app
3. Click "Add fingerprint" or similar option to add new package

---

### Step 2: Create NEW App in Play Console (REQUIRED)

**⚠️ IMPORTANT:** Google Play Store does NOT allow changing package names.

You must create a COMPLETELY NEW app:

1. Go to Play Console: https://play.google.com/console
2. Click **"Create app"** (green button)
3. Fill in details:
   - **App name:** PulseMate Connect
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Click **"Create app"**

**Important Notes:**
- The OLD app (`in.pulsemateconnect.app`) will remain separate
- This NEW app (`in.pulsemateconnect.patient`) starts fresh
- You'll need to complete ALL setup steps again for the new app

---

### Step 3: Update Backend (if package name is used)

Check if your backend uses the package name anywhere:
- Push notification targeting
- App version checks
- Analytics filters

**Search backend for:** `in.pulsemateconnect.app`

---

### Step 4: Rebuild Everything

After updating Firebase config:

```bash
# Clean old builds
rm -rf node_modules
rm -rf .expo
rm -rf dist

# Reinstall
npm install

# Build new AAB
eas build --platform android --profile production --clear-cache
```

This creates AAB with package: `in.pulsemateconnect.patient`

---

### Step 5: Setup New Play Console App

Complete all sections in the NEW Play Console app:
1. App content (ads, access, etc.)
2. Content rating
3. Target audience (18+)
4. Data safety
5. Privacy policy URL
6. Store listing:
   - **Title:** PulseMate Connect
   - **Short description:** Book doctor appointments instantly
   - **Full description:** (see below)
   - **App icon:** 512x512 (already in assets/icon.png)
   - **Screenshots:** Required
   - **Feature graphic:** 1024x500 (need to create)

---

## 🎨 Play Store Listing Details

### App Title (30 chars max)
```
PulseMate Connect
```

### Short Description (80 chars max)
```
Book doctor appointments instantly. Find nearby clinics. Digital health records.
```

### Full Description (4000 chars max)
```
PulseMate Connect - Your Digital Healthcare Companion

Find the right doctor, book appointments instantly, and manage your health records all in one place. PulseMate Connect makes healthcare accessible, convenient, and patient-friendly.

🏥 FIND NEARBY CLINICS & DOCTORS
• Search by specialty, location, or doctor name
• View doctor profiles with qualifications and experience
• Check real-time availability
• See clinic ratings and reviews

📅 INSTANT APPOINTMENT BOOKING
• Book appointments in seconds
• Choose morning, afternoon, or evening sessions
• View available time slots in real-time
• Get queue numbers automatically
• Receive booking confirmation instantly

💳 SECURE PAYMENTS
• Integrated with Razorpay for safe transactions
• Multiple payment options (UPI, Cards, Wallets)
• Your first booking is FREE!
• Transparent pricing with no hidden charges

🔔 NEVER MISS AN APPOINTMENT
• Automated appointment reminders
• Push notifications for updates
• Track upcoming and past appointments
• Easy rescheduling and cancellation

📊 DIGITAL HEALTH RECORDS
• Store all appointments in one place
• Access prescriptions digitally
• Track your health history
• Emergency contact management
• Secure and private

✨ KEY FEATURES
✓ Find doctors by specialty and location
✓ Real-time appointment availability
✓ Queue management system
✓ Digital prescriptions
✓ Secure payment gateway
✓ Push notifications
✓ Multi-language support (coming soon)
✓ Telemedicine consultations (coming soon)

🔒 YOUR PRIVACY MATTERS
• All data encrypted and secure
• HIPAA-compliant data handling
• No data shared with third parties
• Full control over your information

📱 EASY TO USE
• Clean, intuitive interface
• Fast and responsive
• Works on all Android devices
• Offline mode for viewing records

Download PulseMate Connect today and experience hassle-free healthcare!

For support: support@pulsemateconnect.in
Website: https://pulsemateconnect.in
Privacy Policy: https://pulsemateconnect.in/privacy-policy
Terms of Service: https://pulsemateconnect.in/terms
```

### App Category
- **Category:** Medical
- **Tags:** Doctor appointment, Healthcare, Clinic booking, Digital health, Telemedicine

### Contact Details
- **Email:** support@pulsemateconnect.in
- **Website:** https://pulsemateconnect.in
- **Privacy Policy:** https://pulsemateconnect.in/privacy-policy

---

## 📱 App Icon & Graphics Required

### App Icon (REQUIRED)
- **Size:** 512 x 512 pixels
- **Format:** PNG (32-bit)
- **File:** `assets/icon.png` ✅ Already exists
- **Upload to:** Play Console → Store listing → App icon

### Feature Graphic (REQUIRED)
- **Size:** 1024 x 500 pixels
- **Format:** PNG or JPEG
- **Content:** App showcase with logo and key features
- **Create using:** Canva, Figma, or Photoshop

**Suggestion:**
```
[PulseMate Logo]  |  Book Appointments • Find Doctors • Digital Health Records
```

### Screenshots (REQUIRED - 2 to 8 images)
- **Size:** 1080 x 1920 pixels (or similar 9:16 ratio)
- **Format:** PNG or JPEG
- **Required:** At least 2 screenshots
- **Recommended:** 5-8 screenshots

**Recommended screenshots:**
1. Home screen / Find doctors
2. Doctor search results
3. Doctor profile
4. Booking screen (with sessions)
5. Appointments list
6. Profile/Settings screen

---

## 🔄 What Happens to Old App?

The old app with package `in.pulsemateconnect.app`:
- **Stays in Play Console** (if you already created it)
- **Cannot be renamed** to new package
- **Options:**
  - Keep both apps (Patient app + another variant)
  - Or delete/unpublish the old one

---

## ✅ Checklist

Before building:
- [ ] Update Firebase → Add new package `in.pulsemateconnect.patient`
- [ ] Download NEW google-services.json
- [ ] Replace google-services.json in project root

Before uploading:
- [ ] Create NEW app in Play Console
- [ ] Setup app name: "PulseMate Connect"
- [ ] Upload app icon (512x512)
- [ ] Create and upload feature graphic (1024x500)
- [ ] Take and upload screenshots (1080x1920)
- [ ] Complete all required sections

After building:
- [ ] Build new AAB with updated package name
- [ ] Test the new AAB locally
- [ ] Upload to NEW Play Console app
- [ ] Submit for review

---

## 🚨 Important Notes

1. **Cannot change package in existing Play Console app** - Must create new app
2. **Firebase config MUST match package name** - Update before building
3. **Users of old app won't auto-update** - They're different apps
4. **You'll have TWO apps in Play Console** - Old and new (unless you delete old one)
5. **Start fresh with new app** - No previous releases, reviews, or ratings transfer

---

## Next Steps

1. **First:** Update Firebase (Step 1 above)
2. **Second:** Create NEW Play Console app (Step 2 above)
3. **Third:** Rebuild with new package (Step 4 above)
4. **Fourth:** Upload to NEW app (Step 5 above)

---

**Current Status:**
- ✅ Code updated with new package name
- ⏳ Waiting for Firebase config update
- ⏳ Waiting for NEW Play Console app creation
- ⏳ Need to rebuild AAB

**After you update Firebase, tell me and I'll rebuild!**
