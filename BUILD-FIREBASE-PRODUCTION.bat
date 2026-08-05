@echo off
echo ============================================================
echo BUILD PRODUCTION FIREBASE PHONE AUTH AAB
echo ============================================================
echo.
echo This will:
echo 1. Install React Native Firebase (Native modules)
echo 2. Prebuild Android with Firebase integration
echo 3. Build production AAB with Firebase Phone Auth
echo.
echo Expected time: 30-40 minutes
echo.
pause
echo.
echo ============================================================
echo STEP 1: Install React Native Firebase
echo ============================================================
echo.
call npm install @react-native-firebase/app@21.3.0 @react-native-firebase/auth@21.3.0
if errorlevel 1 (
    echo.
    echo ============================================================
    echo INSTALLATION FAILED!
    echo ============================================================
    echo.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo STEP 2: Prebuild Android (Integrate Firebase)
echo ============================================================
echo.
echo This will:
echo - Generate Android native code
echo - Link React Native Firebase modules
echo - Configure Firebase in build.gradle
echo.
call npx expo prebuild --platform android --clean
if errorlevel 1 (
    echo.
    echo ============================================================
    echo PREBUILD FAILED!
    echo ============================================================
    echo.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo STEP 3: Build Production AAB
echo ============================================================
echo.
echo Starting EAS build...
echo Expected time: 20-30 minutes
echo.
call eas build --platform android --profile production --non-interactive
if errorlevel 1 (
    echo.
    echo ============================================================
    echo BUILD FAILED!
    echo ============================================================
    echo.
    echo Check the error above.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo SUCCESS! AAB BUILT
echo ============================================================
echo.
echo Your production AAB with Firebase Phone Auth is ready!
echo.
echo To download:
echo   eas build:download --platform android --latest
echo.
echo To view in browser:
echo   https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds
echo.
echo ============================================================
echo IMPORTANT: Configure Firebase Console
echo ============================================================
echo.
echo 1. Enable Phone Authentication:
echo    https://console.firebase.google.com/project/pulsemateconnect/authentication/providers
echo.
echo 2. Add SHA-256 fingerprint:
echo    https://console.firebase.google.com/project/pulsemateconnect/settings/general
echo    83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
echo.
echo ============================================================
pause
