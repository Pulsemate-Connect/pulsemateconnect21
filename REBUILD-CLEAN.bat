@echo off
echo ============================================================
echo CLEAN REBUILD - CLEARING ALL CACHES
echo ============================================================
echo.
echo This will:
echo 1. Clear Metro bundler cache
echo 2. Clear Gradle cache
echo 3. Clean build
echo 4. Rebuild APK
echo 5. Install on device
echo.
cd /d C:\pm\pulsemateconnect21
if errorlevel 1 (
    echo ERROR: Could not find C:\pm\pulsemateconnect21
    exit /b 1
)
echo.
echo Step 1: Clearing Metro cache...
call npx react-native start --reset-cache &
timeout /t 3
taskkill /F /IM node.exe 2>nul
echo.
echo Step 2: Clearing Gradle caches...
cd android
call gradlew clean
call gradlew cleanBuildCache
echo.
echo Step 3: Building APK with clean cache...
call gradlew assembleRelease --no-build-cache --rerun-tasks
if errorlevel 1 (
    echo BUILD FAILED!
    pause
    exit /b 1
)
echo.
echo BUILD SUCCESSFUL!
echo.
echo Step 4: Installing APK...
cd /d C:\pm\pulsemateconnect21
adb uninstall in.pulsemateconnect.patient
adb install android\app\build\outputs\apk\release\app-release.apk
if errorlevel 1 (
    echo INSTALLATION FAILED!
    pause
    exit /b 1
)
echo.
echo ============================================================
echo SUCCESS! CLEAN BUILD AND INSTALL COMPLETE
echo ============================================================
echo.
echo Test the app now!
pause
