@echo off
setlocal

set "HOSTS=%SystemRoot%\System32\drivers\etc\hosts"
set "BACKUP=%SystemRoot%\System32\drivers\etc\hosts.wisebot-backup"

echo Removing local hosts override for wisebot.qzz.io...
copy "%HOSTS%" "%BACKUP%" >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$hosts=$env:HOSTS; $lines=Get-Content $hosts; $new=$lines | Where-Object { $_ -notmatch '^\s*127\.0\.0\.1\s+wisebot\.qzz\.io\s*$' }; Set-Content -Path $hosts -Value $new -Encoding ascii"

ipconfig /flushdns

echo Done. You can now open:
echo   https://wisebot.qzz.io
pause
