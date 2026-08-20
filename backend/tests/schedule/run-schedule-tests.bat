@echo off
echo ========================================
echo Running Clinic Schedule Test Suite
echo ========================================
echo.

REM Check if backend server is running
echo Checking if backend server is running...
curl -s http://localhost:5000/health > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend server is not running!
    echo Please start the backend server with: npm run dev
    echo.
    pause
    exit /b 1
)

echo Backend server is running ✓
echo.

REM Run the tests
node clinic-schedule.test.js

pause
