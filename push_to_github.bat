@echo off
setlocal enabledelayedexpansion
title SpendWise AI - Push to GitHub Repository

:: Always ensure script runs in project root directory
cd /d "%~dp0"

echo ======================================================================
echo          SpendWise AI - Upload to GitHub Repository
echo ======================================================================
echo Target Repo: https://github.com/sreeshtata/spendwise-ai
echo Working Dir: %CD%
echo.

:: 1. Locate Git executable (check portable .tools\git first, then system Git)
if exist "%~dp0.tools\git\cmd\git.exe" (
    set "PATH=%~dp0.tools\git\cmd;%~dp0.tools\git\mingw64\bin;!PATH!"
    echo [INFO] Using portable Git runtime from .tools\git
    goto :GIT_FOUND
)

where git >nul 2>&1
if %ERRORLEVEL% equ 0 goto :GIT_FOUND

set "GIT_DIR="
if exist "%ProgramFiles%\Git\cmd\git.exe" set "GIT_DIR=%ProgramFiles%\Git\cmd;%ProgramFiles%\Git\mingw64\bin"
if not defined GIT_DIR if exist "C:\Program Files\Git\cmd\git.exe" set "GIT_DIR=C:\Program Files\Git\cmd;C:\Program Files\Git\mingw64\bin"
if not defined GIT_DIR if exist "C:\Program Files (x86)\Git\cmd\git.exe" set "GIT_DIR=C:\Program Files (x86)\Git\cmd;C:\Program Files (x86)\Git\mingw64\bin"
if not defined GIT_DIR if exist "%LocalAppData%\Programs\Git\cmd\git.exe" set "GIT_DIR=%LocalAppData%\Programs\Git\cmd;%LocalAppData%\Programs\Git\mingw64\bin"

if defined GIT_DIR (
    set "PATH=!GIT_DIR!;!PATH!"
    echo [INFO] Found Git at !GIT_DIR!
    goto :GIT_FOUND
)

:: Git is not installed
echo [ERROR] Git is not installed or could not be found on this computer.
echo.
echo Please install Git to upload your project to GitHub:
echo   1. Download and install Git from: https://git-scm.com/download/win
echo   2. Or install GitHub Desktop from: https://desktop.github.com/
echo   3. After installing, run this push_to_github.bat file again.
echo.
pause
exit /b 1

:GIT_FOUND
echo.
echo [1/5] Initializing local repository in %CD%...
if not exist ".git" (
    git init "%CD%"
    echo [INFO] Initialized empty Git repository.
) else (
    echo [INFO] Existing Git repository detected.
)

:: Ensure on main branch
git branch -M main

echo.
echo [2/5] Checking Git user configuration...
set "GIT_USER="
set "GIT_EMAIL="
for /f "tokens=*" %%g in ('git config user.name 2^>nul') do set "GIT_USER=%%g"
for /f "tokens=*" %%g in ('git config user.email 2^>nul') do set "GIT_EMAIL=%%g"

if not defined GIT_USER (
    echo [NOTICE] Git user.name not set. Configuring: sreeshtata
    git config user.name "sreeshtata"
)

if not defined GIT_EMAIL (
    echo [NOTICE] Git user.email not set. Configuring: sreeshtata@users.noreply.github.com
    git config user.email "sreeshtata@users.noreply.github.com"
)

echo.
echo [3/5] Configuring remote repository...
set "REPO_URL=https://github.com/sreeshtata/spendwise-ai.git"

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% equ 0 (
    git remote set-url origin !REPO_URL!
    echo [INFO] Remote 'origin' configured to !REPO_URL!
) else (
    git remote add origin !REPO_URL!
    echo [INFO] Added remote 'origin' -> !REPO_URL!
)

echo.
echo [4/5] Staging and committing files...
:: Add all files respecting .gitignore
git add -A

:: Check if there are changes to commit
set "TEMP_STATUS=%TEMP%\spendwise_status_%RANDOM%.txt"
git status --porcelain > "!TEMP_STATUS!" 2>&1
for %%R in ("!TEMP_STATUS!") do set "STATUS_SIZE=%%~zR"

if defined STATUS_SIZE (
    if !STATUS_SIZE! gtr 0 (
        git commit -m "feat: complete SpendWise AI Smart Spending Assistant with tests, PayPal sandbox, and docs"
        echo [INFO] Committed updated project files.
    ) else (
        echo [INFO] Working tree is clean. Proceeding to push.
    )
)
if exist "!TEMP_STATUS!" del "!TEMP_STATUS!"

echo.
echo [5/5] Pushing to GitHub (main branch)...
echo Note: If prompted, sign in via your browser or enter your GitHub Personal Access Token (PAT).
echo.

git push -u origin main
if %ERRORLEVEL% equ 0 goto :SUCCESS

echo.
echo [WARNING] Standard push failed. This usually happens if the remote repository
echo already contains files like a README or LICENSE created on GitHub.
echo.
set "FORCE_CHOICE=n"
set /p FORCE_CHOICE="Would you like to force push and overwrite remote with this project? (y/n) [n]: "
if /i "!FORCE_CHOICE!"=="y" goto :DO_FORCE_PUSH
goto :DO_REBASE_PUSH

:DO_FORCE_PUSH
echo [INFO] Force pushing to origin main...
git push -u origin main --force
if %ERRORLEVEL% equ 0 goto :SUCCESS
goto :PUSH_FAILED

:DO_REBASE_PUSH
echo [INFO] Attempting to pull and rebase before pushing...
git pull origin main --rebase
git push -u origin main
if %ERRORLEVEL% equ 0 goto :SUCCESS
goto :PUSH_FAILED

:PUSH_FAILED
echo.
echo [ERROR] Push could not be completed.
echo Please verify:
echo   1. The repository https://github.com/sreeshtata/spendwise-ai exists.
echo   2. You have write/push access to the repository.
echo   3. Your GitHub credentials or Personal Access Token (PAT) are valid.
echo.
pause
exit /b 1

:SUCCESS
echo.
echo ======================================================================
echo [SUCCESS] Project successfully uploaded to GitHub!
echo Repository URL: https://github.com/sreeshtata/spendwise-ai
echo ======================================================================
echo.
pause
exit /b 0
