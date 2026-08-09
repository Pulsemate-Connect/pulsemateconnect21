# Quick Command Reference

## 🔧 Complete Migration Commands

Run these commands in order:

```bash
# 1. Navigate to project directory
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# 2. Remove Firebase dependencies
npm uninstall @react-native-firebase/app @react-native-firebase/auth

# 3. Install dependencies (verify everything is in sync)
npm install

# 4. Clean Android build (optional but recommended)
cd android
gradlew clean
cd ..

# 5. Start development server
npm start

# 6. Run on Android emulator
npm run android

# Or scan QR code for Expo Go on physical device
```

---

## 🧪 Testing Commands

```bash
# Check for any remaining Firebase imports
grep -r "@react-native-firebase" src/

# Check package.json
cat package.json | grep firebase

# View new service
cat src/services/messagecentral-otp.service.js

# Check backend is running
curl https://api.pulsemateconnect.in/api/health
```

---

## 🔍 Verification Commands

```bash
# Verify no Firebase dependencies
npm list | grep firebase
# Should return empty

# Check all imports in screens
grep -n "import.*firebase" src/screens/*.jsx
# Should return empty

# Check new service exists
ls -la src/services/messagecentral-otp.service.js
```

---

## 🏗️ Build Commands

```bash
# Development build
eas build --profile development --platform android

# Production build
eas build --profile production --platform android

# Submit to Play Store
eas submit --platform android
```

---

## 📝 Git Commands (Optional)

```bash
# Check what changed
git status

# View specific file changes
git diff src/screens/LoginScreen.jsx
git diff src/screens/OtpScreen.jsx
git diff package.json

# Stage all migration changes
git add src/services/messagecentral-otp.service.js
git add src/screens/LoginScreen.jsx
git add src/screens/OtpScreen.jsx
git add package.json
git add MIGRATION-*.md
git add TESTING-GUIDE.md
git add COMMANDS.md

# Commit
git commit -m "Migrate from Firebase to Message Central OTP

- Remove Firebase Phone Authentication SDK
- Add Message Central OTP service
- Update LoginScreen and OtpScreen
- Remove Firebase dependencies
- Add comprehensive documentation

BREAKING CHANGE: Firebase Phone Auth replaced with Message Central OTP
"

# Push
git push origin main
```

---

## 🧹 Cleanup Commands (Optional)

After successful testing:

```bash
# Remove Firebase config file
rm android/app/google-services.json

# Remove old Firebase audit documents
rm FIREBASE-PHONE-AUTH-PRODUCTION-AUDIT-REPORT.md
rm ADD-SHA-TO-FIREBASE-NOW.md
rm QUICK-FIX-GUIDE.md

# Clean build cache
cd android
gradlew clean
cd ..

# Clear npm cache
npm cache clean --force
```

---

## 🐛 Debug Commands

```bash
# View app logs
adb logcat | grep -i "pulsemateconnect\|messagecentral\|otp"

# View Metro bundler logs
npm start -- --verbose

# Clear React Native cache
npx react-native start --reset-cache

# Clear Expo cache
expo start -c

# Rebuild Android
cd android
gradlew clean assembleDebug
cd ..
```

---

## 📦 Package Management

```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 🔄 Rollback Commands (If Needed)

If you need to rollback the migration:

```bash
# Revert all changes
git reset --hard HEAD~1

# Reinstall Firebase
npm install @react-native-firebase/app @react-native-firebase/auth

# Restore old service file from git history
git checkout HEAD~1 -- src/services/firebase-native-auth.service.js

# Clean and rebuild
npm install
cd android && gradlew clean && cd ..
```

---

## 📊 Status Check Commands

```bash
# Check current branch
git branch

# Check last commit
git log -1 --oneline

# Check file sizes
du -sh src/services/*.js

# Check node_modules size
du -sh node_modules

# Check project structure
tree src/services -L 2
tree src/screens -L 1
```

---

## 🎯 Quick Test Sequence

```bash
# 1. Start backend (if running locally)
cd ../backend
npm run dev

# 2. In new terminal, start frontend
cd ../pulsemateconnect21
npm start

# 3. In new terminal, run Android
npm run android

# 4. Monitor logs
adb logcat | grep -E "LoginScreen|OtpScreen|MessageCentral"
```

---

## ✅ Final Verification

```bash
# Verify migration complete
echo "Checking Firebase removal..."
npm list | grep firebase || echo "✅ Firebase removed"

echo "Checking Message Central service..."
[ -f "src/services/messagecentral-otp.service.js" ] && echo "✅ Message Central service exists"

echo "Checking old Firebase service..."
[ ! -f "src/services/firebase-native-auth.service.js" ] && echo "✅ Old service deleted"

echo "Migration verification complete!"
```

---

## 📱 Device Testing Commands

```bash
# List connected devices
adb devices

# Install APK on device
adb install android/app/build/outputs/apk/debug/app-debug.apk

# View device logs
adb logcat -c  # Clear logs
adb logcat | grep -i "pulsemateconnect"

# Take screenshot
adb exec-out screencap -p > screenshot.png

# Record screen
adb shell screenrecord /sdcard/test.mp4
# Stop with Ctrl+C, then:
adb pull /sdcard/test.mp4
```

---

**All commands ready! Start with the Complete Migration Commands section.**
