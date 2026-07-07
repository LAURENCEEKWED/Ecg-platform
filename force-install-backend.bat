
@echo off
chdir /d "c:\Users\user\Desktop\ecg-platform\backend"
echo ========================================
echo FORCE INSTALLING BACKEND DEPENDENCIES
echo ========================================
if exist "node_modules" (
    echo Removing existing node_modules...
    rmdir /s /q node_modules
    if exist "package-lock.json" del package-lock.json
)
echo Installing backend dependencies...
call npm install
echo ========================================
echo BACKEND DEPENDENCIES INSTALLED!
echo ========================================
echo Now starting backend...
node src/server.js
pause

