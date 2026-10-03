@echo off
chcp 65001 >nul
echo =====================================================
echo  MỞ CHROME PROFILE CHO NGUỒN MẪU (Port 9225)
echo =====================================================
node ../../core/browser.js example_source 9225 https://example.com/
pause
