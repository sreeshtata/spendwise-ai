<#
.SYNOPSIS
    SpendWise AI — Push to GitHub Script
.DESCRIPTION
    Automates git initialization, remote configuration, staging, committing, and pushing to https://github.com/sreeshtata/spendwise-ai
#>

$repoUrl = "https://github.com/sreeshtata/spendwise-ai.git"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         SpendWise AI - Upload to GitHub Repository" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Target Repo: https://github.com/sreeshtata/spendwise-ai`n" -ForegroundColor Yellow

# 1. Locate Git
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    $commonPaths = @(
        "$PSScriptRoot\.tools\git\cmd\git.exe",
        "$PSScriptRoot\.tools\git\bin\git.exe",
        "$env:ProgramFiles\Git\cmd\git.exe",
        "${env:ProgramFiles(x86)}\Git\cmd\git.exe",
        "$env:LocalAppData\Programs\Git\cmd\git.exe"
    )
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $gitDir = Split-Path -Parent $path
            $env:PATH = "$gitDir;$env:PATH"
            Write-Host "[INFO] Found Git at $gitDir" -ForegroundColor Green
            $gitCmd = Get-Command git -ErrorAction SilentlyContinue
            break
        }
    }
}

if (-not $gitCmd) {
    Write-Host "[ERROR] Git is not installed or could not be found on this computer." -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/download/win and rerun this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# 2. Check Git user
$userName = git config user.name
$userEmail = git config user.email
if (-not $userName) {
    git config user.name "$env:USERNAME"
    Write-Host "[NOTICE] Git user.name configured as $env:USERNAME" -ForegroundColor Gray
}
if (-not $userEmail) {
    git config user.email "$env:USERNAME@spendwise.local"
    Write-Host "[NOTICE] Git user.email configured as $env:USERNAME@spendwise.local" -ForegroundColor Gray
}

# 3. Init repo & branch
if (-not (Test-Path ".git")) {
    git init
    Write-Host "[INFO] Initialized new Git repository." -ForegroundColor Green
}
git branch -M main

# 4. Configure remote
$remotes = git remote
if ($remotes -contains "origin") {
    git remote set-url origin $repoUrl
    Write-Host "[INFO] Updated existing remote 'origin' to $repoUrl" -ForegroundColor Green
} else {
    git remote add origin $repoUrl
    Write-Host "[INFO] Added remote 'origin' -> $repoUrl" -ForegroundColor Green
}

# 5. Stage & commit
git add -A
$status = git status --porcelain
if ($status) {
    git commit -m "feat: complete SpendWise AI Smart Spending Assistant with tests, PayPal sandbox, and docs"
    Write-Host "[INFO] Committed updated project files." -ForegroundColor Green
} else {
    Write-Host "[INFO] Working tree is clean. Proceeding to push." -ForegroundColor Gray
}

# 6. Push to main
Write-Host "`n[INFO] Pushing to GitHub (main branch)..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[WARNING] Push failed. If the remote has existing commits/README, force push may be needed." -ForegroundColor Yellow
    $ans = Read-Host "Would you like to force push? (y/n)"
    if ($ans -eq 'y' -or $ans -eq 'Y') {
        git push -u origin main --force
    } else {
        git pull origin main --rebase
        git push -u origin main
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n======================================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] Project successfully uploaded to https://github.com/sreeshtata/spendwise-ai" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] Push was not completed. Verify your repository permissions and credentials." -ForegroundColor Red
}

Read-Host "Press Enter to finish..."
