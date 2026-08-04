@echo off
echo ========================================
echo    Convert AAB to APK for USB Install
echo ========================================
echo.
echo AAB files cannot be installed directly via USB.
echo This script converts AAB to APK using bundletool.
echo.
pause

REM Check if bundletool exists
if not exist bundletool.jar (
    echo Downloading bundletool...
    curl -L -o bundletool.jar https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to download bundletool!
        echo Please download manually from:
        echo https://github.com/google/bundletool/releases
        pause
        exit /b 1
    )
)

REM Find AAB file
echo.
echo Looking for AAB file...
for /f "delims=" %%i in ('dir /b /s *.aab 2^>nul') do set AAB_FILE=%%i

if not defined AAB_FILE (
    echo.
    echo ERROR: No AAB file found!
    echo Please download your AAB file and place it in this folder.
    pause
    exit /b 1
)

echo Found: %AAB_FILE%
echo.

REM Get connected devices
echo Checking for connected devices...
adb devices
echo.

REM Build APKs from AAB
echo Building APKs from AAB...
echo.
java -jar bundletool.jar build-apks --bundle="%AAB_FILE%" --output=app.apks --mode=universal --ks=android\app\debug.keystore --ks-pass=pass:android --ks-key-alias=androiddebugkey --key-pass=pass:android

if errorlevel 1 (
    echo.
    echo ERROR: Failed to build APKs!
    echo.
    echo This might be because:
    echo   1. Java is not installed
    echo   2. AAB file is corrupted
    echo   3. Keystore issue
    echo.
    pause
    exit /b 1
)

REM Extract universal APK
echo.
echo Extracting universal APK...
powershell -Command "Expand-Archive -Path 'app.apks' -DestinationPath 'apks' -Force"

REM Find and rename the APK
for /f "delims=" %%i in ('dir /b /s apks\universal.apk 2^>nul') do set APK_FILE=%%i

if not defined APK_FILE (
    echo ERROR: Could not extract APK!
    pause
    exit /b 1
)

copy "%APK_FILE%" "app-universal.apk"

echo.
echo ========================================
echo    APK Created Successfully!
echo ========================================
echo.
echo File: app-universal.apk
echo.
echo Installing to connected device...
echo.

adb install -r app-universal.apk

if errorlevel 1 (
    echo.
    echo Installation failed!
    echo Make sure USB debugging is enabled.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Success!
echo ========================================
echo.
echo App installed on your device.
echo You can now test OTP!
echo.
pause
