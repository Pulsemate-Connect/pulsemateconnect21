@echo off
echo ========================================
echo Installing LATEST Fixed Build
echo ========================================
echo.
echo Build: 775c8ce7-9c69-4807-8f76-201a494627f5
echo Fix: Added @react-native-firebase/auth plugin
echo.
echo Downloading from EAS...
eas build:download --id 775c8ce7-9c69-4807-8f76-201a494627f5 --output=latest-fixed.apk
echo.
echo Installing on device...
adb install -r latest-fixed.apk
echo.
echo Launching app...
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
echo.
echo ========================================
echo Installation Complete!
echo ========================================
pause
