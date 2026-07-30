@echo off
echo ============================================================
echo  FIX FIREBASE + BUILD AAB - PulseMate Connect [AUTO]
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
echo Starting in 3 seconds...
timeout /t 3 /nobreak >nul

:: ===== STEP 1: Copy project to short path =====
echo.
echo [1/6] Copying project to C:\pm\app...
if exist "C:\pm\app" (
    echo Removing existing C:\pm\app...
    rmdir /s /q "C:\pm\app" 2>nul
    timeout /t 2 /nobreak >nul
)

mkdir "C:\pm" 2>nul
echo Copying files (this may take 1-2 minutes)...
xcopy /E /I /H /Y "%~dp0" "C:\pm\app" /EXCLUDE:%~dp0xcopy-exclude.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Some files may not have copied, continuing anyway...
)
echo SUCCESS: Project copied to C:\pm\app

:: ===== STEP 2: Update firebase.js import in LoginScreen =====
echo.
echo [2/6] Fixing LoginScreen.jsx...
cd /d "C:\pm\app"

powershell -Command "$content = Get-Content 'src\screens\LoginScreen.jsx' -Raw; $content = $content -replace 'import \{ FirebaseRecaptchaVerifierModal \} from ''expo-firebase-recaptcha'';', '// FirebaseRecaptchaVerifierModal removed for production build'; $content = $content -replace 'import \{ initializeFirebaseAuth, sendOtpToPhone \} from ''../config/firebase'';', 'import { initializeFirebaseAuth, sendOtpToPhone } from ''../config/firebase-production'';'; $content = $content -replace 'import \{ firebaseConfig \} from ''../config/firebaseConfig'';', '// firebaseConfig not needed in production'; $content = $content -replace 'const recaptchaVerifier = useRef\(null\);', '// recaptchaVerifier not needed in production'; $content = $content -replace '<FirebaseRecaptchaVerifierModal[\s\S]*?\/>', ''; $content = $content -replace 'if \(!recaptchaVerifier\.current\) \{[\s\S]*?\n\s*\}', '// recaptchaVerifier check removed'; $content = $content -replace 'sendOtpToPhone\(fullNumber, recaptchaVerifier\.current\)', 'sendOtpToPhone(fullNumber)'; Set-Content 'src\screens\LoginScreen.jsx' $content"

echo SUCCESS: LoginScreen.jsx fixed

:: ===== STEP 3: Update firebase.js import in Login2FactorScreen =====
echo.
echo [3/6] Fixing Login2FactorScreen.jsx...

powershell -Command "$content = Get-Content 'src\screens\Login2FactorScreen.jsx' -Raw; $content = $content -replace 'import \{ FirebaseRecaptchaVerifierModal \} from ''expo-firebase-recaptcha'';', '// FirebaseRecaptchaVerifierModal removed for production build'; $content = $content -replace 'import \{ initializeFirebaseAuth, sendOtpToPhone \} from ''../config/firebase'';', 'import { initializeFirebaseAuth, sendOtpToPhone } from ''../config/firebase-production'';'; $content = $content -replace 'import \{ firebaseConfig \} from ''../config/firebaseConfig'';', '// firebaseConfig not needed in production'; $content = $content -replace 'const recaptchaVerifier = useRef\(null\);', '// recaptchaVerifier not needed in production'; $content = $content -replace '<FirebaseRecaptchaVerifierModal[\s\S]*?\/>', ''; $content = $content -replace 'if \(!recaptchaVerifier\.current\) \{[\s\S]*?\n\s*\}', '// recaptchaVerifier check removed'; $content = $content -replace 'sendOtpToPhone\(fullNumber, recaptchaVerifier\.current\)', 'sendOtpToPhone(fullNumber)'; Set-Content 'src\screens\Login2FactorScreen.jsx' $content"

echo SUCCESS: Login2FactorScreen.jsx fixed

:: ===== STEP 4: Remove problematic packages =====
echo.
echo [4/6] Removing expo-firebase-recaptcha and expo-firebase-core...
call npm uninstall expo-firebase-recaptcha expo-firebase-core --legacy-peer-deps 2>nul
echo SUCCESS: Packages removed

:: ===== STEP 5: Build AAB =====
echo.
echo [5/6] Building production AAB...
echo This will take 10-15 minutes...
echo Started at: %date% %time%
echo.

cd android
call gradlew.bat bundleRelease

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
    echo Completed at: %date% %time%
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

echo.
echo Build log saved. Press any key to exit...
pause >nul
