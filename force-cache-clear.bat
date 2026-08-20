@echo off
echo ===============================================================================
echo   FORCE RENDER CDN CACHE CLEAR
echo ===============================================================================
echo.
echo This script will:
echo   1. Add a cache-busting comment to README.md
echo   2. Commit the change
echo   3. Push to GitHub
echo   4. Trigger Render to redeploy with fresh cache
echo.
echo ===============================================================================
echo.

pause

echo.
echo [1/4] Adding cache-bust comment to README...
echo. >> README.md
echo # Cache cleared at %date% %time% >> README.md

echo.
echo [2/4] Staging changes...
git add README.md

echo.
echo [3/4] Committing...
git commit -m "chore: Force Render CDN cache invalidation at %date% %time%"

echo.
echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo ===============================================================================
echo   DONE!
echo ===============================================================================
echo.
echo Next steps:
echo   1. Go to https://dashboard.render.com
echo   2. Find 'pulsemate-frontend' service
echo   3. Watch it rebuild (10-15 minutes)
echo   4. After 'Live' status, test in Incognito mode again
echo.
echo ===============================================================================
pause
