@echo off
color 0A
echo.
echo  ====================================================
echo    PulseMate Connect - Install Latest APK
echo  ====================================================
echo.
echo  Build: 88120141-b9db-4ac9-8af5-7d21e9c1ca5b
echo  Date:  August 2, 2026 at 3:54 PM
echo  Type:  APK (Production Build)
echo.
echo  ====================================================
echo.

:: Check if emulator is running
echo  [1/4] Checking for Android emulator...
adb devices | findstr "emulator" >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  ERROR: No emulator detected!
    echo.
    echo  Please start your Android emulator first:
    echo  1. Open Android Studio
    echo  2. Click Device Manager
    echo  3. Start any emulator
    echo  4. Wait for it to fully boot
    echo.
    echo  Then run this script again.
    echo.
    pause
    exit /b 1
)
echo  SUCCESS: Emulator detected!
echo.

:: Check if APK exists
echo  [2/4] Checking for APK file...
if not exist "C:\Users\shubh\AppData\Local\Temp\eas-cli-nodejs\eas-build-run-cache\31fca56b-a99e-4219-bb3f-600d8b0c86b7_88120141-b9db-4ac9-8af5-7d21e9c1ca5b.apk" (
    color 0C
    echo  ERROR: APK file not found!
    echo.
    echo  Downloading APK from EAS...
    cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
    eas build:download --id 88120141-b9db-4ac9-8af5-7d21e9c1ca5b
    echo.
    pause
    exit /b 1
)
echo  SUCCESS: APK file found!
echo.

:: Install APK
echo  [3/4] Installing APK on emulator...
adb install -r "C:\Users\shubh\AppData\Local\Temp\eas-cli-nodejs\eas-build-run-cache\31fca56b-a99e-4219-bb3f-600d8b0c86b7_88120141-b9db-4ac9-8af5-7d21e9c1ca5b.apk"
if errorlevel 1 (
    color 0C
    echo.
    echo  ERROR: Installation failed!
    echo.
    pause
    exit /b 1
)
echo.

:: Launch app
echo  [4/4] Launching PulseMate Connect...
adb shell monkey -p in.pulsemateconnect.patient 1
echo.

color 0A
echo  ====================================================
echo    SUCCESS! App Installed and Launched!
echo  ====================================================
echo.
echo  The app should now be open on your emulator.
echo.
echo  To monitor authentication logs, run:
echo    test-otp-flow.bat
echo.
echo  To read the testing guide, open:
echo    QUICK-START-EMULATOR.md
echo.
echo  ====================================================
echo.
pause
