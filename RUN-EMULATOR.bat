@echo off
echo ========================================
echo Starting Android Emulator
echo ========================================
echo.

REM Check if emulator is already running
adb devices | findstr "emulator" >nul
if %errorlevel% == 0 (
    echo ✅ Emulator is already running
    echo.
) else (
    echo 📱 Starting Android emulator...
    echo.
    
    REM List available emulators
    echo Available emulators:
    emulator -list-avds
    echo.
    
    REM Start the first available emulator in the background
    echo Starting emulator (this may take 30-60 seconds)...
    start /B emulator @Pixel_5_API_30 -no-snapshot-load
    
    echo Waiting for emulator to boot...
    adb wait-for-device
    echo.
    echo ✅ Emulator is ready!
    echo.
)

echo ========================================
echo Starting Metro Bundler
echo ========================================
echo.
echo Press Ctrl+C to stop when done
echo.

REM Start Metro bundler
npm start

pause
