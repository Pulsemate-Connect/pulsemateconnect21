@echo off
echo ========================================
echo  RUN APP WITH FIREBASE (Dev Mode)
echo ========================================
echo.
echo WARNING: Backend doesn't have Firebase endpoint yet!
echo The app will fail when you try to login.
echo.
echo This will:
echo 1. Start Expo dev server
echo 2. Open app in emulator
echo 3. You can test Firebase integration
echo.
pause

echo.
echo Starting Expo...
npm start

pause
