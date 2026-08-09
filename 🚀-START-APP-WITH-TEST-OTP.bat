@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Start PulseMate App with Test OTP
REM ═══════════════════════════════════════════════════════════════════════════

title PulseMate - Start App with Test OTP

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     PulseMate Connect - Launch with Test OTP Enabled         ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo This will:
echo   1. Start Android emulator (PulseMatePixel35c)
echo   2. Start Metro bundler
echo   3. Install and launch app
echo.
echo Backend: Production Render (https://api.pulsemateconnect.in)
echo Test OTP: Configured on Render (your test numbers)
echo.
echo Press any key to continue...
pause >nul

echo.
echo [1/3] Starting Android emulator...
start "Android Emulator" cmd /k "emulator -avd PulseMatePixel35c"
echo Waiting for emulator to boot (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo [2/3] Starting Metro bundler...
start "Metro Bundler" cmd /k "npx expo start"
echo Waiting for Metro to initialize (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo [3/3] Building and installing app...
echo This will take 1-2 minutes...
echo.
npx expo run:android

echo.
echo ═══════════════════════════════════════════════════════════════
echo.
if %errorlevel% == 0 (
    echo ✅ App launched successfully!
    echo.
    echo 🧪 TEST OTP READY:
    echo    • Enter your test number from Render config
    echo    • Use your test OTP from Render (TEST_OTP_CODE)
    echo    • Login instantly without SMS!
    echo.
    echo The app is running on emulator and connected to:
    echo https://api.pulsemateconnect.in
) else (
    echo ❌ Failed to launch app
    echo Check the errors above.
)
echo.
echo Press any key to exit...
pause >nul
