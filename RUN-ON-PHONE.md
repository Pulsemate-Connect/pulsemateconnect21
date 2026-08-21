# ✅ EASIEST SOLUTION: Run on Physical Android Phone

The emulator has AVD configuration issues. **Using a physical phone is faster and more reliable.**

## 📱 Quick Setup (5 minutes)

### Step 1: Enable USB Debugging on Your Phone
1. Open **Settings** on your Android phone
2. Scroll to **About Phone**
3. Tap **Build Number** 7 times (you'll see "You are now a developer!")
4. Go back to **Settings** → **System** → **Developer Options**
5. Enable **USB Debugging**
6. Enable **Install via USB** (if available)

### Step 2: Connect Your Phone
1. Connect your phone to computer via USB cable
2. On your phone, you'll see popup: "Allow USB debugging?"
3. Check "Always allow from this computer"
4. Tap **Allow** or **OK**

### Step 3: Verify Connection
Open command prompt and run:
```bash
C:\Users\shubh\AppData\Local\Android\Sdk\platform-tools\adb.exe devices
```

You should see something like:
```
List of devices attached
ABC123XYZ    device
```

If you see `unauthorized`, unplug and replug the USB cable, then allow debugging again.

### Step 4: Run the App
```bash
npm run android
```

The app will:
- Build automatically
- Install on your phone
- Launch the PulseMate app

## 🔥 Advantages of Physical Phone
- ✅ **No emulator configuration issues**
- ✅ **Much faster** (no emulator boot time)
- ✅ **Real device testing** (better for testing sensors, camera, notifications)
- ✅ **More reliable**
- ✅ **Better performance**

## 📍 Current Status
- ✅ Backend running: http://localhost:5000
- ✅ Frontend running: http://localhost:3000
- ⚠️ Emulator: Has AVD path issues

## 🐛 Emulator Issue (FYI)
The emulator has a broken AVD system path looking for duplicate `Sdk\Sdk\system-images\android-35\`. This is an Android Studio configuration issue that requires:
- Reinstalling Android system images
- Or creating a new AVD with API level 33 or 34
- Or editing AVD config files manually

**Using a physical phone bypasses all these issues completely.**
