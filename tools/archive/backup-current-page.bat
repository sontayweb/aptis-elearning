@echo off
chcp 65001 >nul
title Backup Exam HTML to JSON
echo ====================================================
echo   DANG SAO LUU DE THI HIEN TAI TREN CHROME SANG JSON
echo ====================================================
cd /d "%~dp0"
node scrape-exam-html.js %*
pause
