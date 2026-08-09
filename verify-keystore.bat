@echo off
echo ========================================
echo Verify Which Keystore Has Correct SHA-1
echo ========================================
echo.
echo Target SHA-1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
echo.
echo ========================================
echo Testing Keystore 1: credentials\android\keystore.jks
echo ========================================
keytool -list -v -keystore "credentials\android\keystore.jks" | findstr /C:"SHA1:" /C:"SHA256:"
echo.
echo ========================================
echo Testing Keystore 2: @pulsemateconnect__pulsemate-app.jks
echo ========================================
keytool -list -v -keystore "@pulsemateconnect__pulsemate-app.jks" | findstr /C:"SHA1:" /C:"SHA256:"
echo.
echo ========================================
echo Testing Keystore 3: android\app\pulsemate-release-key.keystore
echo ========================================
keytool -list -v -keystore "android\app\pulsemate-release-key.keystore" | findstr /C:"SHA1:" /C:"SHA256:"
echo.
pause
