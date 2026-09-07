@echo off
echo ========================================
echo Restarting Backend After Migration
echo ========================================
echo.

echo Step 1: Stopping backend server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *server.js*" 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Regenerating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma generate failed!
    pause
    exit /b 1
)

echo.
echo ✅ Prisma client regenerated successfully!
echo.
echo Step 3: You can now start your backend server manually:
echo    npm run dev
echo.
echo ========================================
pause
