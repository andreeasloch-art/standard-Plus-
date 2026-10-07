@echo off
rem Standard Plus unter Windows starten.
rem Benoetigt Python 3 (kostenlos unter python.org, bei der Installation
rem "Add Python to PATH" ankreuzen).
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python wurde nicht gefunden. Bitte von https://www.python.org installieren.
  pause
  exit /b 1
)
echo Standard Plus laeuft auf http://localhost:8123
echo Zum Beenden dieses Fenster schliessen.
start "" "http://localhost:8123/standardplus-main.html"
python -m http.server 8123
