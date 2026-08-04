@echo off
echo ========================================
echo PulseMate Connect - Install Latest APK
echo ========================================
echo.
echo Build ID: 88120141-b9db-4ac9-8af5-7d21e9c1ca5b
echo Build Date: August 2, 2026 3:54 PM
echo Build Type: APK (Production)
echo.
echo ========================================
echo STEP 1: Checking for Android Emulator
echo ========================================
echo.

adb devices

echo.
echo ========================================
echo IMPORTANT: Start Your Android Emulator Now!
echo ========================================
echo.
echo If you don't see any devices above:
echo 1. Open Android Studio
echo 2. Click Device Manager (phone icon)
echo 3. Click the play button on any emulator
echo 4. Wait for the emulator to fully boot
echo.
echo Once the emulator is running, press any key to continue...
pause

echo.
echo ========================================
echo STEP 2: Downloading Latest APK Build
echo ========================================
echo.

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

echo Downloading APK from EAS...
eas build:download --id 88120141-b9db-4ac9-8af5-7d21e9c1ca5b

echo.
echo ========================================
echo STEP 3: Installing APK on Emulator
echo ========================================
echo.

echo Checking for APK file...
if exist "C:\Users\shubh\AppData\Local\Temp\eas-cli-nodejs\eas-build-run-cache\*88120141*.apk" (
    echo Found APK file!
    echo Installing...
    adb install "C:\Users\shubh\AppData\Local\Temp\eas-cli-nodejs\eas-build-run-cache\31fca56b-a99e-4219-bb3f-600d8b0c86b7_88120141-b9db-4ac9-8af5-7d21e9c1ca5b.apk"
    
    echo.
    echo ========================================
    echo STEP 4: Launching App
    echo ========================================
    echo.
    
    adb shell monkey -p in.pulsemateconnect.patient 1
    
    echo.
    echo ========================================
    echo SUCCESS! App Installed and Launched
    echo ========================================
    echo.
    echo The app should now be open on your emulator.
    echo.
    echo To monitor authentication logs, run:
    echo   test-otp-flow.bat
    echo.
) else (
    echo.
    echo ERROR: APK file not found after download.
    echo Please check the download manually.
    echo.
)

pause
