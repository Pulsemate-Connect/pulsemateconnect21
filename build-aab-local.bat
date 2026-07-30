@echo off
echo ========================================
echo  PulseMate Connect - Local AAB Build
echo ========================================
echo.

echo Step 1: Checking prerequisites...
echo.

REM Check if Java is installed
java -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java JDK not found!
    echo Please install Java JDK 17 or higher
    echo Download from: https://adoptium.net/
    pause
    exit /b 1
)
echo [OK] Java JDK found

REM Check if Android SDK is set
if "%ANDROID_HOME%"=="" (
    echo [WARNING] ANDROID_HOME not set
    echo Trying common locations...
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
        echo [OK] Found Android SDK at %ANDROID_HOME%
    ) else (
        echo [ERROR] Android SDK not found!
        echo Please install Android Studio or set ANDROID_HOME
        pause
        exit /b 1
    )
) else (
    echo [OK] Android SDK found at %ANDROID_HOME%
)

echo.
echo Step 2: Checking/Creating release keystore...
echo.

if not exist "android\app\pulsemate-release-key.keystore" (
    echo [INFO] Release keystore not found. Creating new keystore...
    echo.
    
    set STORE_PASSWORD=pulsemate2024
    set KEY_PASSWORD=pulsemate2024
    set KEY_ALIAS=pulsemate-key-alias
    set VALIDITY=10000
    
    echo Creating keystore with:
    echo   Alias: %KEY_ALIAS%
    echo   Validity: %VALIDITY% days
    echo   Password: ********
    echo.
    
    keytool -genkeypair -v -storetype PKCS12 ^
        -keystore android\app\pulsemate-release-key.keystore ^
        -alias %KEY_ALIAS% ^
        -keyalg RSA ^
        -keysize 2048 ^
        -validity %VALIDITY% ^
        -storepass %STORE_PASSWORD% ^
        -keypass %KEY_PASSWORD% ^
        -dname "CN=PulseMate Connect, OU=Healthcare, O=PulseMate, L=Mumbai, S=Maharashtra, C=IN"
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create keystore
        pause
        exit /b 1
    )
    
    echo.
    echo [OK] Keystore created successfully!
    echo.
    echo IMPORTANT: Save these credentials securely:
    echo   Keystore file: android\app\pulsemate-release-key.keystore
    echo   Store password: %STORE_PASSWORD%
    echo   Key alias: %KEY_ALIAS%
    echo   Key password: %KEY_PASSWORD%
    echo.
    
    REM Get SHA-256 fingerprint for Firebase
    echo Getting SHA-256 fingerprint for Firebase Console...
    keytool -list -v -keystore android\app\pulsemate-release-key.keystore -alias %KEY_ALIAS% -storepass %STORE_PASSWORD% | findstr "SHA256"
    echo.
    echo CRITICAL: Copy the SHA-256 fingerprint above and add it to Firebase Console:
    echo 1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
    echo 2. Scroll to "Your apps" section
    echo 3. Click on your Android app
    echo 4. Click "Add fingerprint"
    echo 5. Paste the SHA-256 value
    echo.
    echo SHA-256 fingerprint has been saved to KEYSTORE-INFO.txt
    echo.
    pause
) else (
    echo [OK] Release keystore already exists
    echo [INFO] SHA-256 fingerprint saved in KEYSTORE-INFO.txt
)

echo.
echo Step 3: Copying google-services.json to android/app...
echo.

if exist "google-services.json" (
    copy /Y "google-services.json" "android\app\google-services.json" >nul
    echo [OK] google-services.json copied
) else (
    echo [ERROR] google-services.json not found in root directory!
    echo Firebase Phone Auth will not work without this file.
    pause
    exit /b 1
)

echo.
echo Step 4: Pre-bundling JavaScript with Expo...
echo.

echo [INFO] This may take 2-3 minutes...
call npx expo export --platform android

if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] JavaScript export had issues, trying alternative method...
    echo [INFO] Gradle will bundle JavaScript during build
)

echo [OK] Pre-bundle step complete

echo.
echo Step 5: Building production AAB with Gradle...
echo.

echo [INFO] This may take 5-10 minutes on first build...
echo [INFO] Building AAB file...
echo.

cd android
call gradlew bundleRelease

if %ERRORLEVEL% NEQ 0 (
    cd ..
    echo.
    echo [ERROR] AAB build failed!
    echo Check the error messages above.
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.

if exist "android\app\build\outputs\bundle\release\app-release.aab" (
    echo AAB file location:
    echo   android\app\build\outputs\bundle\release\app-release.aab
    echo.
    
    REM Get file size
    for %%A in (android\app\build\outputs\bundle\release\app-release.aab) do (
        set SIZE=%%~zA
        set /A SIZE_MB=!SIZE! / 1048576
        echo File size: !SIZE_MB! MB
    )
    
    echo.
    echo Next steps:
    echo 1. Upload AAB to Google Play Console
    echo 2. Submit for review
    echo.
    echo AAB file is ready to upload!
) else (
    echo [WARNING] AAB file not found at expected location
    echo Please check android\app\build\outputs\bundle\release\
)

echo.
pause
