@echo off
echo ================================================
echo   Copy Project to Short Path C:\pm\app
echo ================================================
echo.

echo This will copy your project to C:\pm\app
echo This solves the Windows 260-character path limit.
echo.
echo Estimated time: 2-5 minutes
echo.

choice /C YN /M "Continue"
if errorlevel 2 goto :end
if errorlevel 1 goto :copy

:copy
echo.
echo Creating directory...
if not exist "C:\pm" mkdir "C:\pm"

echo.
echo Copying project files...
echo Please wait (this takes 2-5 minutes due to node_modules)...
echo.

xcopy "%~dp0" "C:\pm\app\" /E /H /I /Y /Q

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Copy failed!
    pause
    exit /b 1
)

echo.
echo ✅ Project copied successfully!
echo.
echo New location: C:\pm\app
echo.
echo ================================================
echo   NEXT STEP: Build the AAB
echo ================================================
echo.
echo Option 1: Double-click BUILD-FROM-SHORT-PATH.bat
echo.
echo Option 2: Manual commands:
echo   cd C:\pm\app\android
echo   gradlew clean
echo   gradlew bundleRelease
echo.
echo AAB will be at:
echo   C:\pm\app\android\app\build\outputs\bundle\release\app-release.aab
echo.
pause

:end
