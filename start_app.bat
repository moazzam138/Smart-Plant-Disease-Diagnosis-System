@echo off
title Smart Tomato EXPO - keep this window open
cd /d "%~dp0mobile"

rem Find this laptop's current IPv4 address automatically
set IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
set IP=%IP: =%
set EXPO_PUBLIC_API_URL=http://%IP%:8000
echo EXPO_PUBLIC_API_URL=%EXPO_PUBLIC_API_URL%> .env.local

echo.
echo ============================================================
echo  The app will call the backend at: %EXPO_PUBLIC_API_URL%
echo  Check it on the PHONE's Chrome:   %EXPO_PUBLIC_API_URL%/health
echo ============================================================
echo.
npx expo start --tunnel -c

echo.
echo *** Expo has STOPPED. Press any key to close. ***
pause
