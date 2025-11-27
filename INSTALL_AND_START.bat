@echo off
echo ========================================
echo Installing and Starting Backend Server
echo ========================================
echo.

cd /d "%~dp0server"

echo Step 1: Installing backend dependencies...
echo This may take 3-5 minutes. Please wait...
echo.

call npm install

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check the error message above
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ Dependencies installed successfully!
echo.

echo Step 2: Starting backend server on port 5000...
echo.
echo ========================================
echo Server will start now...
echo Keep this window open!
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

pause




