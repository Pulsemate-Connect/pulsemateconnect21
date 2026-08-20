@echo off
echo ================================================
echo   PulseMate Connect - Website Upload Helper
echo ================================================
echo.
echo This script will help you upload the website files.
echo.
echo The new website files are in the 'dist' folder.
echo You need to upload ALL contents to your server.
echo.
echo ================================================
echo   UPLOAD OPTIONS:
echo ================================================
echo.
echo 1. Using FTP Client (FileZilla) - RECOMMENDED
echo    - Download: https://filezilla-project.org
echo    - Connect to your server
echo    - Upload contents of 'dist' folder to public_html/
echo.
echo 2. Using cPanel File Manager
echo    - Login to cPanel
echo    - Open File Manager
echo    - Upload dist.zip (we'll create it)
echo    - Extract on server
echo.
echo 3. Using command line (if you have SSH)
echo    - Run: scp -r dist/* user@server:/var/www/pulsemateconnect.in/
echo.
echo ================================================
echo   CREATE ZIP FOR UPLOAD?
echo ================================================
echo.
set /p CREATE_ZIP="Create dist.zip for easy upload? (Y/N): "

if /i "%CREATE_ZIP%"=="Y" goto CREATE_ZIP
if /i "%CREATE_ZIP%"=="YES" goto CREATE_ZIP
goto END

:CREATE_ZIP
echo.
echo Creating dist.zip...
cd dist
tar -a -c -f ../dist.zip *
cd ..
echo.
echo ================================================
echo   SUCCESS!
echo ================================================
echo.
echo Created: dist.zip (ready to upload)
echo Location: %CD%\dist.zip
echo.
echo Upload this ZIP file to your server:
echo 1. Login to cPanel File Manager
echo 2. Navigate to public_html/
echo 3. Delete all old files first
echo 4. Upload dist.zip
echo 5. Right-click dist.zip → Extract
echo 6. Delete dist.zip after extraction
echo 7. Test: https://pulsemateconnect.in
echo.
pause
goto END

:END
echo.
echo ================================================
echo   NEXT STEPS:
echo ================================================
echo.
echo 1. Upload files from 'dist' folder to your server
echo 2. Server location: /public_html/ or /var/www/pulsemateconnect.in/
echo 3. Test website: https://pulsemateconnect.in
echo.
echo For detailed instructions, see: URGENT_FIX.md
echo.
pause
