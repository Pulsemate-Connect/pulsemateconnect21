@echo off
echo ========================================
echo Firebase Auth Log Monitor
echo ========================================
echo Device: Connected (9b90e608)
echo Time: %date% %time%
echo ========================================
echo.
echo Monitoring Firebase Authentication logs...
echo Press Ctrl+C to stop monitoring
echo.
echo ========================================
echo.

REM Clear previous logs and start monitoring
adb logcat -c

REM Monitor with multiple filter patterns for comprehensive logging
adb logcat | findstr /I "Auth Firebase OTP Login verification FIREBASE"
