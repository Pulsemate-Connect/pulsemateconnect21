@echo off
echo ========================================
echo PULSEMATE - FIX AND RUN
echo ========================================
echo.

echo This script will:
echo 1. Guide you to start emulator via Android Studio
echo 2. Wait for emulator to be ready
echo 3. Run the app automatically
echo.
pause

echo.
echo ========================================
echo STEP 1: START EMULATOR
echo ========================================
echo.
echo Please do the following:
echo 1. Open Android Studio (if not already open)
echo 2. Click: Tools -^> Device Manager
echo 3. Find "PulseMatePixel35" in the list
echo 4. Click the Play button (triangle icon)
echo 5. Wait for Android home screen to appear
echo.
echo ⏳ Waiting for you to start the emulator...
echo.
pause

echo.
echo ========================================
echo STEP 2: CHECKING FOR EMULATOR
echo ========================================
echo.

:CHECK_DEVICE
adb devices
echo.
echo If you see "emulator-5554    device" above, press any key.
echo If NOT, start the emulator in Android Studio first!
echo.
pause

echo.
echo Checking device status...
adb devices | findstr "device" > nul
if errorlevel 1 (
    echo.
    echo ❌ No device detected!
    echo Please make sure emulator is fully booted.
    echo.
    goto CHECK_DEVICE
) else (
    echo.
    echo ✅ Device detected!
    echo.
)

echo ========================================
echo STEP 3: BUILDING AND RUNNING APP
echo ========================================
echo.
echo Starting build process...
echo This will take 5-10 minutes on first run.
echo Please be patient!
echo.

npm run android

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo The app should now be running on your emulator.
echo.
echo Login with:
echo   Mobile: 9999999999
echo   OTP:    123456
echo.
pause
