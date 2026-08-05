@echo off
echo ============================================================
echo BUILD AAB v1.3.7 - BACKEND SMS FIX
echo ============================================================
echo.
echo This will build Android App Bundle (AAB) for Play Store
echo Version: 1.3.7 (Build 77)
echo Fix: Backend SMS authentication (no Firebase SDK issues)
echo.
echo ============================================================
echo STEP 1: Check EAS Login
echo ============================================================
echo.
echo Current EAS account:
call eas whoami
echo.
echo.
echo ============================================================
echo REQUIRED ACCOUNT
echo ============================================================
echo.
echo Project Owner: pulsemateconnecttt
echo Email: ramnathdurgadevienterprise@gmail.com
echo.
echo If you're NOT logged in as "pulsemateconnecttt", please:
echo 1. Press Ctrl+C to cancel
echo 2. Run: eas logout
echo 3. Run: eas login
echo 4. Enter: ramnathdurgadevienterprise@gmail.com
echo 5. Re-run this script
echo.
pause
echo.
echo ============================================================
echo STEP 2: Start AAB Build
echo ============================================================
echo.
echo Build Profile: production
echo Build Type: Android App Bundle (AAB)
echo Keystore: EAS managed (yKf5TaJ1Kx)
echo Expected time: 20-30 minutes
echo.
echo Starting build...
echo.
call eas build --platform android --profile production --non-interactive
if errorlevel 1 (
    echo.
    echo ============================================================
    echo BUILD FAILED!
    echo ============================================================
    echo.
    echo Common issues:
    echo 1. Wrong account logged in
    echo    Solution: eas logout, then eas login with correct account
    echo.
    echo 2. Network error
    echo    Solution: Check internet connection and try again
    echo.
    echo 3. EAS quota exceeded
    echo    Solution: Check your EAS dashboard
    echo.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo BUILD SUBMITTED SUCCESSFULLY!
echo ============================================================
echo.
echo Build is now running on EAS cloud servers.
echo Expected completion: 20-30 minutes
echo.
echo To check build status:
echo   eas build:list
echo.
echo To view in browser:
echo   https://expo.dev/accounts/pulsemateconnecttt/projects/pulsemate-app/builds
echo.
echo Once build completes:
echo   eas build:download --platform android --latest
echo.
echo ============================================================
pause
