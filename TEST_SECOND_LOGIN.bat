@echo off
echo ================================================================
echo PulseMate Connect - Second Login Bug Test
echo ================================================================
echo.
echo This script will help you test the second login bug fix.
echo.
echo PREREQUISITES:
echo 1. Backend must be running
echo 2. Frontend dev server must be running (npm run dev)
echo 3. Browser with dev tools open
echo.
echo ================================================================
echo TEST SEQUENCE
echo ================================================================
echo.
echo TEST 1: FIRST LOGIN
echo -------------------
echo 1. Open browser to: http://localhost:5173/login/patient
echo 2. Press F12 to open Developer Console
echo 3. Clear localStorage: localStorage.clear()
echo 4. Refresh the page
echo 5. Enter mobile number: 9876543210 (or your test number)
echo 6. Complete OTP verification
echo 7. Verify Home screen loads correctly
echo 8. Logout from the app
echo.
pause
echo.
echo TEST 2: SECOND LOGIN (CRITICAL TEST)
echo ------------------------------------
echo 1. Login again with the SAME mobile number
echo 2. Complete OTP verification
echo 3. CHECK: Does Home screen load? (Should NOT show infinite spinner)
echo 4. CHECK: Look at console logs for:
echo    - [AuthStore] Hydration complete
echo    - [AuthStore] checkAuth called
echo    - [ProtectedRoute] isLoading is false
echo.
pause
echo.
echo TEST 3: FORCE CLOSE AND REOPEN
echo --------------------------------
echo 1. Make sure you are logged in
echo 2. Navigate to: http://localhost:5173/patient/home
echo 3. Close the browser completely
echo 4. Reopen browser
echo 5. Navigate to: http://localhost:5173/patient/home
echo 6. CHECK: Page should load immediately (user still logged in)
echo.
pause
echo.
echo TEST 4: LOGOUT -^> DIFFERENT USER
echo ----------------------------------
echo 1. Login as Patient A
echo 2. Note the user data shown
echo 3. Logout
echo 4. Login as Patient B (different number)
echo 5. CHECK: Patient B's data loads (NOT Patient A's data)
echo.
pause
echo.
echo ================================================================
echo CONSOLE LOGS TO LOOK FOR
echo ================================================================
echo.
echo GOOD SIGNS (Second login working):
echo   [AuthStore] onRehydrateStorage callback called
echo   [AuthStore] Hydration complete
echo   [AuthStore] checkAuth called: { hasHydrated: true }
echo   [AuthStore] Already authenticated, setting isLoading to false
echo   [ProtectedRoute] isLoading is false
echo.
echo BAD SIGNS (Bug still exists):
echo   [ProtectedRoute] isLoading is true, starting safety timeout
echo   [ProtectedRoute] Loading timeout reached
echo   (Infinite loading spinner)
echo.
echo ================================================================
echo TESTING COMPLETE
echo ================================================================
echo.
echo Did all tests pass?
echo - TEST 1 (First Login): ___________
echo - TEST 2 (Second Login): __________
echo - TEST 3 (Force Close): ___________
echo - TEST 4 (Different User): ________
echo.
echo If any test failed, check:
echo 1. Browser console for errors
echo 2. Network tab for failed requests
echo 3. Application tab -^> Local Storage for auth data
echo.
pause
