@echo off
echo Starting Manga Reader App...
echo.
echo Ensuring Docker is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b
)

echo Building and starting containers...
docker compose up --build
pause
