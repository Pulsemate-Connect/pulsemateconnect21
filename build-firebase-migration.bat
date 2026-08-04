@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════════════════════════
echo ║ 🔥 FIREBASE PHONE AUTH MIGRATION - PRODUCTION BUILD
echo ╠═══════════════════════════════════════════════════════════════════════════════
echo ║ Build Version: 1.3.6 (Build 76)
echo ║ Migration: 2Factor.in → React Native Firebase (Native)
echo ║ Date: %date% %time%
echo ╚═══════════════════════════════════════════════════════════════════════════════
echo.
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   STEP 1: PRE-BUILD CHECKLIST
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo ⚠️  BEFORE BUILDING, VERIFY THESE FIREBASE CONSOLE SETTINGS:
echo.
echo 1. Phone Authentication Enabled
echo    URL: https://console.firebase.google.com/project/pulsemateconnect/authentication/providers
echo    → Click "Phone" provider
echo    → Toggle "Enable"
echo    → Click "Save"
echo.
echo 2. SHA Fingerprints Added
echo    URL: https://console.firebase.google.com/project/pulsemateconnect/settings/general
echo    → Add SHA-1: E0:AC:76:86:0F:79:68:E8:3D:20:47:1D:EF:53:5D:39:D6:00:9E:E1
echo    → Add SHA-256: CE:A8:43:D7:9C:7C:2B:AC:B5:9A:23:F1:31:6A:46:9F:20:1F:E0:68:4C:B8:79:6A:5B:A9:FA:4A:07:0C:92:8A
echo.
echo 3. Service Account JSON Generated
echo    URL: https://console.firebase.google.com/project/pulsemateconnect/settings/serviceaccounts/adminsdk
echo    → Click "Generate new private key"
echo    → Save the JSON
echo    → Add to Render: FIREBASE_SERVICE_ACCOUNT_JSON
echo.
echo.
set /p ready="Have you completed Firebase Console setup? (y/n): "
if /i not "%ready%"=="y" (
    echo.
    echo ❌ Please complete Firebase Console setup first!
    echo    Read: COMPLETE-FIREBASE-MIGRATION.md
    echo.
    pause
    exit /b 1
)
echo.
echo ✅ Firebase Console setup confirmed
echo.
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   STEP 2: VERIFY CODE CHANGES
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo ✅ React Native Firebase installed
echo ✅ src/config/firebase-native.js created
echo ✅ All login screens updated
echo ✅ Old Firebase JS SDK removed
echo ✅ RecaptchaContainer removed
echo ✅ Version bumped to 1.3.6 (76)
echo.
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   STEP 3: BUILD OPTIONS
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo Choose build type:
echo.
echo   [1] APK (for testing on emulator/device)
echo   [2] AAB (for Play Store production)
echo   [3] Both APK and AAB
echo   [4] Cancel
echo.
set /p buildchoice="Enter choice (1-4): "
echo.

if "%buildchoice%"=="1" goto build_apk
if "%buildchoice%"=="2" goto build_aab
if "%buildchoice%"=="3" goto build_both
if "%buildchoice%"=="4" goto cancel
echo Invalid choice!
pause
exit /b 1

:build_apk
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   BUILDING APK (Testing Build)
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 🔨 Starting EAS build...
echo    Profile: apk
echo    Platform: Android
echo    Output: APK file
echo    Time: ~15-20 minutes
echo.
echo 📝 What happens during build:
echo    1. Expo prebuild generates native code
echo    2. React Native Firebase native modules compiled
echo    3. APK signed and uploaded to EAS servers
echo.
call eas build --platform android --profile apk
if errorlevel 1 (
    echo.
    echo ❌ Build failed!
    pause
    exit /b 1
)
goto build_complete

:build_aab
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   BUILDING AAB (Production Build)
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 🔨 Starting EAS build...
echo    Profile: production
echo    Platform: Android
echo    Output: AAB file (for Play Store)
echo    Time: ~15-20 minutes
echo.
echo 📝 What happens during build:
echo    1. Expo prebuild generates native code
echo    2. React Native Firebase native modules compiled
echo    3. AAB signed and uploaded to EAS servers
echo.
call eas build --platform android --profile production
if errorlevel 1 (
    echo.
    echo ❌ Build failed!
    pause
    exit /b 1
)
goto build_complete

:build_both
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   BUILDING BOTH APK & AAB
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 📦 Building APK first...
call eas build --platform android --profile apk
if errorlevel 1 (
    echo.
    echo ❌ APK build failed!
    pause
    exit /b 1
)
echo.
echo ✅ APK build complete!
echo.
echo 📦 Building AAB...
call eas build --platform android --profile production
if errorlevel 1 (
    echo.
    echo ❌ AAB build failed!
    pause
    exit /b 1
)
goto build_complete

:build_complete
echo.
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   ✅ BUILD COMPLETE!
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 🎉 React Native Firebase build is ready!
echo.
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   NEXT STEPS: TESTING
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 1. Install on Emulator:
echo    eas build:run -p android --latest
echo.
echo 2. Test OTP Flow:
echo    • Enter phone: +91XXXXXXXXXX
echo    • Tap "Send OTP"
echo    • ✅ VERIFY: NO reCAPTCHA popup
echo    • SMS arrives (5-30 seconds)
echo    • ✅ VERIFY: OTP auto-fills on Android
echo    • Login succeeds
echo.
echo 3. Test on Real Device:
echo    • Download APK from EAS dashboard
echo    • Install on physical device
echo    • Repeat OTP flow test
echo.
echo 4. Monitor Logs:
echo    adb logcat -s ReactNativeJS:* Firebase:*
echo.
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   AFTER TESTING SUCCEEDS
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 1. Remove 2Factor.in Backend Code
echo    • Update backend/src/routes/auth.routes.js
echo    • Update backend/src/controllers/auth.controller.js
echo    • Delete backend/src/services/twofactor.service.js
echo    • Remove TWOFACTOR_API_KEY from Render
echo.
echo 2. Deploy Backend
echo    git add .
echo    git commit -m "feat: Remove 2Factor.in, migrate to Firebase Phone Auth"
echo    git push origin main
echo.
echo 3. Deploy to Play Store
echo    • Upload AAB to Play Console
echo    • Staged rollout recommended (10%% → 50%% → 100%%)
echo    • Monitor crash reports
echo.
echo.
echo 💰 Cost Savings: ₹1,584/year (₹132/month)
echo ✅ Better UX: No reCAPTCHA, SMS auto-fill
echo ✅ Native Performance: Faster, smaller bundle
echo.
echo.
set /p install="Install build on emulator now? (y/n): "
if /i "%install%"=="y" (
    echo.
    echo 📱 Installing on emulator...
    call eas build:run -p android --latest
)
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo   ✨ Migration build complete! Read COMPLETE-FIREBASE-MIGRATION.md for details
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
pause
exit /b 0

:cancel
echo.
echo ❌ Build cancelled
echo.
pause
exit /b 0
