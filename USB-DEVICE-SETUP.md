# 🔌 USB Device Setup - Before Running App

## ❌ Problem: No USB Device Connected

When I tried to run the app, no USB device was detected, so it tried to use an emulator instead.

## ✅ Solution: Connect Your USB Device

### Step 1: Enable USB Debugging on Your Phone

1. **Open Settings** on your Android phone
2. Go to **About Phone**
3. Tap **Build Number** 7 times (you'll see "You are now a developer!")
4. Go back to **Settings** → **Developer Options**
5. Enable **USB Debugging**
6. Enable **Install via USB** (if available)

### Step 2: Connect Your Phone

1. **Plug your phone into your computer** using a USB cable
2. On your phone, you'll see a popup: **"Allow USB debugging?"**
3. Check **"Always allow from this computer"**
4. Tap **"OK"**

### Step 3: Verify Connection

Open a terminal and run:
```cmd
adb devices
```

**Expected output:**
```
List of devices attached
9b90e608        device
```

**If you see:**
- `unauthorized` → Check phone screen for authorization popup
- Empty list → Phone not detected, try:
  - Different USB cable
  - Different USB port
  - Change USB mode on phone to "File Transfer" (MTP)

### Step 4: Run the App

Once your device shows up in `adb devices`, you can run:

#### Option A: Use the script
**Double-click:** `run-on-usb.bat`

#### Option B: Manual command
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
npx expo run:android --device
```

#### Option C: Specify device ID directly
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
adb devices
npx expo run:android --device <device-id>
```
Replace `<device-id>` with your device ID (like `9b90e608`)

---

## Common Issues & Fixes

### 1. Device Not Detected

**Try these steps in order:**

```cmd
# 1. Kill and restart ADB server
adb kill-server
adb start-server

# 2. Check devices again
adb devices

# 3. If still not showing, unplug phone, restart phone, plug back in
```

### 2. Device Shows "Unauthorized"

- **Check your phone screen** for USB debugging authorization
- If no popup appears:
  ```cmd
  adb kill-server
  adb start-server
  ```
- Disconnect and reconnect phone

### 3. Multiple Devices/Emulators

If you have multiple devices or emulators, specify which one:
```cmd
# List all devices
adb devices

# Run on specific device
npx expo run:android --device <device-id>
```

### 4. Phone Keeps Disconnecting

- **Keep screen on** during build
- **Change USB cable** (some cables are charge-only)
- **Change USB port** (use USB 3.0 port if available)
- **Disable battery optimization** for USB debugging

---

## Alternative: Use Emulator

If USB device won't work, you can use an emulator:

```cmd
# Start emulator manually first
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator @PulseMatePixel35

# Then in another terminal:
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
npx expo run:android
```

---

## Checklist Before Running

- [ ] USB Debugging enabled on phone
- [ ] Phone connected via USB
- [ ] "Allow USB debugging" accepted on phone
- [ ] `adb devices` shows device as "device" (not "unauthorized")
- [ ] Screen is on and unlocked

---

## Quick Test

Run this to verify everything is working:
```cmd
adb devices
adb shell "echo Connection successful!"
```

If both commands work, you're ready to build!

---

## Need More Help?

If you're still having issues:

1. **Check device info:**
   ```cmd
   adb devices -l
   ```

2. **View ADB logs:**
   ```cmd
   adb logcat *:E
   ```

3. **Try wireless debugging** (Android 11+):
   - Phone Settings → Developer Options → Wireless Debugging
   - Pair device
   - Use: `adb connect <ip>:<port>`
