# 📝 Firebase Phone Auth - Commands Reference

Quick reference for all commands needed during migration and testing.

---

## 🔍 Verification Commands

### Check Firebase SDK Installation
```bash
npm list firebase
# Should show: firebase@10.14.1 or higher
```

### Check Backend Firebase Admin
```bash
cd backend
npm list firebase-admin
# Should show: firebase-admin@13.0.2 or higher
cd ..
```

### Run Verification Script
```bash
verify-firebase-setup.bat
# Checks all files and configurations
```

---

## 🚀 Development Commands

### Start Development Server
```bash
# Start Expo
npm start

# Start with cache clear
npm start --clear

# Start Android directly
npm run android
```

### Check Logs
```bash
# Android logs (React Native only)
adb logcat -s ReactNativeJS:V

# All Android logs
adb logcat

# Filter Firebase logs
adb logcat -s ReactNativeJS:V | findstr "Firebase"

# Filter error logs
adb logcat -s ReactNativeJS:V | findstr "ERROR"
```

### Clear Cache
```bash
# Clear Metro bundler cache
npm start -- --reset-cache

# Clear Expo cache
npx expo start -c

# Clear Android build
cd android
.\gradlew clean
cd ..
```

---

## 📦 Build Commands

### EAS Build Commands
```bash
# Login to EAS
eas login

# Check build status
eas build:list

# Build for Android (Production)
eas build --platform android --profile production

# Build for Android (Preview)
eas build --platform android --profile preview

# Build for Android (Development)
eas build --platform android --profile development

# Check build configuration
eas build:configure
```

### Run Build on Emulator
```bash
# Install latest build on emulator
eas build:run -p android --latest

# Install specific build
eas build:run -p android --id BUILD_ID
```

---

## 🧪 Testing Commands

### Emulator Management
```bash
# List emulators
emulator -list-avds

# Start emulator (adjust name)
emulator -avd PulseMatePixel35c

# Check connected devices
adb devices
```

### Install APK Manually
```bash
# Install APK
adb install path\to\app.apk

# Install with replace
adb install -r path\to\app.apk

# Uninstall app
adb uninstall in.pulsemateconnect.patient
```

---

## 🔧 Backend Commands

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Check logs
npm run logs
```

### Check Backend Health
```bash
# Test backend connection
curl https://api.pulsemateconnect.in/api/health

# Test Firebase endpoint (will fail without token, but checks if route exists)
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/firebase-phone-login
```

---

## 🐛 Debugging Commands

### React Native Debugging
```bash
# Open Chrome DevTools
# Press Ctrl+M in emulator → Debug JS Remotely

# Reload app
# Press R R (double R) in Metro console

# Open Developer Menu in Emulator
adb shell input keyevent 82
```

### Check App Version
```bash
# Check version in app.json
type app.json | findstr "version"

# Check build number
type app.json | findstr "buildNumber"
```

### Network Debugging
```bash
# Check if backend is reachable
ping api.pulsemateconnect.in

# Test HTTPS connection
curl -I https://api.pulsemateconnect.in

# Check DNS resolution
nslookup api.pulsemateconnect.in
```

---

## 📊 Firebase Console Commands (CLI)

### Firebase CLI Setup (Optional)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# List projects
firebase projects:list

# Select project
firebase use pulsemateconnect

# Get project info
firebase projects:list
```

---

## 🔄 Git Commands

### Commit Changes
```bash
# Stage all changes
git add .

# Commit with message
git commit -m "feat: Migrate to Firebase Phone Authentication

- Add firebase-auth.js with complete Firebase Phone Auth
- Add RecaptchaContainer for reCAPTCHA support
- Update all login screens to use Firebase
- Fix backend endpoint path
- Add migration documentation"

# Push to remote
git push origin main
```

### Create Feature Branch
```bash
# Create and switch to new branch
git checkout -b feature/firebase-phone-auth

# Push branch
git push -u origin feature/firebase-phone-auth
```

---

## 📱 Production Deployment

### Deploy Backend to Render
```bash
# Render auto-deploys on git push
git push origin main

# Or trigger manual deploy in Render Dashboard
# Dashboard → Your Service → Manual Deploy
```

### Submit to Play Store
```bash
# Build production AAB
eas build --platform android --profile production --auto-submit

# Or build without auto-submit
eas build --platform android --profile production

# Then upload manually to Play Console
```

---

## 🔍 Monitoring Commands

### Check App Logs
```bash
# Real-time Android logs
adb logcat -s ReactNativeJS:V

# Save logs to file
adb logcat -s ReactNativeJS:V > logs.txt

# Filter by component
adb logcat -s ReactNativeJS:V | findstr "LoginScreen"
adb logcat -s ReactNativeJS:V | findstr "Firebase"
adb logcat -s ReactNativeJS:V | findstr "OTP"
```

### Backend Logs (Render)
```bash
# In Render Dashboard:
# Your Service → Logs tab → Enable live tail

# Or use Render CLI (if installed)
render logs --service your-service-name --tail
```

---

## 🧹 Cleanup Commands

### Clear Node Modules
```bash
# Frontend
rmdir /s /q node_modules
npm install

# Backend
cd backend
rmdir /s /q node_modules
npm install
cd ..
```

### Clear Build Cache
```bash
# Clear Metro bundler
rmdir /s /q .metro

# Clear Expo cache
npx expo start -c

# Clear Gradle cache
cd android
.\gradlew clean
rmdir /s /q .gradle
cd ..
```

### Reset App Data
```bash
# Clear app data on device
adb shell pm clear in.pulsemateconnect.patient

# Uninstall and reinstall
adb uninstall in.pulsemateconnect.patient
adb install path\to\app.apk
```

---

## 🎯 Quick Testing Flow

```bash
# 1. Verify setup
verify-firebase-setup.bat

# 2. Start development
npm start

# 3. Open logs in another terminal
adb logcat -s ReactNativeJS:V

# 4. Test in emulator
# - Enter phone number
# - Send OTP
# - Check logs for success messages
# - Verify OTP
# - Check login successful
```

---

## 🚨 Emergency Commands

### Kill Stuck Processes
```bash
# Kill Metro bundler
taskkill /F /IM node.exe

# Kill ADB server
adb kill-server
adb start-server

# Kill emulator
taskkill /F /IM qemu-system-x86_64.exe
```

### Reset Everything
```bash
# Nuclear option - reset everything
npm start -- --reset-cache
rmdir /s /q node_modules
rmdir /s /q .expo
npm install
npm start
```

---

## 📋 Environment Variables

### Check Current Environment
```bash
# Development
echo %NODE_ENV%

# Check if dev mode
# Look for __DEV__ = true in logs
```

### Set Environment (if needed)
```bash
# Set development mode
set NODE_ENV=development

# Set production mode
set NODE_ENV=production
```

---

## 🔗 Useful URLs

```bash
# Open Firebase Console
start https://console.firebase.google.com/project/pulsemateconnect

# Open Render Dashboard
start https://dashboard.render.com

# Open Play Console
start https://play.google.com/console

# Open Expo Dashboard
start https://expo.dev

# Open Backend API
start https://api.pulsemateconnect.in
```

---

## 📞 Quick Diagnostics

### Full Diagnostic Run
```bash
# Run all checks in sequence
echo Checking dependencies...
npm list firebase
cd backend && npm list firebase-admin && cd ..

echo.
echo Checking configuration files...
dir src\config\firebase-auth.js
dir src\components\RecaptchaContainer.jsx
dir backend\src\config\firebase.js

echo.
echo Checking device...
adb devices

echo.
echo Starting app...
npm start
```

---

## 💡 Pro Tips

### Create Aliases (Optional)
Add these to a `shortcuts.bat` file:

```batch
@echo off
:: Quick aliases for common commands

if "%1"=="start" npm start
if "%1"=="logs" adb logcat -s ReactNativeJS:V
if "%1"=="build" eas build --platform android --profile production
if "%1"=="test" verify-firebase-setup.bat
if "%1"=="clean" (
    npm start -- --reset-cache
    echo Cache cleared
)
```

Usage:
```bash
shortcuts.bat start
shortcuts.bat logs
shortcuts.bat build
```

---

**Last Updated:** August 4, 2026  
**Version:** 1.0  
**Purpose:** Quick command reference for Firebase Phone Auth migration
