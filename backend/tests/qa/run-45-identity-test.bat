@echo off
echo ============================================================================
echo PulseMate Connect - 45 Identity Comprehensive E2E Test Suite
echo ============================================================================
echo.

REM Check if .env file exists
if not exist "..\..\..\.env" (
    echo ERROR: .env file not found!
    echo Please create .env file with test configuration.
    echo See README_45_IDENTITY_TEST.md for details.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "..\..\..\node_modules" (
    echo WARNING: node_modules not found!
    echo Running npm install...
    cd ..\..
    call npm install
    cd tests\qa
)

REM Check if backend server is running
echo Checking if backend server is running...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Backend server is not running!
    echo Please start the backend server before running tests.
    echo.
    echo Run in another terminal:
    echo   cd backend
    echo   npm run dev
    echo.
    pause
    exit /b 1
)

echo Backend server is running.
echo.
echo Starting 45 Identity Comprehensive Test...
echo This will take approximately 10-15 minutes.
echo.
echo Test will create:
echo   - 20 Clinic Owner accounts
echo   - 20 Clinic records
echo   - 25 Doctor accounts
echo   - 25 Doctor profiles
echo.
echo Reports will be saved to: tests\qa\reports\
echo.

REM Run the test
cd ..\..
node tests\qa\45-identity-comprehensive-test.js

echo.
echo ============================================================================
echo Test execution completed!
echo Check reports folder for detailed results.
echo ============================================================================
echo.
pause

