@echo off
chcp 65001 >nul
title Chrome Profile Aptis
echo Dang khoi dong Chrome ao cho Aptis...
cd /d "%~dp0"
node open-virtual-chrome.js
pause
