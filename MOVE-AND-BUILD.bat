@echo off
echo ============================================================
echo FIX: Windows Path Length Issue
echo ============================================================
echo.
echo Current path is TOO LONG for Windows build tools:
echo C:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21
echo.
echo SOLUTION: Move project to shorter path
echo.
echo Recommended new path: C:\pm\pulsemateconnect21
echo.
echo ============================================================
echo MANUAL STEPS:
echo ============================================================
echo.
echo 1. Close VS Code and all terminals
echo 2. Create folder: C:\pm
echo 3. Move entire project folder there
echo 4. Final path should be: C:\pm\pulsemateconnect21
echo 5. Open project from new location
echo 6. Run: cd android
echo 7. Run: gradlew clean
echo 8. Run: gradlew assembleRelease
echo.
echo ============================================================
echo OR use this automated command (copy to new terminal):
echo ============================================================
echo.
echo mkdir C:\pm
echo xcopy "C:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21" "C:\pm\pulsemateconnect21\" /E /I /H /Y
echo cd C:\pm\pulsemateconnect21\android
echo gradlew clean
echo gradlew assembleRelease
echo.
pause
