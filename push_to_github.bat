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

:: -----------------------------------------------------------------------
:: 1. Locate Git executable
:: Priority: portable .tools\git  >  system PATH  >  common install paths
:: -----------------------------------------------------------------------

set "GIT_EXE="

:: a) Portable Git bundled with the project
if exist "%~dp0.tools\git\cmd\git.exe" (
    set "GIT_EXE=%~dp0.tools\git\cmd\git.exe"
    set "PATH=%~dp0.tools\git\cmd;%~dp0.tools\git\mingw64\bin;!PATH!"
    echo [INFO] Using portable Git runtime from .tools\git
    goto :GIT_FOUND
)

:: b) Git on the system PATH
for /f "delims=" %%G in ('where git 2^>nul') do (
    set "GIT_EXE=%%G"
    goto :GIT_FOUND
)

:: c) Common Windows install locations (quoted to handle spaces)
set "_CANDIDATES="
set "_CANDIDATES=!_CANDIDATES!;C:\Program Files\Git\cmd\git.exe"
set "_CANDIDATES=!_CANDIDATES!;C:\Program Files (x86)\Git\cmd\git.exe"

for %%C in ("C:\Program Files\Git\cmd\git.exe" "C:\Program Files (x86)\Git\cmd\git.exe") do (
    if exist %%C (
        set "GIT_EXE=%%~C"
        for %%D in ("%%~dpC..") do set "PATH=%%~fD\cmd;%%~fD\mingw64\bin;!PATH!"
        goto :GIT_FOUND
    )
)

:: d) LocalAppData install (GitHub Desktop / Scoop)
if exist "%LocalAppData%\Programs\Git\cmd\git.exe" (
    set "GIT_EXE=%LocalAppData%\Programs\Git\cmd\git.exe"
    set "PATH=%LocalAppData%\Programs\Git\cmd;%LocalAppData%\Programs\Git\mingw64\bin;!PATH!"
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
echo [INFO] Git found: !GIT_EXE!
echo.

:: Use !GIT_EXE! as the git command for all subsequent calls
set "GIT=!GIT_EXE!"

echo [1/5] Initializing local repository in %CD%...
if not exist ".git" (
    "!GIT!" init "%CD%"
    echo [INFO] Initialized empty Git repository.
) else (
    echo [INFO] Existing Git repository detected.
)

:: Ensure on main branch
"!GIT!" branch -M main 2>nul

echo.
echo [2/5] Checking Git user configuration...
set "GIT_USER="
set "GIT_EMAIL="
for /f "tokens=*" %%g in ('"!GIT!" config user.name 2^>nul') do set "GIT_USER=%%g"
for /f "tokens=*" %%g in ('"!GIT!" config user.email 2^>nul') do set "GIT_EMAIL=%%g"

if not defined GIT_USER (
    echo [NOTICE] Git user.name not set. Configuring: sreeshtata
    "!GIT!" config user.name "sreeshtata"
)
if not defined GIT_EMAIL (
    echo [NOTICE] Git user.email not set. Configuring: sreeshtata@users.noreply.github.com
    "!GIT!" config user.email "sreeshtata@users.noreply.github.com"
)

echo.
echo [3/5] Configuring remote repository...
set "REPO_URL=https://github.com/sreeshtata/spendwise-ai.git"

"!GIT!" remote get-url origin >nul 2>&1
if %ERRORLEVEL% equ 0 (
    "!GIT!" remote set-url origin "!REPO_URL!"
    echo [INFO] Remote 'origin' updated to !REPO_URL!
) else (
    "!GIT!" remote add origin "!REPO_URL!"
    echo [INFO] Added remote 'origin' -> !REPO_URL!
)

echo.
echo [4/5] Staging and committing files...
"!GIT!" add -A

set "TEMP_STATUS=%TEMP%\spendwise_status_%RANDOM%.txt"
"!GIT!" status --porcelain > "!TEMP_STATUS!" 2>&1
set "STATUS_SIZE=0"
for %%R in ("!TEMP_STATUS!") do set "STATUS_SIZE=%%~zR"

if !STATUS_SIZE! gtr 0 (
    "!GIT!" commit -m "feat: SpendWise AI — complete Smart Spending Assistant with PayPal sandbox, tests, UI redesign"
    echo [INFO] Committed updated project files.
) else (
    echo [INFO] Working tree is clean — nothing new to commit.
)
if exist "!TEMP_STATUS!" del "!TEMP_STATUS!"

echo.
echo [5/5] Pushing to GitHub (main branch)...
echo Note: If prompted, sign in via your browser or enter your GitHub Personal Access Token (PAT).
echo.

"!GIT!" push -u origin main
if %ERRORLEVEL% equ 0 goto :SUCCESS

echo.
echo [WARNING] Standard push failed. This often happens when the remote already has
echo files (README, LICENSE) that are not in your local history.
echo.
set "FORCE_CHOICE=n"
set /p FORCE_CHOICE="Force push and overwrite remote with this project? (y/n) [n]: "
if /i "!FORCE_CHOICE!"=="y" goto :DO_FORCE_PUSH

echo [INFO] Attempting pull-rebase before pushing...
"!GIT!" pull origin main --rebase --allow-unrelated-histories
"!GIT!" push -u origin main
if %ERRORLEVEL% equ 0 goto :SUCCESS
goto :PUSH_FAILED

:DO_FORCE_PUSH
echo [INFO] Force pushing to origin main...
"!GIT!" push -u origin main --force
if %ERRORLEVEL% equ 0 goto :SUCCESS

:PUSH_FAILED
echo.
echo [ERROR] Push could not be completed.
echo Please verify:
echo   1. The repository https://github.com/sreeshtata/spendwise-ai exists.
echo   2. You have write/push access to the repository.
echo   3. Your GitHub credentials or Personal Access Token (PAT) are valid.
echo      (Generate a PAT at: https://github.com/settings/tokens)
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
