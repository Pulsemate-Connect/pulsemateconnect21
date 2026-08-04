@echo off
echo ═══════════════════════════════════════════════════════════════════════════════
echo  🔍 VERIFY FIX - Checking Imports
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

echo Checking Login2FactorScreen.jsx...
findstr /C:"from '../config/firebase'" src\screens\Login2FactorScreen.jsx >nul
if %errorlevel% equ 0 (
    echo ✅ Login2FactorScreen.jsx - CORRECT (Backend SMS)
) else (
    findstr /C:"from '../config/firebase-native'" src\screens\Login2FactorScreen.jsx >nul
    if %errorlevel% equ 0 (
        echo ❌ Login2FactorScreen.jsx - WRONG (Firebase JS SDK)
        echo    Should import from '../config/firebase'
    )
)

echo Checking LoginScreen.jsx...
findstr /C:"from '../config/firebase'" src\screens\LoginScreen.jsx >nul
if %errorlevel% equ 0 (
    echo ✅ LoginScreen.jsx - CORRECT (Backend SMS)
) else (
    findstr /C:"from '../config/firebase-native'" src\screens\LoginScreen.jsx >nul
    if %errorlevel% equ 0 (
        echo ❌ LoginScreen.jsx - WRONG (Firebase JS SDK)
        echo    Should import from '../config/firebase'
    )
)

echo Checking Otp2FactorScreen.jsx...
findstr /C:"from '../config/firebase'" src\screens\Otp2FactorScreen.jsx >nul
if %errorlevel% equ 0 (
    echo ✅ Otp2FactorScreen.jsx - CORRECT (Backend SMS)
) else (
    findstr /C:"from '../config/firebase-native'" src\screens\Otp2FactorScreen.jsx >nul
    if %errorlevel% equ 0 (
        echo ❌ Otp2FactorScreen.jsx - WRONG (Firebase JS SDK)
        echo    Should import from '../config/firebase'
    )
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo  VERIFICATION COMPLETE
echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo If all files show ✅, the fix is correctly applied.
echo If any show ❌, the imports need to be updated.
echo.
pause
