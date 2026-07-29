@echo off
echo ========================================
echo Fixing Metro Bundler Error
echo ========================================

echo.
echo Navigating to C:\pm...
cd C:\pm

echo.
echo Killing old Metro processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Starting Metro with clear cache...
echo.
echo *** After Metro starts, press R twice on your phone! ***
echo.
start cmd /k "cd C:\pm && npx expo start --clear"

echo.
echo Metro bundler starting in new window...
echo Press R twice on your phone to reload!
echo.
pause
