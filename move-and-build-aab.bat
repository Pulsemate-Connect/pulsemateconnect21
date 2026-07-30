@echo off
echo ================================================
echo   Move Project & Build AAB - Path Length Fix
echo ================================================
echo.

echo PROBLEM: Your project path is too long for Windows build tools.
echo Current: C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
echo.
echo SOLUTION: Move to shorter path C:\pm\app
echo.
choice /C YN /M "Do you want to move the project and build AAB"
if errorlevel 2 goto :cancel
if errorlevel 1 goto :move_project

:move_project
echo.
echo Step 1: Creating short path...
if not exist "C:\pm" mkdir "C:\pm"

echo.
echo Step 2: Moving project to C:\pm\app...
echo This will take a few minutes...
echo.

xcopy "%~dp0" "C:\pm\app\" /E /H /I /Y /Q

if %errorlevel% neq 0 (
    echo ERROR: Failed to copy project!
    pause
    exit /b 1
)

echo.
echo Project copied successfully!
echo.

echo Step 3: Copying keystore...
copy "%~dp0android\app\pulsemate-release-key.keystore" "C:\pm\app\android\app\" /Y

echo.
echo Step 4: Building AAB from new location...
echo.

cd /d "C:\pm\app\android"

call gradlew clean
if %errorlevel% neq 0 (
    echo ERROR: Clean failed!
    pause
    exit /b 1
)

call gradlew bundleRelease
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Step 5: Copying AAB to desktop...

copy "app\build\outputs\bundle\release\app-release.aab" "%USERPROFILE%\Desktop\pulsemateconnect-production.aab"

echo.
echo ================================================
echo   SUCCESS! AAB BUILT
echo ================================================
echo.
echo AAB Location: %USERPROFILE%\Desktop\pulsemateconnect-production.aab
echo New Project Location: C:\pm\app
echo.
echo NEXT STEPS:
echo 1. Get SHA-256: Run get-sha256.bat from C:\pm\app
echo 2. Add to Firebase Console
echo 3. Upload AAB to Play Store
echo.
echo TIP: Use C:\pm\app for future development (shorter path)
echo.
pause
goto :end

:cancel
echo.
echo Cancelled. No changes made.
echo.
echo Alternative: Use EAS cloud build (no path issues):
echo   eas build --platform android --profile production
echo.
pause

:end
