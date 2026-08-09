@echo off
REM ============================================================================
REM START LOCAL DEVELOPMENT - Frontend Only
REM ============================================================================
REM 
REM This starts the frontend locally connected to production Render backend
REM 
REM WHAT THIS DOES:
REM - Runs frontend on http://localhost:3000
REM - Connects to backend at https://api.pulsemateconnect.in
REM - Shows console logs in your terminal
REM - Hot reload on file changes
REM
REM ============================================================================

echo.
echo ========================================
echo  STARTING LOCAL DEVELOPMENT
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  https://api.pulsemateconnect.in
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

cd frontend
npm run dev
