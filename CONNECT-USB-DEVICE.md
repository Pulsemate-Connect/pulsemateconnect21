# Connect USB Device - Quick Guide

## 🔌 Step-by-Step Instructions

### 1. Enable USB Debugging on Your Android Device

1. **Go to Settings** → **About Phone**
2. Tap **Build Number** 7 times (to enable Developer Mode)
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**
5. Enable **Install via USB** (if available)

### 2. Connect Your Device

1. Connect your Android phone to PC via USB cable
2. On your phone, you'll see a prompt: **"Allow USB debugging?"**
3. Check **"Always allow from this computer"**
4. Tap **OK**

### 3. Verify Connection

Open a terminal and run:
```bash
adb devices
```

You should see something like:
```
List of devices attached
9b90e608        device
```

If you see:
- **No devices listed**: Device not connected or USB debugging not enabled
- **unauthorized**: You need to accept the USB debugging prompt on your phone
- **offline**: Try unplugging and reconnecting the cable

### 4. Start Expo with USB

Run the provided batch file:
```bash
start-expo-usb.bat
```

Or manually:
```bash
# Set up port forwarding
adb reverse tcp:8081 tcp:8081

# Start Expo
npx expo start
```

### 5. Open App on Device

**Option A: Auto-detect (Recommended)**
- Open **Expo Go** app on your phone
- The app should automatically detect the dev server
- Tap on your project name

**Option B: Direct Install**
- Press **'a'** in the Expo terminal
- App will build and install directly to your device

**Option C: QR Code**
- Scan the QR code with Expo Go app

## 🔧 Troubleshooting

### Device Not Detected

1. **Check USB cable**: Try a different cable (some cables are charge-only)
2. **Try different USB port**: Use a USB 2.0 port if possible
3. **Restart ADB**:
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```
4. **Check drivers**: Windows may need Android USB drivers

### "Connection Refused" Error

Set up port forwarding:
```bash
adb reverse tcp:8081 tcp:8081
```

### Metro Bundler Issues

Clear cache and restart:
```bash
npx expo start --clear
```

### App Won't Connect

1. Make sure phone and PC are on the same WiFi (if not using USB)
2. Check firewall isn't blocking port 8081
3. Restart Expo and Metro bundler

## 📱 Device Requirements

- **Android**: 5.0 (Lollipop) or higher
- **Expo Go**: Latest version from Play Store
- **USB Debugging**: Enabled
- **Developer Mode**: Enabled

## 🚀 Quick Start

```bash
# 1. Check device
adb devices

# 2. Set up port forwarding
adb reverse tcp:8081 tcp:8081

# 3. Start Expo
npx expo start

# 4. Open Expo Go on your phone
```

## ✅ Success Indicators

When everything works, you'll see:
- ✓ Device listed in `adb devices`
- ✓ QR code displayed in terminal
- ✓ "Metro waiting on exp://..." message
- ✓ App loads on your phone via Expo Go

## 📝 Current Status

- **Device ID**: Check with `adb devices`
- **Expo Server**: Run `npx expo start`
- **Port**: 8081 (default)
- **Connection**: USB with ADB reverse

---

Need help? Check the logs in the Expo terminal for error messages.
