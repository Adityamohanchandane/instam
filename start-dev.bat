@echo off
echo 🚀 Starting Instam Development Server...
echo.

echo 📦 Installing dependencies...
npm install

echo.
echo 🎵 Starting Backend Server...
start cmd /k "npm run server"

echo ⏳ Waiting 3 seconds for server to start...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Starting Frontend...
npm run dev

echo.
echo ✅ Both servers started!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3001
pause
