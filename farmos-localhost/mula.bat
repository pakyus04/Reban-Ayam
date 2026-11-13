@echo off
rem Pelancar FarmOS untuk Windows. Klik dua kali fail ini.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum dipasang. Muat turun versi LTS di https://nodejs.org kemudian jalankan fail ini semula.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Memasang kebergantungan. Kali pertama sahaja, ambil beberapa minit...
  call npm install
  if errorlevel 1 (
    echo npm install gagal. Semak sambungan internet.
    pause
    exit /b 1
  )
)
echo.
echo FarmOS akan dibuka di http://localhost:3000
echo Tekan Ctrl+C dalam tetingkap ini untuk berhenti.
echo.
start "" http://localhost:3000
call npm run dev
pause
