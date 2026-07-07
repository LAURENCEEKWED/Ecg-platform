
@echo off
echo ========================================
echo FINAL FIX - COMPLETE RESET
echo ========================================

echo STEP 1: Delete old database...
if exist backend\data\ecg_platform.db del backend\data\ecg_platform.db

echo STEP 2: Start BACKEND server...
start "ECG-BACKEND" cmd /k "cd backend && node src/server.js"

echo STEP 3: Wait 10 seconds for backend to seed DB...
timeout /t 10 /nobreak

echo STEP 4: Start FRONTEND server...
start "ECG-FRONTEND" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo ALL DONE! Now log in with:
echo Email: emmanuel.b@email.cm
echo Password: patient123
echo ========================================
pause
