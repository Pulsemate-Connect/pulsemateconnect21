@echo off
echo Starting PulseMate Connect on Android...
echo.
echo Make sure you have:
echo 1. Android Studio installed
echo 2. Android device connected OR emulator running
echo.
pause

cd /d "%~dp0"
call npm run android

pause
