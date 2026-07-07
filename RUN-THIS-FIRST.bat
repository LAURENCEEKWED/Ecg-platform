
@echo off
title ECG Platform - Setup & Run
echo ========================================
echo ECG AI Platform - FULL SETUP
echo ========================================
chdir /d "c:\Users\user\Desktop\ecg-platform"
echo.
echo [1/4] Installing ALL dependencies (this may take a few minutes)...
call npm run install:all
echo.
echo ========================================
echo ✅ All dependencies installed!
echo ========================================
echo.
echo [2/4] Starting BACKEND in new window...
start "ECG Backend" cmd /k "cd backend && npm start"
echo.
timeout /t 5 /nobreak >nul
echo.
echo [3/4] Starting FRONTEND in new window...
start "ECG Frontend" cmd /k "cd frontend && npm start"
echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo Login credentials:
echo   Patient: emmanuel.b@email.cm / patient123
echo   Doctor: dr.kameni@ecgplatform.cm / doctor123
echo   Admin: admin@ecgplatform.cm / admin123
echo.
pause

