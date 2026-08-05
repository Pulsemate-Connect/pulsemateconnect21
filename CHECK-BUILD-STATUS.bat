@echo off
echo ═══════════════════════════════════════════════════════════════════════════════
echo  📊 CHECK BUILD STATUS
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

echo Checking recent builds...
echo.

eas build:list --platform android --limit 5

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  Legend:
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo ⏳ IN_QUEUE        - Waiting to start
echo 🔨 IN_PROGRESS     - Building now
echo ✅ FINISHED        - Build complete (ready to download)
echo ❌ ERRORED         - Build failed
echo ⏸️  CANCELED        - Build was canceled
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  Quick Commands:
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo Download latest build:
echo   eas build:download --platform android --latest
echo.
echo View specific build:
echo   eas build:view [BUILD_ID]
echo.
echo Cancel running build:
echo   eas build:cancel [BUILD_ID]
echo.
pause
