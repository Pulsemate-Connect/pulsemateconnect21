@echo off
echo ========================================
echo  BUILD PULSEMATE CONNECT - PHYSICAL PHONE
echo ========================================
echo.
echo BEFORE YOU START:
echo 1. Enable USB Debugging on your phone
echo 2. Connect phone to computer via USB
echo 3. Allow USB debugging when prompted on phone
echo.
pause

echo.
echo Checking for connected devices...
adb devices
echo.
echo If your device is listed above, press any key to continue.
echo If not, check USB connection and enable USB debugging.
pause

echo.
echo Starting build for physical device...
echo This will take 3-5 minutes.
echo.
cd /d "%~dp0"
call npx expo run:android --device

echo.
echo ========================================
echo  BUILD COMPLETE!
echo ========================================
echo.
echo The app should now be installed on your phone.
echo.
echo TEST STEPS:
echo 1. Open PulseMate Connect on your phone
echo 2. Go to Profile tab (bottom right)
echo 3. Click "Edit Profile" button
echo 4. You should see ProfileWizard with 6 steps!
echo.
pause
