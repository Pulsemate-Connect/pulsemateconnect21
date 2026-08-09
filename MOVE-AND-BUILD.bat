@echo off
echo ========================================
echo PulseMate Connect - Move and Build
echo ========================================
echo.
echo This script will:
echo 1. Create C:\Dev folder
echo 2. Copy project to C:\Dev\pm
echo 3. Clean and reinstall dependencies
echo 4. Build the Android app
echo.
echo This will take about 10-15 minutes.
echo.
pause

echo.
echo [1/5] Creating C:\Dev folder...
mkdir C:\Dev 2>nul
echo Done.

echo.
echo [2/5] Copying project to C:\Dev\pm...
echo This may take 2-3 minutes...
xcopy "%~dp0" C:\Dev\pm /E /I /H /Y /Q
if errorlevel 1 (
    echo ERROR: Failed to copy project
    pause
    exit /b 1
)
echo Done.

echo.
echo [3/5] Navigating to new location...
cd /d C:\Dev\pm
echo Done.

echo.
echo [4/5] Cleaning and reinstalling dependencies...
echo Removing old node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo.
echo Installing dependencies (this will take 3-5 minutes)...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Done.

echo.
echo [5/5] Building Android app...
echo This will take 3-5 minutes...
echo.
call npx expo run:android
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Your app should now be running on the emulator.
echo Project location: C:\Dev\pm
echo.
echo Next steps:
echo 1. Test the OTP login flow
echo 2. Check Firebase SHA certificates
echo 3. Build production AAB for Play Store
echo.
pause
