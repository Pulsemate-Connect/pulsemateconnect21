@echo off
title Android Emulator - PulseMate Connect
color 0B

echo.
echo ════════════════════════════════════════════════════════
echo  Starting Android Emulator
echo ════════════════════════════════════════════════════════
echo.

REM Set Android SDK environment variables
set ANDROID_SDK_ROOT=C:\Users\shubh\AppData\Local\Android\Sdk
set ANDROID_HOME=C:\Users\shubh\AppData\Local\Android\Sdk
set PATH=%ANDROID_SDK_ROOT%\emulator;%ANDROID_SDK_ROOT%\platform-tools;%PATH%

echo Available emulators:
emulator -list-avds
echo.

echo Starting emulator: PulseMatePixel35c
echo (This will take 30-60 seconds to boot)
echo.
echo ⚠️  Keep this window open while using the emulator
echo.

REM Start emulator
emulator -avd PulseMatePixel35c -no-snapshot-load -gpu swiftshader_indirect

pause
