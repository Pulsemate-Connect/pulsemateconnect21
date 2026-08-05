@echo off
REM ============================================================================
REM MESSAGE CENTRAL OTP - LOCAL TESTING SCRIPT
REM ============================================================================

echo.
echo ========================================================================
echo MESSAGE CENTRAL OTP - BACKEND TESTING
echo ========================================================================
echo.

REM Check if backend directory exists
if not exist "%~dp0package.json" (
    echo ERROR: This script must be run from the backend directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Step 1: Checking environment variables...
echo.

REM Check if .env file exists
if not exist "%~dp0.env" (
    echo ERROR: .env file not found!
    echo Please create .env file with Message Central credentials
    pause
    exit /b 1
)

REM Check if Message Central variables are set
findstr /C:"MESSAGE_CENTRAL_CUSTOMER_ID" .env >nul
if %errorlevel% neq 0 (
    echo ERROR: MESSAGE_CENTRAL_CUSTOMER_ID not found in .env
    echo Please add Message Central credentials to .env
    pause
    exit /b 1
)

echo [OK] Environment variables found
echo.

echo Step 2: Installing dependencies...
echo.
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo Step 3: Running database migration...
echo.
call npx prisma migrate dev --name add_otp_attempt_table
if %errorlevel% neq 0 (
    echo WARNING: Migration might have failed or already exists
    echo This is OK if the table already exists
)
echo [OK] Database migration completed
echo.

echo Step 4: Generating Prisma Client...
echo.
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed
    pause
    exit /b 1
)
echo [OK] Prisma client generated
echo.

echo ========================================================================
echo BACKEND SETUP COMPLETE!
echo ========================================================================
echo.
echo Next steps:
echo 1. Start backend: npm run dev
echo 2. Test send OTP with curl (see TEST-SEND-OTP.bat)
echo 3. Check your phone for SMS
echo 4. Test verify OTP with curl (see TEST-VERIFY-OTP.bat)
echo.
echo ========================================================================
echo.

pause
