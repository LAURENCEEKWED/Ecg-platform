
@echo off
echo ========================================
echo 🏥 ECG AI PLATFORM - FULL START
echo ========================================
echo.

echo STEP 1: Making sure data directory exists...
if not exist "backend\data" mkdir "backend\data"

echo STEP 2: Deleting old database (if any)...
if exist "backend\data\ecg_platform.db" del "backend\data\ecg_platform.db"

echo STEP 3: Starting BACKEND server...
start "BACKEND" cmd /k "cd backend && node src/server.js"

echo STEP 4: Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo STEP 5: Starting FRONTEND server...
start "FRONTEND" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo ✅ ALL SERVERS STARTED!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Log in with:
echo Patient: emmanuel.b@email.cm / patient123
echo.
echo ========================================
pause
