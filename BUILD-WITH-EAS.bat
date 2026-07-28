@echo off
echo ========================================
echo Building PulseMate v1.3.2 with EAS
echo ========================================
echo.
echo This will build in the cloud (no path issues!)
echo Build time: 15-20 minutes
echo.
echo Starting EAS build...
echo.

eas build --platform android --profile production

echo.
echo ========================================
echo Build submitted!
echo ========================================
echo.
echo Check build status at:
echo https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/builds
echo.
echo The AAB will be available for download when complete.
echo.
pause
