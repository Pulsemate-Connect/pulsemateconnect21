@echo off
REM ============================================================================
REM TEST MESSAGE CENTRAL - VERIFY OTP
REM ============================================================================

echo.
echo ========================================================================
echo MESSAGE CENTRAL - VERIFY OTP TEST
echo ========================================================================
echo.

set /p VERIFICATION_ID="Enter verification ID from send-otp response: "
set /p OTP_CODE="Enter 6-digit OTP from SMS: "
set /p PHONE_NUMBER="Enter mobile number with country code (e.g., +919876543210): "

if "%VERIFICATION_ID%"=="" (
    echo ERROR: Verification ID is required
    pause
    exit /b 1
)

if "%OTP_CODE%"=="" (
    echo ERROR: OTP code is required
    pause
    exit /b 1
)

if "%PHONE_NUMBER%"=="" (
    echo ERROR: Phone number is required
    pause
    exit /b 1
)

echo.
echo Verifying OTP...
echo.

curl -X POST http://localhost:5000/api/auth/patient/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"verificationId\": \"%VERIFICATION_ID%\", \"otp\": \"%OTP_CODE%\", \"mobileNumber\": \"%PHONE_NUMBER%\"}"

echo.
echo.
echo ========================================================================
echo If successful, you should see:
echo {
echo   "success": true,
echo   "data": {
echo     "accessToken": "eyJhbGc...",
echo     "refreshToken": "eyJhbGc...",
echo     "user": { ... }
echo   }
echo }
echo ========================================================================
echo.
echo SUCCESS! JWT tokens generated. User is logged in.
echo.

pause
