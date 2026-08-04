# 🚀 Run PulseMate Connect Locally on Emulator

## 📱 Local Development (No Build Required)

Instead of building an APK and installing it, you can run the app in **development mode** which:
- ✅ Starts instantly (no 6-minute build wait)
- ✅ Hot reloads when you change code
- ✅ Shows errors and warnings in real-time
- ✅ Easy debugging

---

## 🎯 Quick Start (2 Steps)

### STEP 1: Start Your Android Emulator
Open Android Studio → Device Manager → Start any emulator

### STEP 2: Run the Development Server

**Double-click:**
```
RUN-LOCAL-EMULATOR.bat
```

OR

```
START-DEV-SERVER.bat
```

Then press **`a`** to open on Android emulator.

---

## 📋 What Happens

1. **Metro bundler starts** (JavaScript bundler)
2. **Expo development server starts** (http://localhost:8081)
3. **App automatically opens** on your emulator
4. **Code changes reload automatically**

---

## 🎮 Interactive Commands

Once the server is running, you can press:

- **`a`** - Open on Android emulator
- **`r`** - Reload the app
- **`m`** - Toggle menu
- **`j`** - Open debugger
- **`Ctrl+C`** - Stop the server

---

## 🔧 Manual Steps

### 1. Start Emulator
```bash
# Check if running
adb devices

# Should show:
# emulator-5554   device
```

### 2. Start Development Server
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
npx expo start
```

### 3. Open on Android
When you see the Expo menu, press **`a`** or run:
```bash
npx expo start --android
```

---

## 🆚 Local Development vs Production APK

| Aspect | Local Development | Production APK |
|--------|-------------------|----------------|
| **Start Time** | ~30 seconds | 6+ minutes (build time) |
| **Hot Reload** | ✅ Yes | ❌ No (rebuild required) |
| **Debugging** | ✅ Easy (real-time) | ❌ Hard (need logs) |
| **Performance** | Slower (dev mode) | Faster (optimized) |
| **Firebase** | ✅ Works | ⚠️ Needs production config |
| **Testing** | Development testing | Final testing |
| **Use Case** | During development | Before Play Store upload |

---

## ⚡ Recommended Workflow

### For Development (Daily Work):
1. ✅ Use **`RUN-LOCAL-EMULATOR.bat`**
2. ✅ Make code changes
3. ✅ App reloads automatically
4. ✅ Test features quickly

### For Testing (Before Release):
1. ✅ Build APK with `eas build --profile apk`
2. ✅ Install on emulator/device
3. ✅ Test production behavior
4. ✅ Verify Firebase authentication

### For Production (Release):
1. ✅ Build AAB with `eas build --profile production`
2. ✅ Upload to Google Play Console
3. ✅ Release to users

---

## 🐛 Troubleshooting

### Issue: Metro bundler error

**Solution:**
```bash
# Clear cache and restart
npx expo start --clear
```

### Issue: "No emulator detected"

**Solution:**
```bash
# Start emulator first
adb devices

# Then start Expo
npx expo start --android
```

### Issue: "Port 8081 already in use"

**Solution:**
```bash
# Kill the process using port 8081
npx kill-port 8081

# Or use different port
npx expo start --port 8082
```

### Issue: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
npm install
# or
yarn install

# Then restart
npx expo start
```

### Issue: App shows "Network Error" when testing OTP

**This is expected in development!**
- Local development uses: `http://localhost:8081`
- Backend API uses: `https://api.pulsemateconnect.in`

**Solutions:**
1. Make sure your backend server is running
2. Check `src/config/firebase.js` for correct API URL
3. Test on physical device (better network access)

---

## 📁 Quick Scripts Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| **`RUN-LOCAL-EMULATOR.bat`** | Start dev server + auto-open on Android | Daily development |
| **`START-DEV-SERVER.bat`** | Just start dev server | When you want manual control |
| **`INSTALL-NOW.bat`** | Install production APK | Testing production build |
| **`test-otp-flow.bat`** | Monitor authentication logs | Debugging OTP issues |

---

## 🎨 Development vs Production

### Development Mode (Local):
```bash
# What you're running now
npx expo start --android

# Uses:
- Dev server (localhost:8081)
- Hot reload enabled
- Source maps enabled
- Debug console enabled
- Fast refresh enabled
```

### Production Mode (APK/AAB):
```bash
# Built with EAS
eas build --platform android --profile production

# Uses:
- Optimized JavaScript bundle
- Minified code
- Production Firebase config
- No debugging tools
- Smaller app size
```

---

## 🧪 Testing OTP Authentication Locally

### Step 1: Start Backend Server
Make sure your backend is running at:
```
https://api.pulsemateconnect.in
```

### Step 2: Start Frontend (Local)
```bash
RUN-LOCAL-EMULATOR.bat
```

### Step 3: Test Login Flow
1. Open app on emulator
2. Enter phone: `+917022818878`
3. Tap "Send OTP"
4. Watch console for API calls

### Step 4: Monitor Logs
In a separate terminal:
```bash
test-otp-flow.bat
```

---

## 💡 Pro Tips

### Faster Development:
```bash
# Use tunnel for testing on physical device
npx expo start --tunnel

# Use LAN for faster loading
npx expo start --lan

# Clear cache if things break
npx expo start --clear
```

### Debug Network Requests:
```javascript
// In your code, add console logs
console.log('API Request:', url, data);
console.log('API Response:', response);
```

### View Logs:
```bash
# Android logs
adb logcat *:E

# Expo logs
# Press 'j' in the Expo terminal
```

---

## ✅ Recommended: Use Local Development

**For your daily work:**
1. ✅ Use `RUN-LOCAL-EMULATOR.bat` (much faster!)
2. ✅ Make your code changes
3. ✅ Test immediately with hot reload
4. ✅ Build APK only when ready for final testing

**Only build APK/AAB when:**
- Testing production behavior
- Verifying Firebase authentication works
- Preparing for Play Store upload
- Sharing with testers

---

## 🚀 Get Started Now

**Run this command:**
```
RUN-LOCAL-EMULATOR.bat
```

Then:
1. Wait for Expo server to start (~30 seconds)
2. Press **`a`** to open on Android
3. App opens automatically on your emulator
4. Start testing!

---

**Local development is MUCH faster than building APKs every time!** 🎉

---

**Last Updated:** August 2, 2026, 5:00 PM  
**Mode:** Development (Local)  
**Next Step:** Run `RUN-LOCAL-EMULATOR.bat`
