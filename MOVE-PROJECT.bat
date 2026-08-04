@echo off
echo ============================================================
echo MOVING PROJECT TO SHORTER PATH
echo ============================================================
echo.
echo From: C:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21
echo To:   C:\pm\pulsemateconnect21
echo.
echo This will:
echo 1. Create C:\pm folder
echo 2. Copy entire project (preserving .git)
echo 3. You can delete old folder after verifying
echo.
pause
echo.
echo Creating C:\pm folder...
mkdir C:\pm 2>nul
echo.
echo Copying project files... (this may take 2-3 minutes)
xcopy "%~dp0." "C:\pm\pulsemateconnect21\" /E /I /H /Y /EXCLUDE:%~dp0.gitignore
echo.
echo ============================================================
echo COPY COMPLETE!
echo ============================================================
echo.
echo NEXT STEPS:
echo.
echo 1. Close this VS Code window
echo 2. Open VS Code from: C:\pm\pulsemateconnect21
echo 3. In new location, open terminal and run:
echo    cd android
echo    .\gradlew clean
echo    .\gradlew assembleRelease
echo.
echo 4. After successful build, you can delete old folder:
echo    C:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21
echo.
pause
