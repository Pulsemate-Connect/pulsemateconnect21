@echo off
cls
echo ========================================
echo PulseMate Connect - Check and Install
echo ========================================
echo.

set "PATH=C:\Users\shubh\AppData\Local\Android\Sdk\platform-tools;%PATH%"

echo Checking emulator status...
echo.

adb devices

echo.
echo ========================================
echo.
echo Is the emulator showing "device" above?
echo.
echo  [Y] Yes - Install app now
echo  [N] No - Still booting, wait more
echo.
set /p choice="Your choice: "

if /i "%choice%"=="Y" goto install
if /i "%choice%"=="y" goto install
goto wait

:install
echo.
echo Installing APK...
adb uninstall in.pulsemateconnect.patient 2>nul
adb install -r "pulsemateconnect-v1.3.4-71-rnfirebase.apk"

if errorlevel 1 (
    echo.
    echo Installation failed!
    echo Make sure emulator is fully booted.
    pause
    exit /b 1
)

echo.
echo Launching app...
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Check the emulator window for the app!
echo.
pause
exit /b 0

:wait
echo.
echo Please wait for the emulator to show the home screen,
echo then run this script again.
echo.
pause
