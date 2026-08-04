@echo off
echo.
echo ========================================================================
echo    FIREBASE PHONE AUTH - SETUP VERIFICATION
echo ========================================================================
echo.

echo [1/5] Checking Firebase JS SDK installation...
call npm list firebase 2>nul | findstr "firebase@"
if %errorlevel% equ 0 (
    echo     ✓ Firebase SDK installed
) else (
    echo     ✗ Firebase SDK NOT installed
    echo     Run: npm install firebase@^10.13.0
)
echo.

echo [2/5] Checking backend Firebase Admin SDK...
cd backend 2>nul
if exist package.json (
    call npm list firebase-admin 2>nul | findstr "firebase-admin@"
    if %errorlevel% equ 0 (
        echo     ✓ Firebase Admin SDK installed in backend
    ) else (
        echo     ✗ Firebase Admin SDK NOT installed in backend
        echo     Run: cd backend ^&^& npm install firebase-admin
    )
) else (
    echo     ⚠ Backend directory not found at ./backend
)
cd ..
echo.

echo [3/5] Checking Firebase configuration files...
if exist "src\config\firebase-auth.js" (
    echo     ✓ firebase-auth.js exists
) else (
    echo     ✗ firebase-auth.js NOT found
)

if exist "src\components\RecaptchaContainer.jsx" (
    echo     ✓ RecaptchaContainer.jsx exists
) else (
    echo     ✗ RecaptchaContainer.jsx NOT found
)

if exist "backend\src\config\firebase.js" (
    echo     ✓ Backend firebase.js exists
) else (
    echo     ✗ Backend firebase.js NOT found
)
echo.

echo [4/5] Checking login screens...
findstr /C:"firebase-auth" "src\screens\LoginScreen.jsx" >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ LoginScreen.jsx using firebase-auth
) else (
    echo     ⚠ LoginScreen.jsx may need update
)

findstr /C:"firebase-auth" "src\screens\Login2FactorScreen.jsx" >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ Login2FactorScreen.jsx using firebase-auth
) else (
    echo     ⚠ Login2FactorScreen.jsx may need update
)

findstr /C:"firebase-auth" "src\screens\Otp2FactorScreen.jsx" >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ Otp2FactorScreen.jsx using firebase-auth
) else (
    echo     ⚠ Otp2FactorScreen.jsx may need update
)
echo.

echo [5/5] Checking backend auth routes...
findstr /C:"patientFirebasePhoneLoginHandler" "backend\src\routes\auth.routes.js" >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ Firebase phone login route configured
) else (
    echo     ✗ Firebase phone login route NOT found
)

findstr /C:"/patient/firebase-phone-login" "backend\src\routes\auth.routes.js" >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ Correct endpoint path configured
) else (
    echo     ⚠ Endpoint path may need verification
)
echo.

echo ========================================================================
echo    MANUAL CHECKS REQUIRED
echo ========================================================================
echo.
echo [ ] Firebase Console - Phone Auth Enabled
echo     → https://console.firebase.google.com/project/pulsemateconnect/authentication/providers
echo.
echo [ ] Firebase Console - SHA Fingerprints Added
echo     → https://console.firebase.google.com/project/pulsemateconnect/settings/general
echo     → Add SHA-1: E0:AC:76:86:0F:79:68:E8:3D:20:47:1D:EF:53:5D:39:D6:00:9E:E1
echo     → Add SHA-256: CE:A8:43:D7:9C:7C:2B:AC:B5:9A:23:F1:31:6A:46:9F:20:1F:E0:68:4C:B8:79:6A:5B:A9:FA:4A:07:0C:92:8A
echo.
echo [ ] Render - Firebase Service Account JSON Added
echo     → https://dashboard.render.com
echo     → Environment variable: FIREBASE_SERVICE_ACCOUNT_JSON
echo.
echo [ ] Test Locally
echo     → Run: npm start
echo     → Test OTP flow on emulator
echo.
echo ========================================================================
echo.
echo Next: Read FIREBASE-PHONE-AUTH-SETUP.md for complete instructions
echo.
pause
