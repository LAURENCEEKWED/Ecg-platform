
@echo off
chdir /d "c:\Users\user\Desktop\ecg-platform"
echo ========================================
echo ECG Platform - Starting Backend Server
echo ========================================
echo Checking for root node_modules...
if not exist "node_modules" (
    echo Installing root dependencies first...
    call npm install
)
cd backend
echo Starting server...
node start-with-root-modules.js
pause

