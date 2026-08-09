@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Add Sample Doctors to Database
REM ═══════════════════════════════════════════════════════════════════════════

title Add Sample Doctors

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║         Add Sample Doctors to PulseMate Database             ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo This will add 5 sample doctors to your database.
echo.
echo Press any key to continue, or Ctrl+C to cancel...
pause >nul

echo.
echo Running seed script...
echo.

node prisma\seed-doctors.js

echo.
echo ═══════════════════════════════════════════════════════════════
echo.
if %errorlevel% == 0 (
    echo ✅ SUCCESS! Sample doctors added to database.
    echo.
    echo Next steps:
    echo   1. Restart your app
    echo   2. Go to "Top Doctors" screen
    echo   3. You should see 5 doctors!
) else (
    echo ❌ FAILED! Check the error message above.
    echo.
    echo Common issues:
    echo   - Database connection failed
    echo   - Missing bcrypt module (run: npm install)
    echo   - Prisma not configured
)
echo.
echo Press any key to exit...
pause >nul
