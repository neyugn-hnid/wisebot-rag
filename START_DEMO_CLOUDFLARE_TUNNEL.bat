@echo off
cd /d "%~dp0"

echo ============================================
echo WiseBot demo tunnel
echo ============================================
echo.
echo Apache local can be opened at:
echo   http://localhost
echo.
echo Cloudflare will print a public HTTPS link like:
echo   https://xxxxx.trycloudflare.com
echo.
echo Keep this window open while presenting.
echo Press Ctrl+C to stop the public link.
echo.

if not exist "tools\cloudflared.exe" (
  echo Missing tools\cloudflared.exe
  echo Downloading cloudflared...
  if not exist "tools" mkdir tools
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '.\tools\cloudflared.exe'"
)

echo Starting Cloudflare Tunnel...
echo.
"%~dp0tools\cloudflared.exe" tunnel --url http://localhost

pause
