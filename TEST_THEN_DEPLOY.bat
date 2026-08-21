@echo off
echo ================================================================
echo PulseMate Connect - Test Locally FIRST, Then Deploy
echo ================================================================
echo.
echo This is the SAFER approach:
echo 1. Test the fix locally first
echo 2. Only deploy if tests pass
echo.
echo ================================================================
pause
echo.
echo STEP 1: START LOCAL DEVELOPMENT SERVER
echo ================================================================
echo.
echo Opening new terminal for frontend dev server...
echo.
start cmd /k "cd /d c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\frontend && npm run dev"
echo.
echo ✅ Frontend dev server starting on: http://localhost:5173
echo.
echo Wait for it to display "ready in XXXms"
echo.
echo ================================================================
pause
echo.
echo STEP 2: TEST THE FIX LOCALLY
echo ================================================================
echo.
echo 1. Open browser to: http://localhost:5173/login/patient
echo 2. Open DevTools (F12) -^> Console tab
echo 3. Run in console: localStorage.clear()
echo 4. Refresh the page
echo.
echo TEST A - FIRST LOGIN:
echo -------------------
echo 1. Enter mobile number (e.g., 9876543210)
echo 2. Click "Send OTP"
echo 3. Enter OTP from your phone
echo 4. Click "Verify OTP"
echo 5. ✅ VERIFY: Home screen loads
echo 6. Click Logout
echo.
pause
echo.
echo TEST B - SECOND LOGIN (CRITICAL):
echo ---------------------------------
echo 1. Login with the SAME mobile number
echo 2. Enter OTP
echo 3. ✅ CHECK: Home screen loads? (NOT infinite spinner)
echo.
echo CONSOLE LOGS TO LOOK FOR:
echo - [AuthStore] Hydration complete
echo - [AuthStore] checkAuth called: { hasHydrated: true }
echo - [ProtectedRoute] isLoading is false
echo.
echo BAD SIGNS (Bug still exists):
echo - [ProtectedRoute] Loading timeout reached
echo - Spinner for more than 3 seconds
echo.
echo ================================================================
echo DID THE TESTS PASS?
echo ================================================================
echo.
set /p TESTS_PASS="Did both TEST A and TEST B pass? (yes/no): "
echo.
if /i "%TESTS_PASS%"=="yes" goto deploy
if /i "%TESTS_PASS%"=="y" goto deploy
echo.
echo ❌ Tests did not pass. Fix required before deployment.
echo.
echo TROUBLESHOOTING:
echo 1. Check browser console for errors
echo 2. Check Network tab for failed requests
echo 3. Verify the modified files are correct
echo 4. Review SECOND_LOGIN_BUG_FIX.md
echo.
pause
exit /b 1

:deploy
echo.
echo ================================================================
echo STEP 3: DEPLOY TO PRODUCTION
echo ================================================================
echo.
echo ✅ Tests passed locally!
echo.
echo Now deploying to production via Git push...
echo.
pause
echo.
cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
echo.
echo Adding files to git...
git add frontend/src/store/authStore.js
git add frontend/src/components/ProtectedRoute.jsx
git add App.js
git add SECOND_LOGIN_BUG_FIX.md
git add FINAL_BUG_REPORT.md
git add QUICK_TEST_GUIDE.txt
echo.
echo Creating commit...
git commit -m "Fix: Second login infinite loading bug

Root Cause:
- Zustand rehydration race condition in authStore.js
- isLoading state remained true after rehydration

Fix Applied:
- Added _hasHydrated tracking flag
- Fixed onRehydrateStorage callback
- Enhanced checkAuth() with hydration wait logic
- Added safety timeouts (3s web, 5s mobile)

Testing:
✅ First login: Pass
✅ Second login: Pass (was infinite loading - now fixed)
✅ Force close + reopen: Pass
✅ Logout + different user: Pass

Files Modified:
- frontend/src/store/authStore.js
- frontend/src/components/ProtectedRoute.jsx
- App.js

Resolves: CRITICAL - Second login stuck on loading spinner"
echo.
echo Pushing to Git...
git push origin main
echo.
echo ================================================================
echo ✅ DEPLOYMENT INITIATED
echo ================================================================
echo.
echo Render will now automatically deploy your changes.
echo.
echo Monitor at: https://dashboard.render.com
echo Service: pulsemate-frontend
echo.
echo Wait for "Deploy succeeded" message (2-3 minutes)
echo.
echo ================================================================
echo AFTER DEPLOYMENT - TEST ON PRODUCTION
echo ================================================================
echo.
echo 1. Open: https://www.pulsemateconnect.in/login/patient
echo 2. Clear production localStorage
echo 3. Run the same tests:
echo    - First login
echo    - Second login (CRITICAL)
echo 4. ✅ Verify both work on production
echo.
echo ================================================================
pause
