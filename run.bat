@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   Live Translator V3 - Windows 11
echo ========================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] Python not found! Please install Python 3.8+
    echo   https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Installing dependencies...
python -m pip install SpeechRecognition deep-translator sounddevice numpy >nul 2>nul

echo [OK] Dependencies ready
echo.
echo Starting Live Translator...
echo.
python live_translator_v3.py
pause
