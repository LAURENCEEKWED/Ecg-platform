
@echo off
title ECG Platform - 1 CLICK START
echo ========================================
echo ECG AI PLATFORM - 1 CLICK START
echo ========================================
echo.

REM Step 1: Delete old database
echo [Step 1] Deleting old database...
if exist "backend\data" rmdir /s /q backend\data

REM Step 2: Install dependencies (if needed)
echo.
echo [Step 2] Making sure dependencies are installed...
if not exist "node_modules" (
  echo Installing root dependencies...
  call npm install
)
if not exist "backend\node_modules" (
  echo Installing backend dependencies...
  cd backend
  call npm install
  cd ..
)
if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  cd frontend
  call npm install
  cd ..
)

REM Step 3: Start everything!
echo.
echo [Step 3] Starting the magic...
echo Starting backend in new window...
start "ECG Backend" cmd /k "cd backend && npm start"

echo Waiting 8 seconds for backend to start...
timeout /t 8 /nobreak >nul

echo Starting frontend in new window...
start "ECG Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Login with these credentials:
echo   Patient: emmanuel.b@email.cm / patient123
echo   Doctor: dr.kameni@ecgplatform.cm / doctor123
echo.
echo Enjoy your ECG AI Platform! 🎉
echo.
timeout /t 5
exit
