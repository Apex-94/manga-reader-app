@echo off
echo Starting PyYomi Electron App...
cd /d "%~dp0"

if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  call npm install --prefix frontend
)

if not exist "electron\node_modules" (
  echo Installing electron dependencies...
  call npm install --prefix electron
)

echo Building frontend...
call npm run build --prefix frontend
if %errorlevel% neq 0 (
  echo Frontend build failed.
  pause
  exit /b %errorlevel%
)

echo Launching Electron...
call npm run start --prefix electron
