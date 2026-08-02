@echo off
REM ============================================================================
REM Firebase Production Log Capture Tool
REM ============================================================================
REM Captures comprehensive Firebase Phone Authentication logs from Android device
REM Includes: Firebase errors, Auth flow, OTP verification, Backend communication
REM 
REM Requirements:
REM   - Android device with USB debugging enabled
REM   - USB cable connected to computer
REM   - Android Debug Bridge (adb) installed and in PATH
REM 
REM Usage:
REM   1. Connect Android phone via USB
REM   2. Run this script: capture-firebase-logs.bat
REM   3. Reproduce the authentication issue in the app
REM   4. Press Ctrl+C to stop capture
REM   5. Log file will open automatically
REM ============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════════
echo ║ Firebase Production Log Capture Tool
echo ║ PulseMate Connect - Phone Authentication Debugging
echo ╚═══════════════════════════════════════════════════════════════════════════════
echo.

REM Check if adb is available
where adb >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ❌ adb command not found!
    echo.
    echo Android Debug Bridge (adb) is required to capture device logs.
    echo.
    echo Install Options:
    echo   1. Android Studio: Includes adb in SDK Platform Tools
    echo      Default path: C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools
    echo.
    echo   2. Standalone Platform Tools:
    echo      Download from: https://developer.android.com/tools/releases/platform-tools
    echo.
    echo After installation, add to PATH or run from platform-tools folder.
    echo.
    pause
    exit /b 1
)

echo [1/6] ✅ adb found
echo.

echo [2/6] 🔍 Checking connected Android devices...
echo.
adb devices
echo.

echo [3/6] ⏳ Waiting for device connection...
adb wait-for-device
echo ✅ Device detected and connected!
echo.

echo [4/6] 🧹 Clearing old logs from device buffer...
adb logcat -c
echo ✅ Log buffer cleared
echo.

REM Create filename with timestamp
set LOGFILE=firebase_auth_logs_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt
set LOGFILE=%LOGFILE: =0%

echo [5/6] 📝 Starting comprehensive log capture...
echo.
echo ╔═══════════════════════════════════════════════════════════════════════════════
echo ║ INSTRUCTIONS - Please follow these steps:
echo ╠═══════════════════════════════════════════════════════════════════════════════
echo ║ 1. Open PulseMate Connect app on your Android phone
echo ║ 2. Go to login screen
echo ║ 3. Enter your 10-digit mobile number
echo ║ 4. Tap "Send OTP" button
echo ║ 5. Wait for OTP SMS to arrive
echo ║ 6. Enter the 6-digit OTP code
echo ║ 7. Tap "Verify" button
echo ║ 8. Wait for result (success or error)
echo ║ 9. Press Ctrl+C in THIS window to stop capture
echo ╚═══════════════════════════════════════════════════════════════════════════════
echo.
echo 💾 Log file: %LOGFILE%
echo.
echo 🎯 Capturing ALL Firebase-related logs...
echo    - Firebase initialization
echo    - Phone authentication flow  
echo    - OTP send/verify operations
echo    - Backend API communication
echo    - All errors with full details
echo.
echo ⏸️  Press Ctrl+C when you're done to stop capture and save logs
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Capture comprehensive logs
REM ReactNativeJS:V = All React Native console logs (Verbose)
REM chromium:V = Web/Firebase SDK logs (Verbose)
REM *:E = All other errors (Error level only)
adb logcat -v time ReactNativeJS:V chromium:V *:E > "%LOGFILE%"

echo.
echo [6/6] ✅ Log capture stopped
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 💾 Logs successfully saved to:
echo    %LOGFILE%
echo.
echo 📊 Log file contains:
echo    ✓ Firebase initialization details
echo    ✓ Environment information (Expo Go / Dev Build / Play Store)
echo    ✓ Package name and platform details
echo    ✓ Complete OTP flow with timestamps
echo    ✓ All errors with error codes, messages, and stack traces
echo    ✓ Backend authentication attempts
echo.
echo 🔍 Search the log file for:
echo    - "FIREBASE ERROR" = All Firebase errors
echo    - "SEND OTP" = OTP sending operations
echo    - "VERIFY OTP" = OTP verification operations
echo    - "auth/" = Firebase authentication error codes
echo    - "Environment: PLAY_STORE" = Production build logs
echo.
echo 📂 Opening log file in Notepad...
echo.

REM Open the log file
notepad "%LOGFILE%"

echo.
echo ✅ Complete! You can now analyze the logs.
echo.
echo 📚 For log analysis help, see: FIREBASE_LOGGING_GUIDE.md
echo.
pause
