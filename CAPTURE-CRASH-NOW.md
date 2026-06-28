# 📱 CAPTURE CRASH LOGS RIGHT NOW

## ⚠️ BEFORE YOU START

Make sure:
1. ✅ Version 9 AAB is uploaded to Play Store Internal Testing
2. ✅ App is installed on your device from Play Store
3. ✅ Device has USB cable connected to computer
4. ✅ You have this command prompt window open

---

## 📲 STEP 1: Enable USB Debugging on Your Phone

### On Your Android Device:

1. **Open Settings**

2. **Go to "About Phone"** (or "About Device")

3. **Tap "Build Number" 7 times**
   - You'll see a message: "You are now a developer!"

4. **Go back to Settings**

5. **Open "Developer Options"** (or "System" → "Developer Options")

6. **Enable "USB Debugging"**
   - Toggle the switch ON
   - Tap "OK" on the warning dialog

7. **Connect USB cable** from phone to computer

8. **On your phone, you'll see a popup:**
   - "Allow USB debugging?"
   - **Check "Always allow from this computer"**
   - **Tap "Allow"**

---

## 🔌 STEP 2: Verify Device Connection

### In Your Command Prompt, Run:

```cmd
adb devices
```

### Expected Output:
```
List of devices attached
ABC123456789    device
```

**If you see your device listed → Continue to Step 3**

**If you see "unauthorized" → Check your phone for the USB debugging popup**

**If you see nothing → Try:**
- Different USB cable
- Different USB port
- Restart ADB: `adb kill-server` then `adb start-server`

---

## 🗑️ STEP 3: Clear Old Logs

```cmd
adb logcat -c
```

This clears all previous logs so we only capture the crash.

---

## 📝 STEP 4: Start Capturing Logs

```cmd
adb logcat > crash-log.txt
```

**IMPORTANT:** This command will keep running and capturing logs. The window will show scrolling text - this is normal!

---

## 💥 STEP 5: Trigger the Crash

### While the logcat is running:

1. **On your phone:** Open **PulseMate Connect** from your app drawer

2. **Wait for it to crash** (should crash within 1-2 seconds)

3. **You'll see:** "PulseMate Connect keeps stopping" dialog

4. **In your command prompt:** You should see log lines scrolling

5. **After the crash:** Press **Ctrl + C** in the command prompt to stop logging

---

## 🔍 STEP 6: Find the Crash in the Log File

### Open the file:
```
crash-log.txt
```
(It's in the same folder as this file: `pulsemate123` folder)

### Search for ONE of these:

**Search 1:** `FATAL EXCEPTION`
**Search 2:** `AndroidRuntime`
**Search 3:** `Process: in.pulsemateconnect.patient`

### What You're Looking For:

```
--------- beginning of crash
E/AndroidRuntime(12345): FATAL EXCEPTION: main
E/AndroidRuntime(12345): Process: in.pulsemateconnect.patient, PID: 12345
E/AndroidRuntime(12345): java.lang.RuntimeException: Unable to start activity
E/AndroidRuntime(12345):     at android.app.ActivityThread.performLaunchActivity
E/AndroidRuntime(12345):     at com.facebook.react.ReactInstanceManager
E/AndroidRuntime(12345): Caused by: java.lang.NullPointerException: Attempt to invoke...
E/AndroidRuntime(12345):     at expo.modules.notifications.NotificationsPackage
... (more lines)
```

### Copy About 50-100 Lines:
- Start from "FATAL EXCEPTION"
- Include all lines that start with `E/AndroidRuntime`
- Include the "Caused by" sections
- Stop when you see lines from other apps

---

## 📤 STEP 7: Send Me the Crash Log

### Option A: Copy-Paste (Preferred)
Copy the crash section and paste it in your reply.

### Option B: Share the File
If the log is too large, you can:
1. Copy the crash section to a new file
2. Or share the relevant portion (50-100 lines around FATAL EXCEPTION)

---

## 🎯 WHAT I NEED TO SEE

### Essential Information:
1. **Exception Type**
   - Example: `java.lang.RuntimeException`
   - Example: `java.lang.NullPointerException`

2. **Process Name**
   - Should be: `in.pulsemateconnect.patient`

3. **Stack Trace**
   - The lines showing which files/methods were called
   - Example: `at expo.modules.notifications.NotificationsPackage.onCreate`

4. **Caused By** (if present)
   - Shows the root cause
   - Example: `Caused by: java.lang.IllegalStateException: Firebase not initialized`

---

## 🚨 TROUBLESHOOTING

### Problem: "adb devices" shows nothing

**Solution:**
```cmd
adb kill-server
adb start-server
adb devices
```

### Problem: Device shows "unauthorized"

**Solution:**
- Check your phone for USB debugging popup
- Revoke authorizations: Settings → Developer Options → Revoke USB debugging authorizations
- Disconnect and reconnect USB cable

### Problem: crash-log.txt is empty

**Solution:**
- Make sure you ran `adb logcat > crash-log.txt` BEFORE opening the app
- The logcat must be running when the crash happens

### Problem: Can't find "FATAL EXCEPTION" in log

**Solution 1:** The app might not be crashing, it might be:
- Frozen (black screen)
- Stuck at splash screen
- Showing a React Native error screen

**Solution 2:** Try filtering the log:
```cmd
adb logcat | findstr "AndroidRuntime"
```

### Problem: Log file is huge (>100 MB)

**Solution:** Filter only errors:
```cmd
adb logcat *:E > crash-log.txt
```

---

## 📋 QUICK REFERENCE CARD

```cmd
# 1. Check device
adb devices

# 2. Clear logs
adb logcat -c

# 3. Capture crash
adb logcat > crash-log.txt

# 4. Open app (let it crash)
# 5. Press Ctrl+C

# 6. Open crash-log.txt
# 7. Search for "FATAL EXCEPTION"
# 8. Copy 50-100 lines and send to me
```

---

## ✅ READY TO START?

1. Enable USB Debugging on your phone ✓
2. Connect USB cable ✓
3. Run: `adb devices` ✓
4. Run: `adb logcat -c` ✓
5. Run: `adb logcat > crash-log.txt` ✓
6. Open PulseMate Connect on phone ✓
7. Wait for crash ✓
8. Press Ctrl+C ✓
9. Open crash-log.txt ✓
10. Find "FATAL EXCEPTION" and send it to me ✓

---

## 🎯 WHAT HAPPENS NEXT

Once I receive your crash log:

1. **I'll identify the exact issue** (usually within 5 minutes)
2. **I'll fix the specific problem** (targeted fix, not guesswork)
3. **I'll build version 10** (the final working version)
4. **You upload and test** (app should work!)

---

**LET'S DO THIS! 🚀**

Start with Step 1 above and work your way through. Send me the crash log when you're done!

---

*Created: June 28, 2026*  
*Your device: Not connected yet*  
*Status: Waiting for crash log...*
