@echo off
echo ============================================
echo   DOWNLOAD PRODUCTION KEYSTORE FROM EAS
echo ============================================
echo.
echo This will download the keystore file needed for building.
echo.
echo INSTRUCTIONS:
echo 1. Select platform: Android
echo 2. Select build profile: production  
echo 3. Select: credentials.json: Upload/Download credentials
echo 4. Select: Download credentials from EAS to credentials.json
echo 5. Press any key to exit after download completes
echo.
echo ============================================
echo.
pause
eas credentials
echo.
echo ============================================
echo   Verifying keystore downloaded...
echo ============================================
echo.
if exist "android\app\pulsemate-release-key.keystore" (
    echo [SUCCESS] Keystore file found!
    echo Location: android\app\pulsemate-release-key.keystore
) else (
    echo [ERROR] Keystore file NOT found!
    echo Please run this script again and follow the prompts.
)
echo.
pause
