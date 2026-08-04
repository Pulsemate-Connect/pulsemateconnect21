@echo off
echo ========================================
echo  BUILD NEW APK WITH FIREBASE
echo ========================================
echo.
echo This will create a new EAS build with Firebase Phone Auth.
echo Build time: ~10-15 minutes
echo.
echo WARNING: Backend doesn't have Firebase endpoint yet!
echo Login will fail until backend is updated.
echo.
echo After build completes, run:
echo   eas build:run -p android --latest
echo.
pause

echo.
echo Building APK...
eas build --platform android --profile preview --non-interactive

echo.
echo Build submitted!
echo.
echo To install once done:
echo   eas build:run -p android --latest
echo.
pause
