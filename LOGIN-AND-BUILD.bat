@echo off
echo ============================================================
echo EAS LOGIN AND BUILD AAB v1.3.7
echo ============================================================
echo.
echo STEP 1: EAS Login
echo ============================================================
echo.
echo You will be prompted to login to EAS.
echo.
echo IMPORTANT - Use these credentials:
echo   Email: ramnathdurgadevienterprise@gmail.com
echo   Password: [Your password]
echo.
echo After entering your password, this script will continue
echo automatically with the AAB build.
echo.
pause
echo.
echo Starting EAS login...
echo.
call eas login
if errorlevel 1 (
    echo.
    echo ============================================================
    echo LOGIN FAILED!
    echo ============================================================
    echo.
    echo Please check your credentials and try again.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo VERIFYING LOGIN
echo ============================================================
echo.
call eas whoami
echo.
echo.
echo ============================================================
echo STEP 2: Build AAB
echo ============================================================
echo.
echo Starting production AAB build...
echo Version: 1.3.7 (Build 77)
echo Expected time: 20-30 minutes
echo.
pause
echo.
call eas build --platform android --profile production --non-interactive
if errorlevel 1 (
    echo.
    echo ============================================================
    echo BUILD FAILED!
    echo ============================================================
    echo.
    echo Check the error message above.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo BUILD SUBMITTED SUCCESSFULLY!
echo ============================================================
echo.
echo Your AAB is now building on EAS cloud servers.
echo Expected completion: 20-30 minutes
echo.
echo To check status:
echo   eas build:list
echo.
echo To download when ready:
echo   eas build:download --platform android --latest
echo.
echo View in browser:
echo   https://expo.dev/accounts/pulsemateconnecttt/projects/pulsemate-app/builds
echo.
echo ============================================================
pause
