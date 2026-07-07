
@echo off
title ECG AI Platform - One Click Setup
echo ========================================
echo ECG AI PLATFORM - ONE CLICK START
echo ========================================
echo.

REM 1. INSTALL DEPENDENCIES
echo [1/4] Installing dependencies...
call npm install

REM 2. RESET DATABASE
echo [2/4] Resetting database...
chdir /d backend
if exist "data" rmdir /s /q data
chdir /d ..

REM 3. START BACKEND
echo [3/4] Starting Backend...
start "ECG Backend" cmd /k "cd backend && node src/server.js"

REM 4. WAIT FOR BACKEND TO START, THEN START FRONTEND
echo [4/4] Starting Frontend...
timeout /t 5 /nobreak >nul
start "ECG Frontend" cmd /k "cd frontend && npm start"

echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Login credentials:
echo   Patient: emmanuel.b@email.cm / patient123
echo   Doctor: dr.kameni@ecgplatform.cm / doctor123
echo   Admin: admin@ecgplatform.cm / admin123
echo.
timeout /t 5 >nul
exit
