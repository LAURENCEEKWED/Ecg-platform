
@echo off
echo ========================================
echo KILLING ANYTHING ON PORT 5000
echo ========================================
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000"') do (
    echo Killing process %%a...
    taskkill /F /PID %%a
)
echo ========================================
echo DONE!
echo ========================================
echo.
echo Now starting backend...
cd backend
node src/server.js
pause
