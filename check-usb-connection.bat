@echo off
echo ================================================
echo   USB Device Connection Checker
echo ================================================
echo.

echo Restarting ADB server...
adb kill-server
timeout /t 2 /nobreak >nul
adb start-server
echo.

echo Checking for connected devices...
echo.
adb devices -l
echo.

echo ================================================
echo.
echo If you see a device listed above (not "unauthorized"):
echo   ✅ You're ready! Run: run-on-usb.bat
echo.
echo If you see "unauthorized":
echo   ⚠️  Check your phone screen for USB debugging popup
echo.
echo If you see no devices:
echo   ❌ Phone not connected
echo   - Check USB cable
echo   - Enable USB Debugging in Developer Options
echo   - Try different USB port
echo.
echo ================================================
pause
