@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM  Verify Firebase JavaScript SDK Installation
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  VERIFYING FIREBASE INSTALLATION
echo ═══════════════════════════════════════════════════════════════════════════
echo.

setlocal enabledelayedexpansion
set ERRORS=0

REM Check 1: package.json has firebase
echo [1/5] Checking package.json...
findstr /C:"\"firebase\"" package.json >nul 2>&1
if errorlevel 1 (
  echo ❌ FAIL: firebase NOT found in package.json
  set /a ERRORS+=1
) else (
  echo ✅ PASS: firebase found in package.json
)
echo.

REM Check 2: firebase package installed in node_modules
echo [2/5] Checking node_modules...
if exist node_modules\firebase\package.json (
  echo ✅ PASS: firebase package found in node_modules
) else (
  echo ❌ FAIL: firebase package NOT found in node_modules
  echo    Run: npm install
  set /a ERRORS+=1
)
echo.

REM Check 3: firebase package version
echo [3/5] Checking firebase version...
call npm list firebase 2>nul | findstr "firebase@" >nul
if errorlevel 1 (
  echo ❌ FAIL: Cannot detect firebase version
  set /a ERRORS+=1
) else (
  call npm list firebase 2>nul | findstr "firebase@"
  echo ✅ PASS: firebase package version detected
)
echo.

REM Check 4: React Native Firebase removed
echo [4/5] Checking for conflicting packages...
findstr /C:"\"@react-native-firebase/app\"" package.json >nul 2>&1
if errorlevel 1 (
  echo ✅ PASS: @react-native-firebase/app removed (no conflict)
) else (
  echo ❌ FAIL: @react-native-firebase/app still in package.json
  echo    This will conflict with firebase JavaScript SDK
  echo    Remove it manually from package.json and run: npm install
  set /a ERRORS+=1
)

findstr /C:"\"@react-native-firebase/auth\"" package.json >nul 2>&1
if errorlevel 1 (
  echo ✅ PASS: @react-native-firebase/auth removed (no conflict)
) else (
  echo ❌ FAIL: @react-native-firebase/auth still in package.json
  echo    This will conflict with firebase JavaScript SDK
  echo    Remove it manually from package.json and run: npm install
  set /a ERRORS+=1
)
echo.

REM Check 5: expo-firebase-recaptcha present
echo [5/5] Checking expo-firebase-recaptcha...
findstr /C:"\"expo-firebase-recaptcha\"" package.json >nul 2>&1
if errorlevel 1 (
  echo ❌ FAIL: expo-firebase-recaptcha NOT found
  echo    This is required for Firebase Phone Auth
  echo    Run: npx expo install expo-firebase-recaptcha
  set /a ERRORS+=1
) else (
  echo ✅ PASS: expo-firebase-recaptcha found
)
echo.

echo ═══════════════════════════════════════════════════════════════════════════

if !ERRORS! EQU 0 (
  echo  ✅ ALL CHECKS PASSED
  echo ═══════════════════════════════════════════════════════════════════════════
  echo.
  echo  Your Firebase installation is correct!
  echo.
  echo  Next steps:
  echo  1. Test in Expo Go:  npx expo start
  echo  2. Build production AAB:  .\build-aab-auto-version.bat
  echo  3. Test OTP in production build
  echo.
) else (
  echo  ❌ !ERRORS! CHECK(S) FAILED
  echo ═══════════════════════════════════════════════════════════════════════════
  echo.
  echo  Please fix the errors above before building.
  echo.
  echo  Common fixes:
  echo  - Run: npm install
  echo  - Remove @react-native-firebase packages from package.json
  echo  - Run: npx expo install expo-firebase-recaptcha
  echo.
)

echo ═══════════════════════════════════════════════════════════════════════════
echo.
pause
