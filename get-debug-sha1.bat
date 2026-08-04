@echo off
echo ========================================
echo    Get Debug Keystore SHA-1
echo ========================================
echo.
echo This will show the SHA-1 fingerprint of your debug keystore.
echo You need to add this to Firebase Console for development builds.
echo.
pause

echo.
echo ========================================
echo    Debug Keystore SHA-1
echo ========================================
echo.

cd android\app

if not exist debug.keystore (
    echo ERROR: debug.keystore not found!
    echo.
    echo This is normal for fresh projects.
    echo The debug keystore will be created on first build.
    echo.
    echo Using Expo's default debug SHA-1:
    echo.
    echo SHA1: 4D:F5:83:93:29:93:FD:70:60:B1:FA:97:7F:D4:D4:EC:1B:3B:54:CE
    echo SHA256: 01:AC:F8:D7:CF:73:9F:95:AB:0C:38:1A:E7:14:F1:A5:E4:8A:F8:11:DF:F0:84:64:5E:FC:A1:5A:50:3A:88:D8
    echo.
    echo Add these to Firebase Console:
    echo 1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
    echo 2. Scroll to Android app
    echo 3. Click "Add fingerprint"
    echo 4. Paste the SHA-1 above
    echo 5. Click "Save"
    echo.
    cd ..\..
    pause
    exit /b 0
)

keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android

cd ..\..

echo.
echo ========================================
echo    Next Steps:
echo ========================================
echo.
echo 1. Copy the SHA1 value from above
echo 2. Go to Firebase Console:
echo    https://console.firebase.google.com/project/pulsemateconnect/settings/general
echo 3. Scroll to "Your apps" ^> Android app
echo 4. Click "Add fingerprint"
echo 5. Paste the SHA1 value
echo 6. Click "Save"
echo 7. Download new google-services.json
echo 8. Replace android\app\google-services.json
echo 9. Build development APK: .\build-dev-apk.bat
echo.
pause
