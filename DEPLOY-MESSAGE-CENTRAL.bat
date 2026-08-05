@echo off
REM ============================================================================
REM DEPLOY MESSAGE CENTRAL TO PRODUCTION (RENDER)
REM ============================================================================

echo.
echo ========================================================================
echo MESSAGE CENTRAL DEPLOYMENT TO RENDER
echo ========================================================================
echo.
echo This script will guide you through deploying Message Central backend
echo to your Render production server.
echo.
echo ========================================================================
echo.

echo STEP 1: LOCAL TESTING STATUS
echo.
echo Have you tested the backend locally?
echo - Run: backend\TEST-MESSAGE-CENTRAL.bat
echo - Run: backend\TEST-SEND-OTP.bat
echo - Run: backend\TEST-VERIFY-OTP.bat
echo.
set /p LOCAL_TESTED="Did you complete local testing? (yes/no): "

if /i not "%LOCAL_TESTED%"=="yes" (
    echo.
    echo ERROR: Please test locally first before deploying to production!
    echo.
    echo Run these scripts in order:
    echo 1. backend\TEST-MESSAGE-CENTRAL.bat
    echo 2. backend\TEST-SEND-OTP.bat
    echo 3. backend\TEST-VERIFY-OTP.bat
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo STEP 2: ADD ENVIRONMENT VARIABLES TO RENDER
echo ========================================================================
echo.
echo You need to add Message Central credentials to Render dashboard.
echo.
echo 1. Open: https://dashboard.render.com/
echo 2. Select your backend service (pulsemateconnect-api)
echo 3. Click "Environment" tab
echo 4. Add these 3 variables:
echo.
echo    Variable Name: MESSAGE_CENTRAL_CUSTOMER_ID
echo    Value: C-B6442109CBD3438
echo.
echo    Variable Name: MESSAGE_CENTRAL_PASSWORD
echo    Value: eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
echo.
echo    Variable Name: MESSAGE_CENTRAL_BASE_URL
echo    Value: https://cpaas.messagecentral.com
echo.
echo 5. Click "Save Changes"
echo 6. Wait for Render to restart (2-3 minutes)
echo.
set /p RENDER_ENV_ADDED="Have you added environment variables to Render? (yes/no): "

if /i not "%RENDER_ENV_ADDED%"=="yes" (
    echo.
    echo Please add environment variables to Render first!
    echo Instructions above ^
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo STEP 3: COMMIT AND PUSH CODE TO GITHUB
echo ========================================================================
echo.
echo Committing backend changes...
echo.

git add backend/
git add MESSAGE-CENTRAL-*.md
git add CURRENT-STATUS.md
git add DEPLOY-MESSAGE-CENTRAL.bat

if %errorlevel% neq 0 (
    echo ERROR: git add failed
    echo Make sure you're in the project directory
    pause
    exit /b 1
)

git commit -m "Add Message Central OTP backend implementation"

if %errorlevel% neq 0 (
    echo WARNING: git commit failed (might be no changes or already committed)
)

echo.
echo Pushing to GitHub...
echo.

git push origin main

if %errorlevel% neq 0 (
    echo ERROR: git push failed
    echo.
    echo Possible reasons:
    echo - Not logged in to GitHub
    echo - No internet connection
    echo - Wrong branch name
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Code pushed to GitHub successfully!
echo.
echo ========================================================================
echo STEP 4: WAIT FOR RENDER DEPLOYMENT
echo ========================================================================
echo.
echo Render will automatically detect the push and deploy.
echo.
echo 1. Open: https://dashboard.render.com/
echo 2. Go to your backend service
echo 3. Check "Events" tab for deployment progress
echo 4. Wait for "Deploy succeeded" message (5-10 minutes)
echo.
set /p RENDER_DEPLOYED="Has Render deployment completed? (yes/no): "

if /i not "%RENDER_DEPLOYED%"=="yes" (
    echo.
    echo Please wait for Render deployment to complete!
    echo Check: https://dashboard.render.com/
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo STEP 5: TEST PRODUCTION APIS
echo ========================================================================
echo.
echo Testing production send-otp endpoint...
echo.

set /p TEST_PHONE="Enter test phone number (10 digits): "

echo.
echo Sending OTP to production backend...
echo.

curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"mobileNumber\": \"%TEST_PHONE%\"}"

echo.
echo.
echo Did you receive SMS? Check your phone!
echo.
set /p SMS_RECEIVED="Did you receive the OTP SMS? (yes/no): "

if /i not "%SMS_RECEIVED%"=="yes" (
    echo.
    echo WARNING: SMS not received!
    echo.
    echo Troubleshooting:
    echo 1. Check Render logs for errors
    echo 2. Verify environment variables are correct
    echo 3. Check Message Central dashboard for API issues
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo SUCCESS! MESSAGE CENTRAL DEPLOYED!
echo ========================================================================
echo.
echo Backend deployment complete and tested!
echo.
echo What's working:
echo - Message Central OTP service
echo - Send OTP API
echo - SMS delivery
echo.
echo Next steps:
echo 1. Test verify OTP with production API
echo 2. Start building frontend (React Native app)
echo 3. Update login screens to use Message Central
echo.
echo Documentation:
echo - MESSAGE-CENTRAL-BACKEND-READY.md
echo - MESSAGE-CENTRAL-MIGRATION-PLAN.md
echo.
echo ========================================================================
echo.

pause
