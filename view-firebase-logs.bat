@echo off
echo ========================================
echo    View Firebase OTP Logs
echo ========================================
echo.
echo This will show real-time logs from your phone.
echo Useful for debugging OTP issues.
echo.
echo Make sure:
echo   - Phone is connected via USB
echo   - App is running
echo.
pause

echo.
echo Streaming logs... (Press Ctrl+C to stop)
echo.
echo Watching for: Firebase, Auth, OTP
echo ========================================
echo.

adb logcat -s ReactNativeJS:V FirebaseAuth:V Auth:V

pause
