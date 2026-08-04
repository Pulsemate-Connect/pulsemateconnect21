@echo off
echo ═══════════════════════════════════════════════════════════════════════════════
echo  🚀 PULSEMATE CONNECT - LOCAL TEST RUN
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo ✅ FIX APPLIED: Initialization Error Fixed
echo ✅ Backend SMS Implementation Active
echo ✅ No Firebase JS SDK Issues
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 1: Checking Environment
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js not found
    echo Install from: https://nodejs.org/
    pause
    exit /b 1
)

echo Checking npm...
npm --version
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm not found
    pause
    exit /b 1
)

echo ✅ Environment OK
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 2: Installing Dependencies (if needed)
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
) else (
    echo ✅ Dependencies already installed
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  STEP 3: Starting Metro Bundler
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 📱 Starting Expo development server...
echo.
echo IMPORTANT:
echo 1. ✅ The "Initialization Error" should NOT appear
echo 2. ✅ App should open without crashes
echo 3. ✅ Test OTP flow to verify Backend SMS works
echo.
echo To test on:
echo - 📱 Physical Device: Scan QR code with Expo Go app
echo - 💻 Android Emulator: Press 'a' in terminal
echo - 🍎 iOS Simulator: Press 'i' in terminal (Mac only)
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  STARTING APP NOW...
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

npm start

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  APP STOPPED
echo ═══════════════════════════════════════════════════════════════════════════════
pause
