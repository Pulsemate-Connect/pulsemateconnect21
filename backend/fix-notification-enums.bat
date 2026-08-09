@echo off
echo ========================================
echo Fix Notification Enum Types
echo ========================================
echo.

cd /d "%~dp0"

echo Checking if .env file exists...
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please make sure you have a .env file with DATABASE_URL
    pause
    exit /b 1
)

echo.
echo Running migration to fix notification enum types...
echo.

npx prisma db execute --file prisma\migrations\fix_delivery_status_enum.sql --schema prisma\schema.prisma

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo SUCCESS! Enum types have been fixed
    echo ========================================
    echo.
    echo The following enums were created:
    echo - NotificationType
    echo - NotificationPriority
    echo - DeliveryStatus
    echo.
    echo Columns converted to enums:
    echo - notifications.type
    echo - notifications.priority
    echo - notifications.deliveryStatus
) else (
    echo ========================================
    echo ERROR: Migration failed
    echo ========================================
    echo Please check the error message above
)

echo.
pause
