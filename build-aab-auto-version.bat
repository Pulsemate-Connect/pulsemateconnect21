@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    PulseMate Connect - AAB Builder
echo    (with Auto Version Increment)
echo ========================================
echo.

REM Read current version
set /p CURRENT_VERSION=<VERSION.txt
echo Current Version Code: %CURRENT_VERSION%

REM Calculate next version
set /a NEXT_VERSION=%CURRENT_VERSION%+1
echo Next Version Code: %NEXT_VERSION%

echo.
echo This will:
echo   1. Increment version from %CURRENT_VERSION% to %NEXT_VERSION%
echo   2. Update app.json and build.gradle
echo   3. Build AAB file
echo.
choice /C YN /M "Continue with version %NEXT_VERSION%"
if errorlevel 2 goto :cancel
if errorlevel 1 goto :proceed

:proceed
echo.
echo ========================================
echo    Step 1: Incrementing Version
echo ========================================

REM Update VERSION.txt
echo %NEXT_VERSION%>VERSION.txt

REM Update app.json
echo Updating app.json...
powershell -Command "(Get-Content 'app.json') -replace '\"versionCode\": %CURRENT_VERSION%,', '\"versionCode\": %NEXT_VERSION%,' | Set-Content 'app.json'"

REM Update android/app/build.gradle
echo Updating android/app/build.gradle...
powershell -Command "(Get-Content 'android\app\build.gradle') -replace 'versionCode %CURRENT_VERSION%', 'versionCode %NEXT_VERSION%' | Set-Content 'android\app\build.gradle'"

echo Version updated to %NEXT_VERSION%!
echo.

echo ========================================
echo    Step 2: Building AAB
echo ========================================
echo.

REM Build AAB
npx eas build --platform android --profile production --non-interactive

if errorlevel 1 (
    echo.
    echo ========================================
    echo    Build Failed!
    echo ========================================
    echo.
    echo Rolling back version to %CURRENT_VERSION%...
    
    REM Rollback VERSION.txt
    echo %CURRENT_VERSION%>VERSION.txt
    
    REM Rollback app.json
    powershell -Command "(Get-Content 'app.json') -replace '\"versionCode\": %NEXT_VERSION%,', '\"versionCode\": %CURRENT_VERSION%,' | Set-Content 'app.json'"
    
    REM Rollback android/app/build.gradle
    powershell -Command "(Get-Content 'android\app\build.gradle') -replace 'versionCode %NEXT_VERSION%', 'versionCode %CURRENT_VERSION%' | Set-Content 'android\app\build.gradle'"
    
    echo Version rolled back to %CURRENT_VERSION%
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Build Successful!
echo ========================================
echo Version Code: %NEXT_VERSION%
echo AAB file ready for upload!
echo ========================================
echo.

pause
exit /b 0

:cancel
echo.
echo Build cancelled.
pause
exit /b 0
