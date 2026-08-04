@echo off
echo ========================================
echo  Starting Android Emulator
echo ========================================
echo.
echo Available Emulators:
echo   1. PulseMatePixel35
echo   2. PulseMatePixel35c
echo.
set /p choice="Choose emulator (1 or 2): "

if "%choice%"=="1" (
    echo Starting PulseMatePixel35...
    start "" "C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd PulseMatePixel35
) else if "%choice%"=="2" (
    echo Starting PulseMatePixel35c...
    start "" "C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd PulseMatePixel35c
) else (
    echo Invalid choice. Starting PulseMatePixel35 by default...
    start "" "C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd PulseMatePixel35
)

echo.
echo ========================================
echo  Emulator is starting...
echo ========================================
echo.
echo Wait 30-60 seconds for the emulator to fully boot.
echo You'll see the Android home screen when ready.
echo.
echo After the emulator boots:
echo   - Go back to the Expo terminal
echo   - Press 'a' to open your app
echo.
echo Or run: QUICK-RUN.bat if Expo isn't running
echo.
pause
