@echo off
cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   Open EAS Build in Emulator - READY TO INSTALL   ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo File: pulsemateconnect-v1.3.4-71-rnfirebase.apk
echo.
echo ════════════════════════════════════════════════════
echo.

set "PATH=C:\Users\shubh\AppData\Local\Android\Sdk\platform-tools;%PATH%"

echo [Step 1] Checking emulator...
adb devices
echo.

echo [Step 2] Installing APK...
adb uninstall in.pulsemateconnect.patient 2>nul
adb install -r "pulsemateconnect-v1.3.4-71-rnfirebase.apk"
echo.

echo [Step 3] Opening app...
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
echo.

echo ════════════════════════════════════════════════════
echo.
echo ✓ DONE! Check the emulator window.
echo.
echo The PulseMate Connect app should now be open!
echo.
pause
