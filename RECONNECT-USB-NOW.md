# 🔌 Reconnect Your USB Device - Quick Guide

## Your device got disconnected! Here's what to do:

### Step 1: Reconnect Device
1. **Unplug** your phone from USB
2. **Plug it back in**
3. Check your phone screen for **"Allow USB debugging?"** popup
4. Tap **"Always allow from this computer"**
5. Tap **"OK"**

### Step 2: Verify Connection
Open a terminal and run:
```cmd
adb devices
```

You should see:
```
List of devices attached
9b90e608        device
```

If you see `unauthorized`, check your phone screen again.

### Step 3: Run the App

I've created 3 easy scripts for you:

#### Option 1: Full Build & Run (Recommended)
**Double-click:** `run-on-usb.bat`

This will:
- Check device connection
- Setup port forwarding
- Build and install the app
- Start the app automatically

#### Option 2: Start Metro Bundler
**Double-click:** `start-metro-usb.bat`

Then press **'a'** in the terminal to run on Android

#### Option 3: Quick Install
**Double-click:** `quick-install-usb.bat`

Choose between debug (faster) or release (optimized) build

---

## Manual Commands (If scripts don't work)

### 1. Check device connection:
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
adb devices
```

### 2. Setup port forwarding:
```cmd
adb reverse tcp:8081 tcp:8081
```

### 3. Run the app:
```cmd
npx expo run:android --device
```

---

## Troubleshooting

### Device shows as "unauthorized"
- Check phone screen for authorization popup
- Revoke and re-authorize:
  ```cmd
  adb kill-server
  adb start-server
  adb devices
  ```

### "No devices connected"
- Enable **USB Debugging** in Developer Options
- Try different USB cable
- Try different USB port on computer
- Change USB mode on phone to "File Transfer" or "PTP"

### Build fails
- Clear cache:
  ```cmd
  cd android
  gradlew clean
  cd ..
  ```
- Then run again:
  ```cmd
  npx expo run:android --device
  ```

### Metro bundler not connecting
```cmd
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097
```

---

## Quick Reference

| Script | Purpose |
|--------|---------|
| `run-on-usb.bat` | Full build & run on device |
| `start-metro-usb.bat` | Start Metro, press 'a' to run |
| `quick-install-usb.bat` | Choose debug/release build |

---

## Tips

- **Keep screen on** during development
- **Shake device** to open React Native dev menu
- **Press R twice** to reload the app
- **First build takes 5-10 minutes** (subsequent builds ~1-2 min)

---

## Need Help?

If nothing works, try this complete reset:
```cmd
# Kill ADB server
adb kill-server

# Disconnect phone

# Restart phone

# Reconnect phone

# Start ADB
adb start-server

# Check connection
adb devices

# Run app
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
npx expo run:android --device
```
