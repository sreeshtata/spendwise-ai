# SpendWise AI One-Click PowerShell Launcher
$toolsNode = Join-Path $PSScriptRoot ".tools\node"
$env:PATH = "$toolsNode;$env:PATH"

Write-Host "===================================================" -ForegroundColor Navy
Write-Host "    SpendWise AI — Smart Spending Assistant       " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Navy
Write-Host ""
Write-Host "[1/2] Starting Backend API (http://localhost:3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH='$toolsNode;' + `$env:PATH; Set-Location '$PSScriptRoot'; pnpm.cmd --filter @spendwise/api run dev"

Write-Host "[2/2] Starting Frontend Web App (http://localhost:3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH='$toolsNode;' + `$env:PATH; Set-Location '$PSScriptRoot'; pnpm.cmd --filter @spendwise/web run dev"

Start-Sleep -Seconds 3
Write-Host ""
Write-Host "Opening SpendWise AI in your browser at http://localhost:3000..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"
