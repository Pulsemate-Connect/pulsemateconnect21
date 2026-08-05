@echo off
REM ============================================================================
REM TEST MESSAGE CENTRAL - SEND OTP
REM ============================================================================

echo.
echo ========================================================================
echo MESSAGE CENTRAL - SEND OTP TEST
echo ========================================================================
echo.

set /p PHONE_NUMBER="Enter 10-digit mobile number (e.g., 9876543210): "

if "%PHONE_NUMBER%"=="" (
    echo ERROR: Phone number is required
    pause
    exit /b 1
)

echo.
echo Sending OTP to +91%PHONE_NUMBER%...
echo.

curl -X POST http://localhost:5000/api/auth/patient/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"mobileNumber\": \"%PHONE_NUMBER%\"}"

echo.
echo.
echo ========================================================================
echo If successful, you should see:
echo {
echo   "success": true,
echo   "data": {
echo     "verificationId": "some-id",
echo     "expiresIn": 60,
echo     "message": "OTP sent successfully"
echo   }
echo }
echo ========================================================================
echo.
echo Next: Check your phone for SMS, then run TEST-VERIFY-OTP.bat
echo.

pause
