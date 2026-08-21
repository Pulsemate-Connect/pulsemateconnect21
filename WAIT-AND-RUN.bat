@echo off
echo ========================================
echo WAITING FOR EMULATOR AND AUTO-RUN
echo ========================================
echo.
echo This script will:
echo - Monitor for emulator to become ready
echo - Automatically run the app when detected
echo.
echo Make sure you've started the emulator in Android Studio!
echo (Tools → Device Manager → Play button)
echo.
pause

echo.
echo Monitoring for emulator...
echo Press Ctrl+C to cancel
echo.

:WAIT_LOOP
adb devices | findstr "emulator.*device" > nul
if errorlevel 1 (
    echo [%TIME%] Waiting for emulator... ^(checking every 5 seconds^)
    timeout /t 5 /nobreak > nul
    goto WAIT_LOOP
)

echo.
echo ========================================
echo ✅ EMULATOR DETECTED!
echo ========================================
echo.
adb devices
echo.
echo Starting app build...
echo This will take 5-10 minutes on first run.
echo.

npm run android

echo.
echo ========================================
echo DONE!
echo ========================================
pause
