@echo off
echo ============================================================
echo BUILDING APK FROM NEW LOCATION
echo ============================================================
echo.
echo Opening new location in VS Code...
code C:\pm\pulsemateconnect21
echo.
echo ============================================================
echo AFTER VS CODE OPENS, RUN THESE COMMANDS IN TERMINAL:
echo ============================================================
echo.
echo cd android
echo .\gradlew clean
echo .\gradlew assembleRelease
echo.
echo ============================================================
echo OR JUST RUN THIS BATCH FILE FROM NEW LOCATION:
echo ============================================================
echo.
cd /d C:\pm\pulsemateconnect21
if exist android (
    echo Building APK...
    cd android
    call gradlew clean
    call gradlew assembleRelease
    echo.
    echo ============================================================
    echo BUILD COMPLETE!
    echo ============================================================
    echo.
    echo APK Location:
    echo C:\pm\pulsemateconnect21\android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo To install on device/emulator:
    echo adb install android\app\build\outputs\apk\release\app-release.apk
    echo.
) else (
    echo ERROR: android folder not found!
    echo Make sure you're in C:\pm\pulsemateconnect21
)
pause
