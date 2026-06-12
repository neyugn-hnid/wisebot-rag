# Huong dan trien khai WiseBot voi Apache

## 1. Kien truc hien tai

Frontend khong chay trong Docker nua.

```txt
frontend source -> npm run build -> frontend/dist
frontend/dist   -> C:\xampp\htdocs\wisebot
Apache          -> serve http://localhost
Cloudflare      -> https://wisebot.qzz.io
Docker          -> chi chay backend/gateway/database/AI
```

Apache proxy API ve gateway:

```txt
/api/... -> http://127.0.0.1:9000/api/...
/ws/...  -> ws://127.0.0.1:9000/ws/...
```

## 2. Build va copy frontend

```powershell
cd "C:\Users\Admin\Documents\wisebot-rag\frontend"
npm install
npm run build

Remove-Item -Recurse -Force "C:\xampp\htdocs\wisebot" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "C:\xampp\htdocs\wisebot"
Copy-Item -Recurse -Force ".\dist\*" "C:\xampp\htdocs\wisebot\"
```

## 3. Chay backend bang Docker

```powershell
cd "C:\Users\Admin\Documents\wisebot-rag"
docker compose up -d --build
```

Kiem tra gateway:

```powershell
curl http://localhost:9000/actuator/health
```

Ket qua dung:

```json
{"status":"UP"}
```

## 4. Cau hinh Apache

Trong `C:\xampp\apache\conf\httpd.conf`, dam bao cac module nay duoc bat:

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
```

Dam bao co include vhost:

```apache
Include conf/extra/httpd-vhosts.conf
```

Copy noi dung `apache-wisebot.conf` vao:

```txt
C:\xampp\apache\conf\extra\httpd-vhosts.conf
```

Kiem tra Apache:

```powershell
C:\xampp\apache\bin\httpd.exe -t
```

## 5. Chay domain HTTPS

Apache local chi can mo:

```txt
http://localhost
```

HTTPS public do Cloudflare Tunnel xu ly:

```powershell
cd "C:\Users\Admin\Documents\wisebot-rag"
.\START_WISEBOT_DOMAIN_TUNNEL.bat
```

Sau do mo:

```txt
https://wisebot.qzz.io
```

## 6. Luu y

Khong them `127.0.0.1 wisebot.qzz.io` vao file hosts khi dung Cloudflare Tunnel.

Neu sua code frontend, phai build va copy lai vao `C:\xampp\htdocs\wisebot`.

Neu API loi, kiem tra:

```powershell
docker compose ps
curl http://localhost:9000/actuator/health
```

cd "C:\Users\Admin\Documents\wisebot-rag\frontend"
npm run build
Remove-Item -Recurse -Force "C:\xampp\htdocs\wisebot"
New-Item -ItemType Directory -Force -Path "C:\xampp\htdocs\wisebot"
Copy-Item -Recurse -Force ".\dist\*" "C:\xampp\htdocs\wisebot\"