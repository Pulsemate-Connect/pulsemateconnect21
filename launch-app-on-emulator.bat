@echo off
echo ========================================
echo PulseMate Connect - Launch App
echo ========================================
echo.
echo Checking for connected devices...
echo.

adb devices

echo.
echo ========================================
echo INSTRUCTIONS:
echo ========================================
echo.
echo 1. If you don't see any devices above, START YOUR ANDROID EMULATOR first
echo    (Open Android Studio and start an emulator)
echo.
echo 2. Once the emulator appears in the list above, press any key to continue
echo.
pause

echo.
echo Checking for PulseMate Connect installation...
adb shell pm list packages | findstr pulse

echo.
echo ========================================
echo Launching PulseMate Connect app...
echo ========================================
echo.

adb shell monkey -p in.pulsemateconnect.patient 1

echo.
echo ========================================
echo App launched!
echo ========================================
echo.
echo The app should now be open on your emulator.
echo.
echo To monitor authentication logs, run:
echo   test-otp-flow.bat
echo.
pause
