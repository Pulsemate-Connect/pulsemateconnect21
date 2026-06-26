@echo off
echo ========================================
echo Downloading Correct Keystore from EAS
echo ========================================
echo.
echo This will download the keystore that matches Play Console expectations
echo Expected SHA1: 67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D
echo.
echo MANUAL STEPS NEEDED:
echo 1. When prompted, select: production
echo 2. Then select: credentials.json
echo 3. Then select: Download credentials from EAS to credentials.json
echo 4. Choose the keystore with SHA1 ending in ...8B:8D
echo.
pause
eas credentials -p android
echo.
echo Done! Now check credentials.json and rebuild
pause
