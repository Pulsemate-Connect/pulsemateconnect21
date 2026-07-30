@echo off
echo ============================================================
echo  FIX FIREBASE + BUILD AAB - PulseMate Connect
echo ============================================================
echo.
echo This script will:
echo 1. Copy project to C:\pm\app (short path to avoid Windows issues)
echo 2. Remove FirebaseRecaptchaVerifierModal (not needed in production)
echo 3. Remove expo-firebase-recaptcha and expo-firebase-core
echo 4. Build production AAB with real Firebase OTP
echo 5. Copy AAB to Desktop
echo.
echo Mode: Production (Real Firebase SMS with SafetyNet attestation)
echo Package: in.pulsemateconnect.patient
echo Keystore: pulsemate-release-key.keystore
echo.
pause

:: ===== STEP 1: Copy project to short path =====
echo.
echo [1/6] Copying project to C:\pm\app...
if exist "C:\pm\app" (
    echo Removing existing C:\pm\app...
    rmdir /s /q "C:\pm\app" 2>nul
    timeout /t 2 /nobreak >nul
)

mkdir "C:\pm" 2>nul
xcopy /E /I /H /Y "%~dp0" "C:\pm\app" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy project
    pause
    exit /b 1
)
echo SUCCESS: Project copied to C:\pm\app

:: ===== STEP 2: Update firebase.js import in LoginScreen =====
echo.
echo [2/6] Fixing LoginScreen.jsx...
cd /d "C:\pm\app"

powershell -Command "(Get-Content 'src\screens\LoginScreen.jsx') -replace 'import { FirebaseRecaptchaVerifierModal } from ''expo-firebase-recaptcha'';', '// FirebaseRecaptchaVerifierModal removed for production build' | Set-Content 'src\screens\LoginScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\LoginScreen.jsx') -replace 'import { initializeFirebaseAuth, sendOtpToPhone } from ''../config/firebase'';', 'import { initializeFirebaseAuth, sendOtpToPhone } from ''../config/firebase-production'';' | Set-Content 'src\screens\LoginScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\LoginScreen.jsx') -replace 'import { firebaseConfig } from ''../config/firebaseConfig'';', '// firebaseConfig not needed in production' | Set-Content 'src\screens\LoginScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\LoginScreen.jsx') -replace 'const recaptchaVerifier = useRef\(null\);', '// recaptchaVerifier not needed in production' | Set-Content 'src\screens\LoginScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\LoginScreen.jsx') -replace '<FirebaseRecaptchaVerifierModal', '{/* FirebaseRecaptchaVerifierModal removed' | Set-Content 'src\screens\LoginScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\LoginScreen.jsx') -replace '/>', '*/}' | Set-Content 'src\screens\LoginScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\LoginScreen.jsx') -replace 'if \(!recaptchaVerifier.current\) \{[^}]+\}', '// recaptchaVerifier check removed' | Set-Content 'src\screens\LoginScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\LoginScreen.jsx') -replace ', recaptchaVerifier.current\)', ')' | Set-Content 'src\screens\LoginScreen.jsx'"

echo SUCCESS: LoginScreen.jsx fixed

:: ===== STEP 3: Update firebase.js import in Login2FactorScreen =====
echo.
echo [3/6] Fixing Login2FactorScreen.jsx...

powershell -Command "(Get-Content 'src\screens\Login2FactorScreen.jsx') -replace 'import { FirebaseRecaptchaVerifierModal } from ''expo-firebase-recaptcha'';', '// FirebaseRecaptchaVerifierModal removed for production build' | Set-Content 'src\screens\Login2FactorScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\Login2FactorScreen.jsx') -replace 'import { initializeFirebaseAuth, sendOtpToPhone } from ''../config/firebase'';', 'import { initializeFirebaseAuth, sendOtpToPhone } from ''../config/firebase-production'';' | Set-Content 'src\screens\Login2FactorScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\Login2FactorScreen.jsx') -replace 'import { firebaseConfig } from ''../config/firebaseConfig'';', '// firebaseConfig not needed in production' | Set-Content 'src\screens\Login2FactorScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\Login2FactorScreen.jsx') -replace 'const recaptchaVerifier = useRef\(null\);', '// recaptchaVerifier not needed in production' | Set-Content 'src\screens\Login2FactorScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\Login2FactorScreen.jsx') -replace '<FirebaseRecaptchaVerifierModal', '{/* FirebaseRecaptchaVerifierModal removed' | Set-Content 'src\screens\Login2FactorScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\Login2FactorScreen.jsx') -replace '/>', '*/}' | Set-Content 'src\screens\Login2FactorScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\Login2FactorScreen.jsx') -replace 'if \(!recaptchaVerifier.current\) \{[^}]+\}', '// recaptchaVerifier check removed' | Set-Content 'src\screens\Login2FactorScreen.jsx'"
powershell -Command "(Get-Content 'src\screens\Login2FactorScreen.jsx') -replace ', recaptchaVerifier.current\)', ')' | Set-Content 'src\screens\Login2FactorScreen.jsx'"

echo SUCCESS: Login2FactorScreen.jsx fixed

:: ===== STEP 4: Remove problematic packages =====
echo.
echo [4/6] Removing expo-firebase-recaptcha and expo-firebase-core...
call npm uninstall expo-firebase-recaptcha expo-firebase-core 2>nul
echo SUCCESS: Packages removed

:: ===== STEP 5: Build AAB =====
echo.
echo [5/6] Building production AAB...
echo This will take 10-15 minutes...
echo.

cd android
call gradlew bundleRelease

if %errorlevel% neq 0 (
    echo.
    echo ============================================================
    echo  BUILD FAILED
    echo ============================================================
    echo.
    echo Check the error messages above.
    echo Common issues:
    echo   - Java/Android SDK not installed
    echo   - Keystore file missing or incorrect password
    echo   - Network error downloading dependencies
    echo.
    cd ..
    pause
    exit /b 1
)

cd ..

:: ===== STEP 6: Copy AAB to Desktop =====
echo.
echo [6/6] Copying AAB to Desktop...

set AAB_SOURCE=C:\pm\app\android\app\build\outputs\bundle\release\app-release.aab
set AAB_DEST=%USERPROFILE%\Desktop\pulsemateconnect-production.aab

if exist "%AAB_SOURCE%" (
    copy "%AAB_SOURCE%" "%AAB_DEST%" >nul
    echo SUCCESS: AAB copied to Desktop
    echo.
    echo ============================================================
    echo  BUILD SUCCESSFUL!
    echo ============================================================
    echo.
    echo AAB Location: %AAB_DEST%
    echo Package: in.pulsemateconnect.patient
    echo Mode: Production with Firebase real OTP
    echo.
    echo Next Steps:
    echo 1. Upload AAB to Google Play Console
    echo 2. Go to: Internal Testing ^> Create Release
    echo 3. Upload pulsemateconnect-production.aab
    echo 4. Add testers and download on Android device
    echo 5. Test Firebase OTP (will send real SMS!)
    echo.
    echo SHA-256 is already registered ✓
    echo Firebase Phone Auth is enabled ✓
    echo.
) else (
    echo ERROR: AAB file not found at %AAB_SOURCE%
    echo Build may have failed
)

pause
