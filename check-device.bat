@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                                                                   ║
echo ║              🔍 CHECKING FOR ANDROID DEVICE...                    ║
echo ║                                                                   ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.

adb devices

echo.
echo ───────────────────────────────────────────────────────────────────
echo.
echo 📋 TROUBLESHOOTING:
echo.
echo    If no devices shown:
echo.
echo    1️⃣  Enable USB debugging on phone:
echo       Settings → About phone → Tap "Build number" 7 times
echo       Settings → Developer options → Enable "USB debugging"
echo.
echo    2️⃣  Connect USB cable
echo.
echo    3️⃣  On phone, tap "Allow USB debugging" → OK
echo.
echo    4️⃣  Try changing USB mode:
echo       Pull down notification → Tap USB → Select "File Transfer"
echo.
echo    5️⃣  Run this script again: check-device.bat
echo.
echo ───────────────────────────────────────────────────────────────────
echo.
echo Once device shows, run: npx expo run:android
echo.
pause
