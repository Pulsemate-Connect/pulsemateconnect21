@echo off
echo ============================================================
echo  SIMPLE AAB BUILD - Copy and Build
echo ============================================================
echo.
echo This will:
echo 1. Copy project to C:\pm\app
echo 2. Remove problematic Firebase packages
echo 3. Build AAB with Gradle
echo 4. Copy AAB to Desktop
echo.
pause

:: Step 1: Copy project
echo.
echo [1/4] Copying project to C:\pm\app...
if exist "C:\pm\app" rmdir /s /q "C:\pm\app" 2>nul
timeout /t 2 /nobreak >nul
mkdir "C:\pm" 2>nul
robocopy "%~dp0" "C:\pm\app" /E /NFL /NDL /NJH /NJS /nc /ns /np /XD node_modules .expo .git android\build android\app\build android\.gradle .gradle build /XF *.log
echo SUCCESS

:: Step 2: Go to build directory
cd /d "C:\pm\app"

:: Step 3: Remove problematic packages
echo.
echo [2/4] Removing Firebase reCAPTCHA packages...
call npm uninstall expo-firebase-recaptcha expo-firebase-core --legacy-peer-deps 2>nul
echo SUCCESS

:: Step 4: Build AAB
echo.
echo [3/4] Building AAB (this takes 10-15 minutes)...
echo Started: %time%
cd android
call gradlew.bat bundleRelease

if %errorlevel% neq 0 (
    echo BUILD FAILED - Check errors above
    cd ..
    pause
    exit /b 1
)

cd ..

:: Step 5: Copy AAB to Desktop
echo.
echo [4/4] Copying AAB to Desktop...
set AAB=android\app\build\outputs\bundle\release\app-release.aab
if exist "%AAB%" (
    copy "%AAB%" "%USERPROFILE%\Desktop\pulsemateconnect-production.aab" >nul
    echo.
    echo ============================================================
    echo  SUCCESS!
    echo ============================================================
    echo.
    echo AAB saved to: %USERPROFILE%\Desktop\pulsemateconnect-production.aab
    echo Completed: %time%
    echo.
    echo Next: Upload to Play Store Internal Testing
    echo.
) else (
    echo ERROR: AAB not found
)

pause
