@echo off
echo ================================================
echo   Get SHA-256 Fingerprint for Firebase
echo ================================================
echo.

cd /d "%~dp0"

echo This fingerprint is REQUIRED for Firebase Phone Auth
echo to work in your production AAB.
echo.
echo Looking for keystore files...
echo.

REM Check for existing keystores
if exist "upload-keystore.jks" (
    echo Found: upload-keystore.jks
    set KEYSTORE=upload-keystore.jks
    set ALIAS=upload
    goto :found
)

if exist "@shubhamskkk__pulsemate-app.bak.jks" (
    echo Found: @shubhamskkk__pulsemate-app.bak.jks
    set KEYSTORE=@shubhamskkk__pulsemate-app.bak.jks
    set ALIAS=pulsemate-app
    goto :found
)

if exist "@shubhamskkk__pulsemate-app.bak_OLD_1.jks" (
    echo Found: @shubhamskkk__pulsemate-app.bak_OLD_1.jks
    set KEYSTORE=@shubhamskkk__pulsemate-app.bak_OLD_1.jks
    set ALIAS=pulsemate-app
    goto :found
)

echo ERROR: No keystore file found!
echo.
echo Please ensure you have one of these files:
echo - upload-keystore.jks
echo - @shubhamskkk__pulsemate-app.bak.jks
echo.
pause
exit /b 1

:found
echo.
echo Using keystore: %KEYSTORE%
echo.
set /p PASSWORD="Enter keystore password: "

echo.
echo Getting SHA-256 fingerprint...
echo.

keytool -list -v -keystore "%KEYSTORE%" -alias %ALIAS% -storepass "%PASSWORD%" > sha256-output.txt 2>&1

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to read keystore!
    echo Check if the password is correct.
    echo.
    type sha256-output.txt
    del sha256-output.txt
    pause
    exit /b 1
)

echo ================================================
echo   CERTIFICATE FINGERPRINTS
echo ================================================
echo.

findstr /C:"SHA1:" sha256-output.txt
findstr /C:"SHA256:" sha256-output.txt

echo.
echo ================================================
echo.
echo COPY THE SHA-256 FINGERPRINT ABOVE
echo (The long line starting with SHA256:)
echo.
echo Then add it to Firebase:
echo 1. Go to: https://console.firebase.google.com/
echo 2. Select: pulsemate-patient-care
echo 3. Project Settings ^> Your apps ^> Android
echo 4. Scroll to "SHA certificate fingerprints"
echo 5. Click "Add fingerprint"
echo 6. Paste the SHA-256 value
echo 7. Save
echo.
echo Full output saved to: sha256-output.txt
echo.
pause

del sha256-output.txt
