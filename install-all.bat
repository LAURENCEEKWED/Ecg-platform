
@echo off
chdir /d "c:\Users\user\Desktop\ecg-platform"
echo ========================================
echo ECG Platform - Installing All Dependencies
echo ========================================
echo Installing root dependencies...
call npm install
echo Done! Now you can run start-backend.bat and start-frontend.bat!
pause

