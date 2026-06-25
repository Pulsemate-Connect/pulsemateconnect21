# Play Store Assets Required

## Feature Graphic (REQUIRED — 1024 × 500 px)
- File: `feature-graphic.png`
- Specs: PNG, no alpha, exactly 1024×500 px
- Content: PulseMate logo + tagline "Smart Healthcare at Your Fingertips"
  on the brand blue (#2563EB) gradient background
- Upload to: Play Console → Store listing → Graphics → Feature graphic

## App Icon (REQUIRED — 512 × 512 px)
- File: `icon-512.png`
- Source: `PulseMateApp/assets/icon.png` (resize to 512×512)
- Upload to: Play Console → Store listing → Graphics → App icon

## Phone Screenshots (REQUIRED — minimum 2, up to 8)
Recommended size: 1080 × 2340 px (portrait)

Take screenshots of these screens (press `s` in Expo then screenshot emulator):
1. Home screen — showing doctor cards and nearby clinics
2. Doctor search — search results
3. Booking screen — "🎉 First Booking Free!" banner visible
4. Live queue screen — queue position display
5. Profile screen — completed profile view
6. OTP login screen

## 10-inch Tablet Screenshots (OPTIONAL but recommended)
- Size: 1600 × 2560 px

---

## Quick Screenshot Guide (Android Emulator)

```bash
# Start emulator in Expo
npx expo start --android

# Take screenshot via ADB
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ./store-listing/screenshots/
```

Or use Android Studio → Extended Controls → Screenshot button.
