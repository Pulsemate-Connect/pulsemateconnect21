@echo off
echo ========================================
echo Testing Send OTP API Directly
echo ========================================
echo.

REM Test phone number
set PHONE=+919876543210

echo Testing: POST /api/auth/patient/send-otp
echo Phone: %PHONE%
echo.

curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"%PHONE%\"}" ^
  --verbose

echo.
echo ========================================
echo Test complete!
echo ========================================
pause
