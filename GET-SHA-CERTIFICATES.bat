@echo off
echo ================================================================
echo     FIREBASE PHONE AUTH - SHA CERTIFICATE EXTRACTOR
echo ================================================================
echo.
echo This script will help you get SHA certificates for Firebase.
echo.
echo YOU NEED TO ADD THESE TO FIREBASE CONSOLE:
echo   1. Debug SHA-256 (already have SHA-1)
echo   2. EAS Keystore SHA-1 and SHA-256
echo   3. Play Store App Signing SHA-1 and SHA-256
echo.
echo ================================================================
echo.

echo.
echo ================================================================
echo STEP 1: DEBUG KEYSTORE SHA CERTIFICATES
echo ================================================================
echo.
echo Location: android\app\debug.keystore
echo.

keytool -list -v -keystore "android\app\debug.keystore" -storepass android -keypass android 2>nul | findstr /C:"SHA1:" /C:"SHA256:"

echo.
echo Copy the SHA-1 and SHA-256 values above.
echo.
echo ================================================================
echo STEP 2: EAS KEYSTORE SHA CERTIFICATES
echo ================================================================
echo.
echo Running: npx expo fetch:android:hashes
echo.
echo This will fetch SHA certificates from your EAS build...
echo.

call npx expo fetch:android:hashes

echo.
echo ================================================================
echo STEP 3: NEXT ACTIONS
echo ================================================================
echo.
echo 1. Copy all SHA certificates from above
echo 2. Go to Firebase Console: https://console.firebase.google.com
echo 3. Select project: pulsemateconnect
echo 4. Go to Project Settings (gear icon)
echo 5. Scroll to "Your apps" - select Android app
echo 6. Click "Add fingerprint" and paste each SHA certificate
echo 7. Download new google-services.json
echo 8. Replace: android\app\google-services.json
echo.
echo 9. For Play Store SHA certificates:
echo    - Go to Google Play Console
echo    - Your App -^> Release -^> Setup -^> App Integrity
echo    - Copy SHA-1 and SHA-256 from "App signing key certificate"
echo    - Add to Firebase Console
echo.
echo ================================================================
echo.

pause
