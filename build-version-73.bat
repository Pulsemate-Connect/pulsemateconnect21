@echo off
echo ========================================
echo    Build Version 73 - Production AAB
echo ========================================
echo.
echo Version 73 is ready to build with:
echo   - Updated google-services.json
echo   - Production keystore
echo   - Firebase OTP fixes
echo.
pause

echo.
echo Step 1: Checking login status...
echo.
eas whoami

if errorlevel 1 (
    echo.
    echo You are NOT logged in!
    echo.
    echo Please login first:
    echo   1. Open a new terminal
    echo   2. Run: eas login
    echo   3. Enter your credentials
    echo   4. Run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Building production AAB (version 73)...
echo.

npx eas build --platform android --profile production

if errorlevel 1 (
    echo.
    echo ========================================
    echo    Build Failed!
    echo ========================================
    echo.
    echo Possible reasons:
    echo   1. Not logged in (run: eas login)
    echo   2. No build quota left (switch account or upgrade)
    echo   3. Network issue
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Build Successful!
echo ========================================
echo.
echo Version 73 AAB download URL shown above.
echo.
echo Next steps:
echo   1. Download the AAB file
echo   2. Upload to Play Store
echo   3. Test OTP!
echo.
pause
