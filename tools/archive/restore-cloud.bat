@echo off
chcp 65001 >nul
title Restore Exams to Cloud Database
echo ====================================================
echo   NAP NGAN HANG DE THI VAO DATABASE CLOUD
echo ====================================================
cd /d "%~dp0"
set /p CLOUD_URL="Nhap DATABASE_URL Cloud (vi du: postgresql://user:pass@host:5432/db): "
if "%CLOUD_URL%"=="" (
    echo Ban chua nhap DATABASE_URL!
    pause
    exit /b
)
node restore-to-cloud-db.js "%CLOUD_URL%"
pause
