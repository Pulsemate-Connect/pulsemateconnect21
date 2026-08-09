# 🔧 Fix Emulator Issue - Start Manually

**Problem:** Emulator `PulseMatePixel35` quit before opening  
**Solution:** Start emulator manually, then reconnect app

---

## ✅ SOLUTION - METHOD 1 (Easiest)

### Use Android Studio Device Manager:

1. **Open Android Studio**
2. **Click "Tools" → "Device Manager"** (or look for 📱 icon in top right)
3. **Find "PulseMatePixel35"** in the list
4. **Click the ▶️ Play button** next to it
5. **Wait for emulator to fully boot** (~30-60 seconds)
   - You'll see Android boot animation
   - Then Android home screen
6. **Go back to Metro terminal**
7. **Press `a` again** to connect app

---

## 🚀 SOLUTION - METHOD 2 (Command Line)

### Run the batch file I created:

```bash
START-EMULATOR.bat
```

**Or manually:**
```bash
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe @PulseMatePixel35
```

**What happens:**
1. Emulator window opens
2. Android boots up (~30 seconds)
3. You see Android home screen
4. Keep terminal open!

**Then:**
1. Go back to Metro terminal
2. Press `a` to connect app

---

## 🎯 SOLUTION - METHOD 3 (Alternative Emulator)

### If PulseMatePixel35 keeps crashing, use a different emulator:

**Step 1: Check available emulators**
```bash
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe -list-avds
```

**Step 2: Start a different one**
```bash
# Example if you have other emulators:
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe @Pixel_5_API_30
# Or
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe @Pixel_3_API_29
```

**Step 3: Connect app**
- Go to Metro terminal
- Press `a`

---

## 🐛 WHY DID IT QUIT?

Common reasons:

### 1. Not Enough RAM
**Check:** PulseMatePixel35 might be configured with too much RAM
**Fix:** Use Android Studio Device Manager → Edit emulator → Reduce RAM to 2GB

### 2. Graphics Driver Issue
**Try starting with software rendering:**
```bash
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe @PulseMatePixel35 -gpu swiftshader_indirect
```

### 3. HAXM/Virtualization Issue
**Check:** Virtualization enabled in BIOS
**Windows:** Hyper-V might conflict with Android Emulator
**Fix:** 
```bash
# Check Hyper-V status
bcdedit
# If Hyper-V is on, Android emulator needs Windows Hypervisor Platform
```

### 4. Corrupted Emulator
**Fix:** Delete and recreate in Android Studio
1. Device Manager → Right-click emulator → Delete
2. Create new one → Pixel 5 or Pixel 3
3. Download system image
4. Finish setup

---

## 📱 ALTERNATIVE: USE PHYSICAL DEVICE

### Easiest option if emulator keeps failing:

**Step 1: Enable Developer Mode on your Android phone**
1. Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back → Developer Options
4. Enable "USB Debugging"

**Step 2: Connect phone via USB**
```bash
adb devices
```
Should show your phone

**Step 3: Trust computer**
- Pop-up on phone asking to trust computer
- Tap "Allow"

**Step 4: Run app**
- In Metro terminal, press `a`
- Select your physical device
- App installs and runs on your phone

---

## 🔍 DIAGNOSTIC COMMANDS

### Check emulator status:
```bash
# List all emulators
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe -list-avds

# Check connected devices
adb devices

# Kill all emulator processes (if stuck)
taskkill /F /IM qemu-system-x86_64.exe
taskkill /F /IM emulator.exe
```

### Start emulator with verbose logging:
```bash
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe @PulseMatePixel35 -verbose
```
(Check for error messages)

---

## ✅ STEP-BY-STEP FIX (Do This Now)

### Option A: Android Studio (Recommended)

```
1. Open Android Studio
2. Tools → Device Manager
3. Click ▶️ next to PulseMatePixel35
4. Wait for Android home screen
5. Metro terminal → Press 'a'
6. Done!
```

### Option B: Command Line

```bash
# Terminal 1: Start emulator
START-EMULATOR.bat

# Wait for Android home screen (30-60 sec)

# Terminal 2 (Metro): Press 'a'
```

### Option C: Use Your Phone

```
1. Phone: Enable USB Debugging
2. Connect USB cable
3. adb devices (verify connection)
4. Metro terminal → Press 'a'
5. Select your phone
6. Done!
```

---

## 🎯 WHAT TO DO RIGHT NOW

**EASIEST PATH:**

1. **Open Android Studio** (if installed)
2. **Device Manager** → Click ▶️ on emulator
3. **Wait for boot**
4. **Metro terminal** → Press `a`
5. **Test OTP login**

**IF NO ANDROID STUDIO:**

1. **Connect your Android phone** via USB
2. **Enable USB Debugging** on phone
3. **Trust computer** (pop-up on phone)
4. **Metro terminal** → Press `a`
5. **Select phone** from list
6. **Test OTP login**

---

## 📊 EXPECTED RESULT

### When emulator/device is ready:

**In Metro terminal:**
```
› Opening on Android...
› Building JavaScript bundle
› Running app on PulseMatePixel35
```

**On emulator/device:**
- PulseMate Connect app opens
- Shows splash screen
- Then login screen
- Ready to test!

---

## 🧪 AFTER APP OPENS

### Test the OTP fixes:

1. **Enter phone number:** `+91-XXXXXXXXXX`
2. **Tap "Send OTP"**
3. **Check Metro logs:**
   ```
   [MessageCentral] 📱 Sending OTP...
   [MessageCentral] ✅ OTP sent successfully
   ```
4. **Enter OTP** from SMS
5. **Expected:** ✅ Login successful!

**Both fixes should work:**
- ✅ No "Too many requests" (rate limit fixed)
- ✅ No 401 errors (API method fixed)

---

## 📝 FILES CREATED

- `START-EMULATOR.bat` - Start emulator manually
- `🔧-FIX-EMULATOR-ISSUE.md` - This troubleshooting guide

---

**STATUS:** Metro is running, waiting for Android device/emulator  
**ACTION:** Start emulator or connect phone → Press 'a' in Metro → Test OTP login

**Recommendation:** Use Android Studio Device Manager (easiest) or your physical phone (most reliable)
