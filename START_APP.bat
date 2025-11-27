@echo off
echo ========================================
echo CRM Sales App - Startup Helper
echo ========================================
echo.

echo Checking Node.js version...
node --version
echo.

for /f "tokens=1 delims=." %%a in ('node --version') do set MAJOR_VERSION=%%a
set MAJOR_VERSION=%MAJOR_VERSION:v=%

if %MAJOR_VERSION% LSS 16 (
    echo.
    echo ========================================
    echo ERROR: Node.js version is too old!
    echo ========================================
    echo.
    echo Your version: 
    node --version
    echo.
    echo Required version: Node.js 16.0.0 or higher
    echo.
    echo Please upgrade Node.js:
    echo 1. Go to https://nodejs.org/
    echo 2. Download Node.js 18 LTS or 20 LTS
    echo 3. Install it
    echo 4. Close and reopen this window
    echo 5. Run this file again
    echo.
    pause
    exit
)

echo Node.js version is OK!
echo.

echo Checking if dependencies are installed...
if not exist "client\node_modules" (
    echo.
    echo Dependencies are NOT installed!
    echo.
    echo Installing dependencies now...
    echo This may take 3-5 minutes. Please wait...
    echo.
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install root dependencies
        pause
        exit
    )
    
    cd client
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install client dependencies
        cd ..
        pause
        exit
    )
    cd ..
    
    cd server
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install server dependencies
        cd ..
        pause
        exit
    )
    cd ..
    
    echo.
    echo Dependencies installed successfully!
    echo.
) else (
    echo Dependencies are already installed.
    echo.
)

echo ========================================
echo Starting the development server...
echo ========================================
echo.
echo The app will open at: http://localhost:3000
echo.
echo IMPORTANT: 
echo - Do NOT close this window
echo - Open http://localhost:3000 in your browser
echo - Press Ctrl+C to stop the server
echo.
echo Starting now...
echo.

call npm run dev

pause




