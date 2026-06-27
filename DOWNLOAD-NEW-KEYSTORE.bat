@echo off
echo ========================================
echo Downloading NEW Keystore for Patient App
echo ========================================
echo.
echo This will download the keystore for package: in.pulsemateconnect.patient
echo.
echo STEPS:
echo 1. When prompted, select: production
echo 2. Then select: credentials.json
echo 3. Then select: Download credentials from EAS to credentials.json
echo 4. Choose the NEWEST keystore (just created)
echo.
pause
eas credentials -p android
echo.
echo Done! Check credentials.json and credentials/android/keystore.jks
pause
