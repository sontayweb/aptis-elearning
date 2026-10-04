@echo off
chcp 65001 >nul
title Backup All Exams to JSON
echo ====================================================
echo   DANG SAO LUU TOAN BO 104 DE THI RA FILE JSON
echo ====================================================
cd /d "%~dp0"
node backup-all-exams.js
pause
