@echo off
echo ============================================================
echo Testing Production API - Message Central OTP
echo ============================================================
echo.

echo Test 1: Health Check
echo ------------------------------------
curl -s https://api.pulsemateconnect.in/health
echo.
echo.

echo Test 2: Send OTP Request
echo ------------------------------------
curl -s -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"mobileNumber\":\"9876543210\"}"
echo.
echo.

echo ============================================================
echo Test Complete
echo ============================================================
echo.
echo If you see "Failed to generate authentication token" above,
echo that means Message Central credentials need to be fixed.
echo.
echo See MESSAGE-CENTRAL-STATUS-CRITICAL.md for details.
echo ============================================================
pause
