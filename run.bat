@echo off
cd /d "%~dp0"
title Sravan Karra Portfolio
echo Starting portfolio website...
echo Open http://127.0.0.1:5000
echo.

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" backend\app.py
) else (
    python backend\app.py
)

echo.
echo Server stopped.
pause
