@echo off
REM ========================================================================
REM  PulseMate Connect — AAB Build Script
REM  Builds both test and production AAB files for Android
REM ========================================================================

echo.
echo ========================================
echo   PulseMate Connect - AAB Builder
echo ========================================
echo.

REM Check if EAS CLI is installed
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npx not found. Please install Node.js first.
    pause
    exit /b 1
)

echo [1/5] Checking EAS CLI...
call npx eas-cli --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing EAS CLI...
    call npm install -g eas-cli
)

echo.
echo [2/5] Logging into EAS...
call npx eas-cli whoami
if %errorlevel% neq 0 (
    echo Please login to EAS:
    call npx eas-cli login
)

echo.
echo ========================================
echo   Choose Build Type:
echo ========================================
echo   1. Test AAB (for local testing)
echo   2. Production AAB (for Play Store)
echo   3. Both (test + production)
echo   4. APK (quick install, recommended for testing)
echo ========================================
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto build_test
if "%choice%"=="2" goto build_production
if "%choice%"=="3" goto build_both
if "%choice%"=="4" goto build_apk
echo Invalid choice!
pause
exit /b 1

:build_test
echo.
echo [3/5] Building TEST AAB...
call npx eas-cli build --platform android --profile test-aab
goto done

:build_production
echo.
echo [3/5] Building PRODUCTION AAB...
call npx eas-cli build --platform android --profile production
goto done

:build_both
echo.
echo [3/5] Building TEST AAB...
start /wait cmd /c "npx eas-cli build --platform android --profile test-aab"
echo.
echo [4/5] Building PRODUCTION AAB...
start /wait cmd /c "npx eas-cli build --platform android --profile production"
goto done

:build_apk
echo.
echo [3/5] Building APK (direct install)...
call npx eas-cli build --platform android --profile apk
goto done

:done
echo.
echo ========================================
echo   Build Started Successfully!
echo ========================================
echo.
echo Monitor progress at:
echo https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds
echo.
echo Estimated completion time: 15-20 minutes
echo.
pause
