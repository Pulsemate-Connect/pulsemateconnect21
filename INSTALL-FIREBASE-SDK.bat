@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM  Install Firebase JavaScript SDK (Fix Production Initialization Error)
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  INSTALLING FIREBASE JAVASCRIPT SDK
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo  This will install the missing firebase package that caused the
echo  "Initialization Error" in your production build.
echo.
echo  Package: firebase@^12.0.0
echo  Type: Firebase JavaScript SDK (Web)
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.

REM Step 1: Clean npm cache
echo [1/5] Cleaning npm cache...
call npm cache clean --force
if errorlevel 1 (
  echo.
  echo ❌ ERROR: Failed to clean npm cache
  echo.
  pause
  exit /b 1
)
echo ✅ npm cache cleaned
echo.

REM Step 2: Remove node_modules (optional but recommended)
echo [2/5] Removing old node_modules...
if exist node_modules (
  rmdir /s /q node_modules
  echo ✅ node_modules removed
) else (
  echo ⚠️  No node_modules folder found (skipping)
)
echo.

REM Step 3: Install dependencies
echo [3/5] Installing all dependencies (including firebase)...
echo.
echo  This may take 2-5 minutes depending on your internet speed...
echo.
call npm install
if errorlevel 1 (
  echo.
  echo ❌ ERROR: npm install failed
  echo.
  echo Please check:
  echo  1. Internet connection
  echo  2. package.json is valid
  echo  3. npm is installed correctly
  echo.
  pause
  exit /b 1
)
echo.
echo ✅ All dependencies installed
echo.

REM Step 4: Verify firebase package
echo [4/5] Verifying firebase package installation...
call npm list firebase >nul 2>&1
if errorlevel 1 (
  echo.
  echo ❌ ERROR: firebase package NOT found after installation
  echo.
  echo This should not happen. Please check package.json manually.
  echo.
  pause
  exit /b 1
)
echo ✅ firebase package verified
echo.

REM Step 5: Check Expo compatibility
echo [5/5] Checking Expo package compatibility...
call npx expo install --check
echo.

echo ═══════════════════════════════════════════════════════════════════════════
echo  ✅ INSTALLATION COMPLETE
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo  Firebase JavaScript SDK is now installed.
echo.
echo  Next steps:
echo  1. Test in Expo Go:  npx expo start
echo  2. Build production AAB:  .\build-aab-auto-version.bat
echo  3. Upload to Play Store (internal testing)
echo  4. Install on device and test OTP
echo.
echo  If you still see errors, run:  .\view-firebase-logs.bat
echo  to see detailed Firebase initialization logs.
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.
pause
