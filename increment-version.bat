@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Version Increment Script
echo ========================================
echo.

REM Read current version
set /p CURRENT_VERSION=<VERSION.txt
echo Current Version Code: %CURRENT_VERSION%

REM Calculate next version
set /a NEXT_VERSION=%CURRENT_VERSION%+1
echo Next Version Code: %NEXT_VERSION%

REM Update VERSION.txt
echo %NEXT_VERSION%>VERSION.txt

REM Update app.json
echo Updating app.json...
powershell -Command "(Get-Content 'app.json') -replace '\"versionCode\": %CURRENT_VERSION%,', '\"versionCode\": %NEXT_VERSION%,' | Set-Content 'app.json'"

REM Update android/app/build.gradle
echo Updating android/app/build.gradle...
powershell -Command "(Get-Content 'android\app\build.gradle') -replace 'versionCode %CURRENT_VERSION%', 'versionCode %NEXT_VERSION%' | Set-Content 'android\app\build.gradle'"

echo.
echo ========================================
echo    Version Updated Successfully!
echo ========================================
echo Old Version: %CURRENT_VERSION%
echo New Version: %NEXT_VERSION%
echo.
echo Files Updated:
echo   - VERSION.txt
echo   - app.json
echo   - android/app/build.gradle
echo ========================================

pause
