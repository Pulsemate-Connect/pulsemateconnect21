@echo off
echo ========================================
echo    Build Development APK
echo    (USB Installable + Live Reload)
echo ========================================
echo.
echo This will build a DEVELOPMENT APK that:
echo   - Is signed with debug keystore
echo   - Supports live reload (like Expo Go)
echo   - Includes Firebase native modules
echo   - Can be installed via USB
echo.
echo Build time: ~10-15 minutes (cloud build)
echo.
choice /C YN /M "Continue with cloud build"
if errorlevel 2 goto :cancel
if errorlevel 1 goto :proceed

:proceed
echo.
echo ========================================
echo    Starting EAS Development Build
echo ========================================
echo.

npx eas build --platform android --profile development

if errorlevel 1 (
    echo.
    echo ========================================
    echo    Build Failed!
    echo ========================================
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Build Successful!
echo ========================================
echo.
echo Next steps:
echo   1. Download APK from the URL above
echo   2. Run: .\install-dev-apk.bat
echo   3. Start Metro: npx expo start --dev-client
echo   4. Test OTP on your phone!
echo.
pause
exit /b 0

:cancel
echo.
echo Build cancelled.
pause
exit /b 0
