
@echo off
title Seed ECG Database
chdir /d c:\Users\user\Desktop\ecg-platform\backend
echo ========================================
echo SEEDING DATABASE
echo ========================================
node src/utils/seed.js
echo.
echo ========================================
echo SEED COMPLETE!
echo ========================================
pause
