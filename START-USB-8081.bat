@echo off
echo Starting Expo on port 8081 for USB connection...
echo.
echo Make sure:
echo 1. Your Android device is connected via USB
echo 2. USB debugging is enabled
echo 3. You have authorized this computer on your device
echo.
cd pulsemateconnect21
set REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1
npx expo start --port 8081 --android --localhost
