@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

cd /d "%~dp0server"

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo.
    echo Dependencies are NOT installed!
    echo Installing dependencies now...
    echo This may take a few minutes...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

echo.
echo Starting backend server on port 5000...
echo Keep this window open while using the app
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause

