@echo off
echo ============================================================
echo OPENING APP IN EMULATOR
echo ============================================================
echo.
echo Checking emulator status...
adb devices
echo.
echo Checking if Expo Go is installed...
adb -s emulator-5554 shell pm list packages | findstr expo.client
if errorlevel 1 (
    echo.
    echo ============================================================
    echo Expo Go is NOT installed on the emulator
    echo ============================================================
    echo.
    echo Installing Expo Go APK...
    echo Downloading from web...
    echo.
    echo NOTE: Manual installation required:
    echo 1. Open emulator browser
    echo 2. Go to: https://expo.dev/go
    echo 3. Download Expo Go APK
    echo 4. Install it
    echo.
    echo OR use this command to download and install:
    echo adb -s emulator-5554 install expo-go.apk
    echo.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo Opening Expo Go with development URL...
echo ============================================================
echo.
adb -s emulator-5554 shell am start -a android.intent.action.VIEW -d "exp://192.168.31.240:8081"
if errorlevel 1 (
    echo.
    echo Failed to open with deep link. Opening Expo Go manually...
    adb -s emulator-5554 shell monkey -p host.exp.exponent 1
)
echo.
echo ============================================================
echo Done! The app should open in Expo Go
echo ============================================================
echo.
echo If the app doesn't load:
echo 1. Open Expo Go manually on emulator
echo 2. Scan QR code from Metro terminal
echo 3. Or enter URL manually: 192.168.31.240:8081
echo.
pause
