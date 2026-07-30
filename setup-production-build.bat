@echo off
echo ================================================
echo   Setup Production Build Configuration
echo ================================================
echo.

cd /d "%~dp0"

echo Step 1: Checking for existing keystores...
echo.

if exist "@shubhamskkk__pulsemate-app.bak.jks" (
    echo Found EAS keystore: @shubhamskkk__pulsemate-app.bak.jks
    set KEYSTORE_FILE=@shubhamskkk__pulsemate-app.bak.jks
    set KEYSTORE_ALIAS=pulsemate-app
    goto :keystore_found
)

if exist "@shubhamskkk__pulsemate-app.bak_OLD_1.jks" (
    echo Found EAS keystore: @shubhamskkk__pulsemate-app.bak_OLD_1.jks
    set KEYSTORE_FILE=@shubhamskkk__pulsemate-app.bak_OLD_1.jks
    set KEYSTORE_ALIAS=pulsemate-app
    goto :keystore_found
)

echo No EAS keystore found!
echo.
choice /C YN /M "Do you want to create a new keystore"
if errorlevel 2 goto :end
if errorlevel 1 goto :create_keystore

:create_keystore
echo.
echo Creating new production keystore...
echo.
set /p STORE_PASS="Enter keystore password (minimum 6 characters): "
set /p KEY_PASS="Enter key password (press Enter to use same as keystore): "
if "%KEY_PASS%"=="" set KEY_PASS=%STORE_PASS%

keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -storepass "%STORE_PASS%" -keypass "%KEY_PASS%" -alias pulsemate-key-alias -keystore pulsemate-release-key.keystore -dname "CN=PulseMate Connect, OU=Healthcare, O=PulseMate, L=India, ST=India, C=IN"

if %errorlevel% neq 0 (
    echo ERROR: Failed to create keystore!
    pause
    exit /b 1
)

echo.
echo Keystore created successfully!
set KEYSTORE_FILE=pulsemate-release-key.keystore
set KEYSTORE_ALIAS=pulsemate-key-alias
goto :keystore_found

:keystore_found
echo.
echo Step 2: Copying keystore to android/app directory...
echo.

copy "%KEYSTORE_FILE%" "android\app\pulsemate-release-key.keystore" /Y

if %errorlevel% neq 0 (
    echo ERROR: Failed to copy keystore!
    pause
    exit /b 1
)

echo Keystore copied successfully!
echo.

echo Step 3: Your build configuration is ready!
echo.
echo Keystore file: %KEYSTORE_FILE%
echo Keystore alias: %KEYSTORE_ALIAS%
echo Location: android\app\pulsemate-release-key.keystore
echo.
echo ================================================
echo   READY TO BUILD!
echo ================================================
echo.
echo Next step: Run build-production-aab.bat
echo.
pause
goto :end

:end
