@echo off
echo ========================================
echo Testing Backend OTP Endpoint Directly
echo ========================================
echo.

REM Test with the exact phone number from logs
set PHONE=+917022818878

echo Phone number: %PHONE%
echo.
echo Sending request to backend...
echo.

curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"%PHONE%\"}" ^
  -v

echo.
echo ========================================
echo.
echo If you see "Mobile number is required", the backend
echo is not receiving or parsing the phone field correctly.
echo.
pause
