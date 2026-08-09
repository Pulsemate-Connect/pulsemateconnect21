@echo off
echo ========================================
echo EAS Build with Keystore Verification
echo ========================================
echo.
echo This script will:
echo 1. Start the EAS build
echo 2. Show which keystore is being used
echo 3. Let you cancel if wrong keystore
echo.
echo EXPECTED OUTPUT:
echo "Using Keystore from configuration: Build Credentials yKf5TaJ1Kx"
echo.
echo If you see different keystore ID, press Ctrl+C to cancel!
echo.
pause
echo.
echo Starting build...
echo.
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas build --platform android --profile production --clear-cache
