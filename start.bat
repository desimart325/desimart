@echo off
echo Starting Desi Mart...
echo.
echo [1/2] Starting Backend (port 3001)...
start "Desi Mart Backend" cmd /k "cd /d C:\claude-projects\desimart\backend && node index.js"
timeout /t 2 /nobreak >/dev/null
echo [2/2] Starting Frontend (port 5173)...
start "Desi Mart Frontend" cmd /k "cd /d C:\claude-projects\desimart\frontend && npm run dev"
echo.
echo Open http://localhost:5173
