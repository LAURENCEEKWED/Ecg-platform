
@echo off
echo ========================================
echo RESTARTING BACKEND (for email config)
echo ========================================
echo Killing any process on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000"') do (
  taskkill /F /PID %%a &gt;nul 2&gt;&amp;1
)
echo Starting backend...
cd backend
node src/server.js
