
@echo off
chdir /d "c:\Users\user\Desktop\ecg-platform\frontend"
echo ========================================
echo ECG Platform - Starting Frontend Server
echo ========================================
if not exist "node_modules" (
    echo Installing dependencies first...
    call npm install
)
echo Starting server...
npm start
pause

