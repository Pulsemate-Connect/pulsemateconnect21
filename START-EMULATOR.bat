@echo off
echo ========================================
echo Starting Android Emulator
echo ========================================
echo.

REM Set Android SDK paths
set ANDROID_HOME=C:\Users\shubh\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%

echo Starting PulseMatePixel35 emulator...
echo This will open in a new window.
echo.
echo Wait for the home screen to appear (30-60 seconds)
echo Then run: npm run android in another terminal
echo.

emulator -avd PulseMatePixel35

pause
