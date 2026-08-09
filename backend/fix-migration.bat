@echo off
REM Fix Failed Migration Script for Windows
REM Run this locally with DATABASE_URL set in .env

echo ========================================
echo Fix Failed Migration
echo ========================================
echo.

echo Step 1: Marking migration as applied...
echo.
call npx prisma migrate resolve --applied 20260809_critical_bug_fixes

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ Migration resolved successfully!
  echo.
  echo Step 2: Checking migration status...
  echo.
  call npx prisma migrate status
  echo.
  echo ✅ DONE! Now trigger deployment:
  echo.
  echo Option 1: Push empty commit
  echo   git commit --allow-empty -m "chore: trigger deployment"
  echo   git push origin main
  echo.
  echo Option 2: Manual deploy on Render
  echo   Go to: https://dashboard.render.com
  echo   Click: Manual Deploy
) else (
  echo.
  echo ❌ Failed to resolve migration
  echo.
  echo Try alternative:
  echo npx prisma migrate resolve --rolled-back 20260809_critical_bug_fixes
)

pause
