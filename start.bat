@echo off
title SpendWise AI — Launcher
setlocal

:: Set portable Node and pnpm path
set "PATH=%~dp0.tools\node;%PATH%"

echo ===================================================
echo     SpendWise AI — Smart Spending Assistant
echo ===================================================
echo.
echo [1/2] Launching Backend API on http://localhost:3001...
start "SpendWise API (Port 3001)" cmd /k "title SpendWise API && pnpm.cmd --filter @spendwise/api run dev"

echo [2/2] Launching Frontend Web on http://localhost:3000...
start "SpendWise Web (Port 3000)" cmd /k "title SpendWise Web && pnpm.cmd --filter @spendwise/web run dev"

echo.
echo Application started successfully!
echo.
echo - Web Application: http://localhost:3000
echo - Swagger API Docs: http://localhost:3001/api/v1/docs
echo.
echo Keep the two opened terminal windows running while using the app.
pause
