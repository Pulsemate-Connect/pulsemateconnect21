@echo off
title Starting Android Emulator
color 0B

echo.
echo ════════════════════════════════════════════════════════
echo  Starting Android Emulator: PulseMatePixel35
echo ════════════════════════════════════════════════════════
echo.

echo Starting emulator (this will take 30-60 seconds)...
echo.
echo ⚠️  DO NOT CLOSE THIS WINDOW
echo    Keep it open while using the emulator
echo.

REM Start emulator with better compatibility settings
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe @PulseMatePixel35 -no-snapshot-load -gpu swiftshader_indirect

pause
