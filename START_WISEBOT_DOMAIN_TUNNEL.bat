@echo off
cd /d "%~dp0"

echo ============================================
echo WiseBot domain tunnel
echo ============================================
echo.
echo Public domain:
echo   https://wisebot.qzz.io
echo.
echo Local Apache:
echo   http://localhost
echo.
echo Keep this window open while presenting.
echo Press Ctrl+C to stop the public domain.
echo.

if not exist "tools\cloudflared.exe" (
  echo Missing tools\cloudflared.exe
  echo Downloading cloudflared...
  if not exist "tools" mkdir tools
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '.\tools\cloudflared.exe'"
)

"%~dp0tools\cloudflared.exe" tunnel --config "%~dp0cloudflared-wisebot.yml" run 2e79cff1-41bf-4677-bfb6-e0f14da25f12

pause
