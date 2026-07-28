@echo off
echo ========================================
echo Downloading Keystore from EAS
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Downloading keystore...
echo.

rem Download keystore using EAS CLI
eas credentials -p android

echo.
echo ========================================
echo Done!
echo ========================================
pause
