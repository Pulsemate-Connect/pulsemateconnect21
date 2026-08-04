@echo off
echo ========================================
echo    Start Development Client Server
echo ========================================
echo.
echo This starts Metro bundler for your development build.
echo.
echo Make sure:
echo   - Development APK is installed on phone
echo   - Phone is connected via USB
echo.
pause

echo.
echo Starting Metro bundler...
echo.
echo Once started:
echo   - Open PulseMate Connect app on phone
echo   - It will connect automatically
echo   - Make code changes - they reload instantly!
echo.

npx expo start --dev-client --clear

pause
