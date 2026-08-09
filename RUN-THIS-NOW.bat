@echo off
REM ========================================================================
REM  QUICK BUILD — PulseMate Connect v1.3.7
REM  Choose what you want to build
REM ========================================================================

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         PulseMate Connect — Quick Build Menu              ║
echo ║                   Version 1.3.7 (Build 83)                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   What do you want to build?
echo.
echo   [1] APK — Quick Testing (Installs directly on device)
echo       ⏱️  ~15 minutes
echo       📦 Output: APK file
echo       ✅ Best for: Testing before Play Store upload
echo.
echo   [2] Production AAB — Play Store Upload
echo       ⏱️  ~15 minutes  
echo       📦 Output: AAB file
echo       ✅ Best for: Final Play Store release
echo.
echo   [3] Both — APK + Production AAB
echo       ⏱️  ~30 minutes
echo       📦 Output: APK + AAB files
echo       ✅ Best for: Complete build
echo.
echo   [4] Check Build Status (view ongoing builds)
echo.
echo   [5] Exit
echo.
echo ────────────────────────────────────────────────────────────
echo.

set /p choice="👉 Enter your choice (1-5): "

if "%choice%"=="1" goto build_apk
if "%choice%"=="2" goto build_production
if "%choice%"=="3" goto build_both
if "%choice%"=="4" goto check_status
if "%choice%"=="5" goto end
echo.
echo ❌ Invalid choice! Please enter 1-5.
timeout /t 2 >nul
goto start

:build_apk
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              Building APK for Testing...                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📦 Profile: apk
echo ⏱️  Estimated time: 15 minutes
echo 📍 Monitor: https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds
echo.
echo Starting build...
echo.
call npx eas-cli build --platform android --profile apk --non-interactive
goto show_next_steps

:build_production
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         Building Production AAB for Play Store...         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📦 Profile: production
echo ⏱️  Estimated time: 15 minutes
echo 📍 Monitor: https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds
echo.
echo Starting build...
echo.
call npx eas-cli build --platform android --profile production --non-interactive
goto show_next_steps

:build_both
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           Building Both APK + Production AAB...           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📦 Profile: apk + production
echo ⏱️  Estimated time: 30 minutes
echo 📍 Monitor: https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds
echo.
echo [1/2] Starting APK build...
echo.
call npx eas-cli build --platform android --profile apk --non-interactive
echo.
echo [2/2] Starting Production AAB build...
echo.
call npx eas-cli build --platform android --profile production --non-interactive
goto show_next_steps

:check_status
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                   Build Status Check                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
call npx eas-cli build:list --platform android --limit 5
echo.
echo ────────────────────────────────────────────────────────────
echo.
pause
goto start

:show_next_steps
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                   ✅ Build Started!                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📊 Monitor progress:
echo    https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds
echo.
echo 📥 After build completes:
echo    • Download file from EAS dashboard
echo    • Or run: npx eas-cli build:download
echo.
echo 📱 If you built APK:
echo    • Install on device: adb install pulsemate.apk
echo    • Or copy to phone and install
echo.
echo 🏪 If you built Production AAB:
echo    • Upload to Play Console
echo    • Go to: play.google.com/console
echo.
echo ⏱️  Estimated completion: 15-30 minutes from now
echo.
pause
goto end

:end
cls
echo.
echo Thanks for using PulseMate Connect Build Tool!
echo.
timeout /t 2 >nul
exit
