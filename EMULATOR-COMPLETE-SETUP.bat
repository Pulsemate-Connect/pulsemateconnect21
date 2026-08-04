@echo off
setlocal enabledelayedexpansion

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║        PulseMate Connect - Complete Emulator Setup           ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM ═══════════════════════════════════════════════════════════════
REM STEP 1: Check Android SDK
REM ═══════════════════════════════════════════════════════════════
echo [STEP 1/6] Checking Android SDK...
echo.

REM Check for ANDROID_HOME
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
        echo Found Android SDK at: !ANDROID_HOME!
    ) else (
        echo ERROR: ANDROID_HOME not set and SDK not found
        echo.
        echo Please install Android Studio from:
        echo https://developer.android.com/studio
        echo.
        pause
        exit /b 1
    )
) else (
    echo Android SDK: %ANDROID_HOME%
)

REM Add SDK tools to PATH temporarily
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%PATH%"

REM ═══════════════════════════════════════════════════════════════
REM STEP 2: Check ADB
REM ═══════════════════════════════════════════════════════════════
echo.
echo [STEP 2/6] Checking ADB...
where adb >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: ADB not found
    echo Please install Android SDK Platform Tools
    pause
    exit /b 1
)
echo ✓ ADB found
echo.

REM ═══════════════════════════════════════════════════════════════
REM STEP 3: List Available Emulators
REM ═══════════════════════════════════════════════════════════════
echo [STEP 3/6] Checking for available emulators...
echo.

emulator -list-avds > emulator-list.txt 2>&1
set /a count=0
set avd_found=0

echo Available Emulators:
echo ────────────────────
for /f "delims=" %%i in (emulator-list.txt) do (
    set /a count+=1
    echo   [!count!] %%i
    if !count! equ 1 set "first_avd=%%i"
    set avd_found=1
)
del emulator-list.txt

if %avd_found% equ 0 (
    echo.
    echo WARNING: No emulators found!
    echo.
    echo To create an emulator:
    echo   1. Open Android Studio
    echo   2. Go to: Tools ^> Device Manager
    echo   3. Click "Create Device"
    echo   4. Select a device (e.g., Pixel 5)
    echo   5. Select a system image (Android 13+ recommended)
    echo   6. Click Finish
    echo.
    pause
    exit /b 1
)

echo.

REM ═══════════════════════════════════════════════════════════════
REM STEP 4: Check if Emulator is Running
REM ═══════════════════════════════════════════════════════════════
echo [STEP 4/6] Checking if emulator is already running...
echo.

adb devices | findstr "emulator" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Emulator is already running
    set emulator_running=1
) else (
    echo Emulator is not running
    set emulator_running=0
    
    echo.
    echo Starting emulator: %first_avd%
    echo This may take 1-2 minutes...
    echo.
    
    REM Start emulator in background
    start "Android Emulator" cmd /c "emulator -avd %first_avd%"
    
    echo Waiting for emulator to boot...
    timeout /t 10 /nobreak >nul
    
    REM Wait for device to be ready
    :wait_for_device
    adb wait-for-device
    echo Device detected, waiting for boot to complete...
    timeout /t 5 /nobreak >nul
    
    REM Check if boot is complete
    adb shell getprop sys.boot_completed 2>nul | findstr "1" >nul
    if %errorlevel% neq 0 (
        echo Still booting...
        timeout /t 5 /nobreak >nul
        goto wait_for_device
    )
    
    echo ✓ Emulator is ready!
)

echo.

REM ═══════════════════════════════════════════════════════════════
REM STEP 5: Find and Install APK
REM ═══════════════════════════════════════════════════════════════
echo [STEP 5/6] Looking for APK file...
echo.

if exist "pulsemateconnect-v1.3.4-71-rnfirebase.apk" (
    set "APK_FILE=pulsemateconnect-v1.3.4-71-rnfirebase.apk"
) else if exist "pulsemate-latest.apk" (
    set "APK_FILE=pulsemate-latest.apk"
) else (
    echo ERROR: No APK file found!
    echo.
    echo Please build an APK first using one of:
    echo   - INSTALL-NOW.bat
    echo   - build-dev-apk.bat
    echo.
    pause
    exit /b 1
)

echo Found: %APK_FILE%
echo.
echo Installing on emulator...

REM Try to uninstall old version first
adb uninstall in.pulsemateconnect.patient >nul 2>&1

REM Install the APK
adb install -r "%APK_FILE%"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Installation failed!
    echo.
    echo Troubleshooting:
    echo   1. Check if emulator has enough storage
    echo   2. Try: adb uninstall in.pulsemateconnect.patient
    echo   3. Restart emulator
    echo.
    pause
    exit /b 1
)

echo ✓ Installation successful!
echo.

REM ═══════════════════════════════════════════════════════════════
REM STEP 6: Launch App
REM ═══════════════════════════════════════════════════════════════
echo [STEP 6/6] Launching PulseMate Connect...
echo.

adb shell am start -n in.pulsemateconnect.patient/.MainActivity

if %errorlevel% equ 0 (
    echo ✓ App launched successfully!
) else (
    echo WARNING: Failed to launch app
    echo Please launch manually from emulator home screen
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    SETUP COMPLETE!                            ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo App is now running on the emulator!
echo.
echo ──────────────────────────────────────────────────────────────
echo Useful Commands:
echo ──────────────────────────────────────────────────────────────
echo   View React Native logs:
echo     adb logcat -s ReactNativeJS:V
echo.
echo   View all logs:
echo     adb logcat
echo.
echo   Clear app data:
echo     adb shell pm clear in.pulsemateconnect.patient
echo.
echo   Restart app:
echo     adb shell am start -n in.pulsemateconnect.patient/.MainActivity
echo.
echo   Uninstall app:
echo     adb uninstall in.pulsemateconnect.patient
echo.
echo   Take screenshot:
echo     adb exec-out screencap -p ^> screenshot.png
echo.
echo ──────────────────────────────────────────────────────────────
echo.
echo Press any key to view live logs...
pause >nul

echo.
echo Starting log viewer (Press Ctrl+C to stop)...
echo ══════════════════════════════════════════════════════════════
adb logcat -s ReactNativeJS:V ReactNative:V AndroidRuntime:E
