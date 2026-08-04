# 🚀 Quick Method: Use Android Studio to Start Emulator

## Step-by-Step Guide

### 1. Open Android Studio
- Click on Android Studio icon on your desktop or start menu

### 2. Open Device Manager
- Look for the **Device Manager** icon on the right side toolbar
- It looks like a phone icon 📱
- Or go to: **Tools** → **Device Manager**

### 3. Start Emulator
- You'll see a list of available emulators
- Find: **PulseMatePixel35** or **PulseMatePixel35c**
- Click the **▶ (Play)** button next to it

### 4. Wait for Boot
- The emulator window will open
- Wait for it to show the Android home screen (with app icons)
- Usually takes 1-2 minutes

### 5. Install & Run App
Once you see the home screen, open PowerShell/CMD in this folder and run:
```bash
.\OPEN-EAS-APP-NOW.bat
```

That's it! The app will install and launch automatically.

---

## Alternative: Manual Commands

If you prefer to do it manually:

```bash
# Check if ready
adb devices

# Install
adb install -r pulsemateconnect-v1.3.4-71-rnfirebase.apk

# Launch
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
```

---

## Troubleshooting

### Can't find Android Studio?

Search for it in Windows Start menu, or install from:
https://developer.android.com/studio

### Can't find Device Manager?

- In Android Studio, click: **View** → **Tool Windows** → **Device Manager**

### No emulators listed?

- Click "Create Device" button
- Select Pixel 5
- Download system image (Android 13+)
- Click Finish

---

**This method is faster and more reliable than waiting for command-line emulator to boot!**
