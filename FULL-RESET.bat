
@echo off
title FULL RESET - ECG PLATFORM
echo ========================================
echo FULL RESET - ECG PLATFORM
echo ========================================
echo.

REM 1. DELETE OLD NODE_MODULES AND DATABASE
echo [Step 1: Cleaning up old files...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
if exist "backend\node_modules" rmdir /s /q backend\node_modules
if exist "backend\data" rmdir /s /q backend\data
if exist "frontend\node_modules" rmdir /s /q frontend\node_modules

echo.
echo ========================================
echo ✅ Old files deleted!
echo ========================================
echo.

REM 2. INSTALL DEPENDENCIES
echo [Step 2]: Installing dependencies...
call npm install

echo.
echo ========================================
echo ✅ Dependencies installed!
echo ========================================
echo.

REM 3. START SERVERS
echo [Step 3]: Starting servers...
start "ECG Backend" cmd /k "cd backend && node src/server.js"
timeout /t 8 /nobreak >nul
start "ECG Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo ✅ Everything is starting!
echo ========================================
echo Login credentials:
echo   Patient: emmanuel.b@email.cm / patient123
echo   Doctor: dr.kameni@ecgplatform.cm / doctor123
echo.
echo Please wait ~10 seconds for everything to start!
timeout /t 5
exit
