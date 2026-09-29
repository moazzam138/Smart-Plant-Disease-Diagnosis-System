@echo off
title Smart Tomato BACKEND - keep this window open
cd /d "%~dp0backend"

echo Stopping any old backend still using port 8000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /T /PID %%p >nul 2>&1

call venv\Scripts\activate.bat
echo.
echo Starting backend. Wait for "Application startup complete."
echo Then keep this window open. Do NOT type in it.
echo.
uvicorn app.main:app --host 0.0.0.0 --port 8000

echo.
echo *** The backend has STOPPED. Read the message above, then press any key to close. ***
pause
