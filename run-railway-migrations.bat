@echo off
echo ========================================
echo Railway Database Migration Runner
echo ========================================
echo.
echo This script will run all database migrations on your Railway PostgreSQL database.
echo.
echo BEFORE RUNNING:
echo 1. Go to Railway Dashboard
echo 2. Click your PostgreSQL database
echo 3. Click "Variables" tab
echo 4. Copy the "DATABASE_URL" value
echo.
set /p DATABASE_URL="Paste your Railway DATABASE_URL here: "

echo.
echo Setting environment variable...
set DATABASE_URL=%DATABASE_URL%

echo.
echo Running schema creation...
node backend\database\migrate.js
if errorlevel 1 (
    echo [ERROR] Schema migration failed!
    pause
    exit /b 1
)

echo.
echo Adding trial support...
node backend\database\add-trial-support.js
if errorlevel 1 (
    echo [ERROR] Trial support migration failed!
    pause
    exit /b 1
)

echo.
echo Adding performance indexes...
node backend\database\add-performance-indexes.js
if errorlevel 1 (
    echo [ERROR] Performance indexes migration failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Your Railway database is now ready.
echo.
pause
