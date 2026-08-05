@echo off
echo ========================================
echo Installing PulseMate AAB on Emulator
echo ========================================
echo.

echo Step 1: Converting AAB to Universal APK...
java -jar bundletool.jar build-apks --bundle=pulsemate-production.aab --output=pulsemate.apks --mode=universal --ks android\app\debug.keystore --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android

echo.
echo Step 2: Extracting Universal APK...
powershell -Command "Expand-Archive -Path pulsemate.apks -DestinationPath extracted_apks -Force"

echo.
echo Step 3: Installing on Emulator...
adb install extracted_apks\universal.apk

echo.
echo Step 4: Cleaning up temporary files...
del /Q pulsemate.apks
rd /S /Q extracted_apks

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo You can now open PulseMate Connect on your emulator!
echo.
pause
