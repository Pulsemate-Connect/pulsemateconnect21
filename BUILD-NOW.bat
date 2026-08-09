@echo off
echo ========================================
echo  BUILDING PULSEMATE CONNECT v1.3.7
echo  Build 83 - Production AAB
echo ========================================
echo.
echo This will take 15-20 minutes...
echo.
cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas build --platform android --profile production
echo.
echo ========================================
echo  BUILD COMPLETE!
echo ========================================
echo.
echo Next Steps:
echo 1. Download AAB from: https://expo.dev
echo 2. Upload to Play Console
echo 3. App goes live!
echo.
pause
