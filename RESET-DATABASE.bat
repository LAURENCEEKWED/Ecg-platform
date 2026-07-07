
@echo off
title Reset ECG Database
echo ========================================
echo RESETTING ECG DATABASE TO FRESH STATE
echo ========================================
chdir /d "c:\Users\user\Desktop\ecg-platform\backend"
if exist "data" (
    echo Removing old database...
    rmdir /s /q data
    echo Old database removed!
)
echo ========================================
echo DATABASE RESET COMPLETE!
echo ========================================
echo Now starting backend...
node src/server.js
pause

