@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                                                                   ║
echo ║           🚀 RUNNING APP ON ANDROID DEVICE VIA USB                ║
echo ║                                                                   ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.

echo 1️⃣  Checking for connected devices...
echo.
adb devices
echo.

echo 2️⃣  Starting Expo build and run...
echo.
echo    ⏳ This will take 5-10 minutes for first build
echo    📦 Building APK...
echo    📲 Installing on device...
echo    🚀 Launching app...
echo.

npx expo run:android

pause
