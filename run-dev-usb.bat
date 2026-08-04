@echo off
echo ========================================
echo    Run Development with USB (Expo Go)
echo    (Live Reload Enabled)
echo ========================================
echo.
echo This will:
echo   1. Start Metro bundler
echo   2. Connect to your USB-attached device
echo   3. Enable live reload (code changes auto-refresh!)
echo.
echo Make sure:
echo   - Expo Go app is installed on your phone
echo   - Phone is connected via USB
echo   - USB Debugging is enabled
echo.
pause

echo.
echo Starting development server...
echo.
echo When QR code appears:
echo   1. Open Expo Go on your phone
echo   2. App will load automatically via USB
echo   3. Make code changes - they'll reload instantly!
echo.

npx expo start --android

pause
