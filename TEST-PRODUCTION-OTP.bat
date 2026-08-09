@echo off
REM ============================================================================
REM TEST MESSAGE CENTRAL OTP - PRODUCTION BACKEND
REM ============================================================================

echo.
echo ========================================================================
echo MESSAGE CENTRAL OTP - PRODUCTION TEST
echo ========================================================================
echo.
echo This will test if Message Central OTP works on your production backend
echo (https://api.pulsemateconnect.in)
echo.
echo Prerequisites:
echo - Environment variables added to Render dashboard
echo - Render deployment completed successfully
echo.
echo ========================================================================
echo.

set /p READY="Have you added env vars to Render and deployment completed? (yes/no): "

if /i not "%READY%"=="yes" (
    echo.
    echo Please complete these steps first:
    echo 1. Go to https://dashboard.render.com/
    echo 2. Add MESSAGE_CENTRAL_CUSTOMER_ID, MESSAGE_CENTRAL_PASSWORD, MESSAGE_CENTRAL_BASE_URL
    echo 3. Wait for deployment to complete
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo TEST 1: SEND OTP
echo ========================================================================
echo.

set /p PHONE="Enter your 10-digit mobile number (e.g., 9876543210): "

if "%PHONE%"=="" (
    echo ERROR: Phone number is required
    pause
    exit /b 1
)

echo.
echo Sending OTP to +91%PHONE%...
echo API: https://api.pulsemateconnect.in/api/auth/patient/send-otp
echo.

curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"mobileNumber\": \"%PHONE%\"}"

echo.
echo.
echo ========================================================================
echo RESULT ANALYSIS
echo ========================================================================
echo.
echo If you see:
echo   "success": true  → OTP sent successfully! Check your phone for SMS
echo   "verificationId": "xxx" → Copy this ID for next test
echo.
echo If you see an error:
echo   500 error → Check Render logs, env vars might be wrong
echo   "Failed to generate token" → MESSAGE_CENTRAL_PASSWORD is incorrect
echo   "Invalid mobile number" → Check phone number format
echo.
echo ========================================================================
echo.

set /p SMS_RECEIVED="Did you receive SMS on your phone? (yes/no): "

if /i not "%SMS_RECEIVED%"=="yes" (
    echo.
    echo SMS NOT RECEIVED - Troubleshooting:
    echo.
    echo 1. Check Render logs: https://dashboard.render.com/
    echo 2. Verify Message Central credentials are correct
    echo 3. Check Message Central dashboard for credits
    echo 4. Try a different phone number
    echo.
    echo Next: Fix the issue and run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo TEST 2: VERIFY OTP
echo ========================================================================
echo.

set /p VERIFICATION_ID="Enter verificationId from above response: "
set /p OTP="Enter 6-digit OTP from SMS: "

if "%VERIFICATION_ID%"=="" (
    echo ERROR: Verification ID is required
    pause
    exit /b 1
)

if "%OTP%"=="" (
    echo ERROR: OTP is required
    pause
    exit /b 1
)

echo.
echo Verifying OTP...
echo API: https://api.pulsemateconnect.in/api/auth/patient/verify-otp
echo.

curl -X POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"verificationId\": \"%VERIFICATION_ID%\", \"otp\": \"%OTP%\", \"mobileNumber\": \"+91%PHONE%\"}"

echo.
echo.
echo ========================================================================
echo RESULT ANALYSIS
echo ========================================================================
echo.
echo If you see:
echo   "success": true → OTP verified successfully!
echo   "accessToken": "xxx" → JWT token generated
echo   "user": {...} → User created/logged in
echo.
echo If you see an error:
echo   "Invalid OTP" → Wrong OTP entered
echo   "OTP expired" → OTP expired (60 seconds), request new one
echo   "Already verified" → OTP already used, request new one
echo.
echo ========================================================================
echo.

set /p VERIFIED="Did OTP verification succeed with JWT tokens? (yes/no): "

if /i not "%VERIFIED%"=="yes" (
    echo.
    echo VERIFICATION FAILED - Check the error message above
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo ✅ SUCCESS! MESSAGE CENTRAL OTP IS WORKING ON PRODUCTION!
echo ========================================================================
echo.
echo What was tested:
echo  ✅ Backend API is live and responding
echo  ✅ Message Central authentication working
echo  ✅ SMS delivery working
echo  ✅ OTP verification working
echo  ✅ User creation/login working
echo  ✅ JWT token generation working
echo.
echo This means:
echo  ✅ Backend is ready for mobile app
echo  ✅ Message Central integration is complete
echo  ✅ Production environment is properly configured
echo.
echo ========================================================================
echo NEXT STEPS: BUILD MOBILE APP
echo ========================================================================
echo.
echo Now you can proceed with building the mobile app that uses Message Central.
echo.
echo Options:
echo.
echo OPTION 1: Test with existing Firebase app first
echo   - Keep using current app with Firebase
echo   - Build Message Central version separately
echo   - Compare both before switching
echo.
echo OPTION 2: Build Message Central app now
echo   - Update login screens to use Message Central
echo   - Build new APK with Message Central
echo   - Test on device
echo   - Deploy to Play Store
echo.
echo ========================================================================
echo.
echo Ready to build? Read: BUILD-MESSAGE-CENTRAL-APP.md for instructions
echo.

pause
