
@echo off
title Test ECG Database
chdir /d "c:\Users\user\Desktop\ecg-platform\backend"
echo ========================================
echo RUNNING DATABASE TEST
echo ========================================
node TEST-LOGIN.js
echo.
echo ========================================
echo TEST COMPLETE!
echo ========================================
pause
