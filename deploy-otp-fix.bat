@echo off
echo ========================================
echo  DEPLOYING OTP RATE LIMIT FIX
echo ========================================
echo.
echo This will:
echo 1. Commit the rate limit fixes
echo 2. Push to main branch
echo 3. Trigger automatic Render deployment
echo.
pause

cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

echo.
echo [1/3] Adding changed files...
git add backend\src\middleware\rateLimit.middleware.js
git add backend\src\routes\auth.routes.js
git add backend\src\controllers\auth.controller.js

echo.
echo [2/3] Committing changes...
git commit -m "fix(auth): Correct OTP rate limiting with phone-based limits - Add dedicated otpSendLimiter (5/hour per phone) - Add dedicated otpVerifyLimiter (10/15min per phone) - Remove IP-based limiting to fix NAT/corporate network issues - Remove redundant database rate limiting - Fix 'Too many requests' error after 30 minutes"

echo.
echo [3/3] Pushing to repository...
git push origin main

echo.
echo ========================================
echo  DEPLOYMENT INITIATED!
echo ========================================
echo.
echo Next steps:
echo 1. Monitor Render dashboard: https://dashboard.render.com
echo 2. Wait for "Build successful" and "Live" status
echo 3. Test OTP flow with mobile app
echo.
echo The fix will be live in ~5-10 minutes.
echo.
pause
