@echo off
echo ================================================
echo   PulseMate Connect - Run on Working Device
echo ================================================
echo.

cd /d "%~dp0"

echo Step 1: Checking connected devices...
echo.
adb devices
echo.

for /f "skip=1 tokens=1,2" %%A in ('adb devices') do (
    if "%%B"=="device" (
        set DEVICE_COUNT=1
    )
)

echo Step 2: Device Status Check
echo.

adb devices | find /c "device" > temp_count.txt
set /p DEVICE_COUNT=<temp_count.txt
del temp_count.txt

if %DEVICE_COUNT% LSS 2 (
    echo [ERROR] No device connected!
    echo.
    echo Please:
    echo 1. Connect your working Android device via USB
    echo 2. Enable USB Debugging on the device
    echo 3. Accept the USB debugging prompt on your phone
    echo.
    pause
    exit /b 1
)

if %DEVICE_COUNT% GTR 2 (
    echo [WARNING] Multiple devices detected!
    echo.
    adb devices
    echo.
    echo Please disconnect the NON-WORKING device and keep only the working one.
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] One device connected - assuming this is the working device!
echo.

echo Step 3: Checking if Metro bundler is running...
echo.

tasklist /FI "WINDOWTITLE eq npm start" /FO CSV | find /I "node.exe" > nul

if errorlevel 1 (
    echo [INFO] Metro bundler not running. Starting it now...
    echo.
    start "Metro Bundler" cmd /k "cd /d %~dp0 && npm start"
    echo.
    echo Waiting 15 seconds for Metro to start...
    timeout /t 15 /nobreak > nul
) else (
    echo [INFO] Metro bundler is already running!
)

echo.
echo Step 4: Setting up port forwarding...
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000
echo [SUCCESS] Ports forwarded!

echo.
echo Step 5: Building and installing app...
echo.
echo This may take 3-5 minutes on first build...
echo.

npm run android

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Trying alternative method: Installing existing APK...
    echo.
    
    if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
        adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
        
        if errorlevel 1 (
            echo [ERROR] Installation failed!
        ) else (
            echo [SUCCESS] App installed!
            echo.
            echo Now launching the app on your device...
            adb shell am start -n in.pulsemateconnect.patient/.MainActivity
        )
    ) else (
        echo [ERROR] No APK found. Please build first with:
        echo   cd android
        echo   gradlew assembleDebug
    )
) else (
    echo.
    echo [SUCCESS] App built and installed!
    echo.
    echo The app should now be running on your working device.
)

echo.
echo ================================================
echo                 DONE!
echo ================================================
echo.
echo If the app doesn't load:
echo 1. Make sure Metro bundler is running (check the other window)
echo 2. Shake your device and tap "Reload"
echo 3. Check if backend is running on port 5000
echo.

pause
