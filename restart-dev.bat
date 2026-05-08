@echo off
echo 🔄 Restarting Development Server...
echo.

echo 🛑 Stopping any running processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im chrome.exe 2>nul

echo ⏳ Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo 🚀 Starting Fresh Development Server...
start cmd /k "npm run server"

echo ⏳ Waiting 3 seconds for server to start...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Starting Frontend...
npm run dev

echo.
echo ✅ Servers restarted!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3001
pause
