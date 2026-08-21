@echo off
echo ========================================
echo  REBUILDING PULSEMATE CONNECT APP
echo ========================================
echo.
echo Stopping any running Metro bundler...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Cleaning build cache...
cd /d "%~dp0"
if exist android\app\build rd /s /q android\app\build
if exist android\.gradle rd /s /q android\.gradle
if exist .expo rd /s /q .expo

echo.
echo Starting fresh build...
echo This will take 3-5 minutes...
echo.
call npx expo run:android

echo.
echo ========================================
echo  BUILD COMPLETE!
echo ========================================
echo.
pause
