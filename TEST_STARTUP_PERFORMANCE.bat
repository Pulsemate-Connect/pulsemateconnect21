@echo off
echo ================================================================
echo PulseMate Connect - Startup Performance Test
echo ================================================================
echo.
echo FIXES APPLIED:
echo - Axios timeout: 30s -^> 10s
echo - Added 3s timeout to getMe API
echo - Safety timeout: 5s -^> 3s
echo - Added performance instrumentation
echo.
echo EXPECTED IMPROVEMENT: 67%% faster (5s -^> 1.5s)
echo.
echo ================================================================
echo PREREQUISITES
echo ================================================================
echo.
echo 1. Android device/emulator connected
echo 2. Backend running (local or production)
echo 3. Metro bundler will start automatically
echo.
pause
echo.
echo ================================================================
echo BUILDING AND RUNNING APP
echo ================================================================
echo.
cd /d "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
echo.
echo Starting build...
npx expo run:android
echo.
echo ================================================================
echo TESTING INSTRUCTIONS
echo ================================================================
echo.
echo The app should now be running on your device.
echo.
echo TEST 1: FRESH LOGIN
echo -------------------
echo 1. Uninstall the app first
echo 2. Install and open
echo 3. Time how long until login screen appears
echo 4. ✅ Should be ^< 1 second
echo 5. Complete OTP login
echo 6. Time until Home screen appears
echo 7. ✅ Should be ^< 3 seconds total
echo.
pause
echo.
echo TEST 2: WARM RETURN (Backend Active)
echo -------------------------------------
echo 1. Close app (don't logout)
echo 2. Reopen immediately
echo 3. Time until Home screen appears
echo 4. ✅ Should be ^< 2 seconds
echo.
pause
echo.
echo TEST 3: COLD RETURN (Backend Sleeping)
echo ---------------------------------------
echo 1. Close app
echo 2. Wait 20 minutes (Render backend goes cold)
echo 3. Reopen app
echo 4. Should timeout after 3 seconds
echo 5. ✅ Should show login screen (NOT infinite spinner)
echo 6. Login again
echo 7. ✅ Should reach Home
echo.
pause
echo.
echo TEST 4: NETWORK FAILURE
echo ------------------------
echo 1. Disable WiFi and mobile data
echo 2. Open app
echo 3. Should timeout after 3 seconds
echo 4. ✅ Should show login screen
echo 5. Enable network
echo 6. ✅ Should be able to login
echo.
pause
echo.
echo ================================================================
echo CHECKING PERFORMANCE LOGS
echo ================================================================
echo.
echo Opening log monitor...
echo Look for [PERF] and [PERF_AUTH] timestamps
echo.
start cmd /k "adb logcat | findstr /C:[PERF] /C:[AuthProvider] /C:[RootNavigator]"
echo.
echo EXPECTED LOGS:
echo [PERF] 0ms - APP_START
echo [PERF] 98ms - Core imports complete
echo [PERF_AUTH] 0ms - AuthProvider initializing
echo [PERF_AUTH] 78ms - SecureStore read complete
echo [PERF_AUTH] 1245ms - getMe API response received
echo [PERF_AUTH] 1250ms - Setting loading to false
echo [PERF] 1252ms - Loading complete
echo.
echo Total: ~1.2 seconds ✅
echo.
echo ================================================================
echo RESULTS
echo ================================================================
echo.
echo Fill in your results:
echo.
echo TEST 1 - Fresh Login Time: _______ seconds
echo TEST 2 - Warm Return Time: _______ seconds
echo TEST 3 - Cold Return: Showed login? YES / NO
echo TEST 4 - Network Failure: Showed login? YES / NO
echo.
echo Performance Improvement:
echo BEFORE: ~5 seconds
echo AFTER:  _______ seconds
echo.
echo ================================================================
pause
