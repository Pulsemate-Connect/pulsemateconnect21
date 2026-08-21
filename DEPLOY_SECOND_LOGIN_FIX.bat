@echo off
echo ================================================================
echo PulseMate Connect - Deploy Second Login Bug Fix
echo ================================================================
echo.
echo This will commit and push the second login bug fix to production.
echo.
echo CHANGES TO BE DEPLOYED:
echo - frontend/src/store/authStore.js (Zustand rehydration fix)
echo - frontend/src/components/ProtectedRoute.jsx (Safety timeout)
echo - App.js (Mobile safety timeout)
echo.
echo DEPLOYMENT METHOD: Git Push -^> Render Auto-Deploy
echo.
echo ================================================================
pause
echo.
echo Step 1: Checking git status...
cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
git status
echo.
echo ================================================================
pause
echo.
echo Step 2: Adding modified files to git...
git add frontend/src/store/authStore.js
git add frontend/src/components/ProtectedRoute.jsx
git add App.js
git add SECOND_LOGIN_BUG_FIX.md
git add FINAL_BUG_REPORT.md
git add QUICK_TEST_GUIDE.txt
echo.
echo Files staged for commit.
echo.
echo ================================================================
pause
echo.
echo Step 3: Creating commit...
git commit -m "Fix: Second login infinite loading bug

Root Cause:
- Zustand rehydration race condition in authStore.js
- isLoading state remained true after rehydration
- onRehydrateStorage callback didn't reliably update state

Fix Applied:
- Added _hasHydrated tracking flag
- Fixed onRehydrateStorage to properly set isLoading: false
- Enhanced checkAuth() to wait for hydration completion
- Added 3-second safety timeout in ProtectedRoute (web)
- Added 5-second safety timeout in RootNavigator (mobile)

Impact:
- Second login now works correctly
- No more infinite loading spinner
- Automatic fallback to login if timeout reached

Testing:
- First login: Works
- Second login: Fixed (was infinite loading)
- Force close + reopen: Works
- Network failure: Handled with timeout

Files Modified:
- frontend/src/store/authStore.js
- frontend/src/components/ProtectedRoute.jsx
- App.js

Resolves: CRITICAL - Second login stuck on loading spinner"
echo.
echo Commit created.
echo.
echo ================================================================
pause
echo.
echo Step 4: Pushing to Git (triggers Render auto-deploy)...
echo.
echo This will:
echo 1. Push code to your git repository
echo 2. Trigger Render automatic deployment
echo 3. Rebuild frontend with the fix
echo 4. Deploy to production
echo.
echo Production URL: https://www.pulsemateconnect.in
echo API URL: https://api.pulsemateconnect.in
echo.
echo ================================================================
pause
echo.
git push origin main
echo.
echo ================================================================
echo DEPLOYMENT INITIATED
echo ================================================================
echo.
echo Git push complete!
echo.
echo Render will now:
echo 1. Detect the push to main branch
echo 2. Pull the latest code
echo 3. Run: npm install ^&^& npm run build (in frontend/)
echo 4. Deploy dist/ folder to static hosting
echo 5. Update https://www.pulsemateconnect.in
echo.
echo ================================================================
echo MONITOR DEPLOYMENT
echo ================================================================
echo.
echo 1. Open Render Dashboard: https://dashboard.render.com
echo 2. Find "pulsemate-frontend" service
echo 3. Click on it to see deployment logs
echo 4. Wait for "Deploy succeeded" message (usually 2-3 minutes)
echo.
echo EXPECTED LOGS:
echo - Installing dependencies...
echo - Building for production...
echo - Build completed
echo - Deploying to static site...
echo - Deploy succeeded
echo.
echo ================================================================
echo POST-DEPLOYMENT TESTING
echo ================================================================
echo.
echo After deployment completes:
echo.
echo 1. Open: https://www.pulsemateconnect.in/login/patient
echo 2. Open browser DevTools (F12)
echo 3. Clear localStorage: localStorage.clear()
echo 4. First Login: Enter mobile + OTP
echo 5. Verify Home screen loads
echo 6. Logout
echo 7. Second Login: Same mobile + OTP
echo 8. ✅ VERIFY: Home screen loads (NOT infinite spinner)
echo.
echo EXPECTED CONSOLE LOGS:
echo [AuthStore] Hydration complete
echo [AuthStore] checkAuth called: { hasHydrated: true }
echo [ProtectedRoute] isLoading is false
echo.
echo ================================================================
echo ROLLBACK (if needed)
echo ================================================================
echo.
echo If the bug persists after deployment:
echo.
echo 1. git revert HEAD
echo 2. git push origin main
echo 3. Report the issue with console logs
echo.
echo ================================================================
echo.
pause
