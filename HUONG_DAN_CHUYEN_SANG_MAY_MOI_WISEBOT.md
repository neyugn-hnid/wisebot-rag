# Huong dan chuyen WiseBot sang may moi va dung domain

Tai lieu nay dung khi tai source WiseBot sang mot may Windows moi va van muon public bang:

```txt
https://wisebot.qzz.io
```

## 1. Can cai tren may moi

Can co:

```txt
Git
Node.js
JDK 17
Maven hoac Maven Wrapper trong source
XAMPP Apache
MySQL/PostgreSQL tuy theo cau hinh backend
```

Neu chi demo frontend qua Apache thi can toi thieu:

```txt
Git
Node.js
XAMPP Apache
cloudflared.exe
```

## 2. Tai source ve may moi

Mo PowerShell:

```powershell
cd "C:\Users\Admin\Documents"
git clone <link-github-cua-du-an> wisebot-rag
cd "C:\Users\Admin\Documents\wisebot-rag"
```

Neu source da copy bang USB/ZIP thi chi can giai nen vao thu muc mong muon.

## 3. Build frontend

```powershell
cd "C:\Users\Admin\Documents\wisebot-rag\frontend"
npm install
npm run build
```

Sau khi build xong phai co:

```txt
frontend/dist/index.html
frontend/dist/widget.js
frontend/dist/assets/
```

## 4. Copy frontend vao Apache

Xoa thu muc cu neu co:

```powershell
Remove-Item -Recurse -Force "C:\xampp\htdocs\wisebot" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "C:\xampp\htdocs\wisebot"
Copy-Item -Recurse -Force ".\dist\*" "C:\xampp\htdocs\wisebot\"
```

## 5. Cau hinh Apache

Mo file:

```txt
C:\xampp\apache\conf\httpd.conf
```

Dam bao cac module nay duoc bat:

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
```

Dam bao co dong include VirtualHost:

```apache
Include conf/extra/httpd-vhosts.conf
```

Mo file:

```txt
C:\xampp\apache\conf\extra\httpd-vhosts.conf
```

Them cau hinh:

```apache
<VirtualHost *:80>
    ServerName wisebot.qzz.io
    ServerAlias localhost 127.0.0.1

    DocumentRoot "C:/xampp/htdocs/wisebot"

    <Directory "C:/xampp/htdocs/wisebot">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>

    ProxyPreserveHost On
    ProxyPass "/api/" "http://127.0.0.1:9000/api/"
    ProxyPassReverse "/api/" "http://127.0.0.1:9000/api/"
    ProxyPass "/ws/" "ws://127.0.0.1:9000/ws/"
    ProxyPassReverse "/ws/" "ws://127.0.0.1:9000/ws/"
</VirtualHost>
```

Kiem tra Apache:

```powershell
C:\xampp\apache\bin\httpd.exe -t
```

Neu hien `Syntax OK` thi bat Apache trong XAMPP.

Kiem tra local:

```txt
http://localhost
```

## 6. Chay backend

Truoc khi public domain, can chay cac service backend va gateway.

Gateway phai chay o:

```txt
http://localhost:9000
```

Kiem tra:

```txt
http://localhost:9000/actuator/health
```

Neu frontend mo duoc nhung API loi thi thuong la do gateway/backend chua chay.

## 7. Tai cloudflared

Tai portable cloudflared vao source:

```powershell
cd "C:\Users\Admin\Documents\wisebot-rag"
New-Item -ItemType Directory -Force -Path ".\tools"
Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile ".\tools\cloudflared.exe"
```

## 8. Dang nhap Cloudflare

Chay:

```powershell
.\tools\cloudflared.exe tunnel login
```

Trinh duyet se mo ra. Dang nhap Cloudflare va chon domain `qzz.io`.

## 9. Tao tunnel moi cho may moi

Khuyen nghi tao tunnel moi tren may moi:

```powershell
.\tools\cloudflared.exe tunnel create wisebot-demo
```

Lenh nay se tra ve tunnel id, vi du:

```txt
2e79cff1-41bf-4677-bfb6-e0f14da25f12
```

Sua file `cloudflared-wisebot.yml` theo tunnel id moi:

```yaml
tunnel: TUNNEL_ID_MOI
credentials-file: C:/Users/Admin/.cloudflared/TUNNEL_ID_MOI.json

ingress:
  - hostname: wisebot.qzz.io
    service: http://localhost
  - service: http_status:404
```

Neu user Windows tren may moi khac `Admin`, sua lai duong dan `credentials-file`.

## 10. Tro domain ve tunnel moi

Chay:

```powershell
.\tools\cloudflared.exe tunnel route dns --overwrite-dns TUNNEL_ID_MOI wisebot.qzz.io
```

Lenh nay se ghi de DNS de `wisebot.qzz.io` tro ve tunnel tren may moi.

## 11. Chay domain public

Chay:

```powershell
.\tools\cloudflared.exe tunnel --config .\cloudflared-wisebot.yml run TUNNEL_ID_MOI
```

Giu cua so nay mo trong luc demo.

Sau do truy cap:

```txt
https://wisebot.qzz.io
```

## 12. Cach nhanh neu muon giu tunnel cu

Co the copy file credentials tu may cu sang may moi:

```txt
C:\Users\Admin\.cloudflared\2e79cff1-41bf-4677-bfb6-e0f14da25f12.json
```

Sau do giu nguyen file:

```txt
cloudflared-wisebot.yml
START_WISEBOT_DOMAIN_TUNNEL.bat
```

Nhung file `.json` nay la secret. Khong dua len GitHub, khong gui cho nguoi khac.

Neu khong chac, dung cach tao tunnel moi o buoc 9.

## 13. Neu domain lai tro ve 127.0.0.1

Kiem tra file hosts:

```txt
C:\Windows\System32\drivers\etc\hosts
```

Neu co dong:

```txt
127.0.0.1 wisebot.qzz.io
```

Thi xoa dong do bang Notepad Run as Administrator, hoac chay file:

```txt
REMOVE_WISEBOT_LOCAL_HOSTS_AS_ADMIN.bat
```

Sau do flush DNS:

```powershell
ipconfig /flushdns
```

## 14. Checklist truoc khi bao cao

Kiem tra theo thu tu:

```txt
1. Apache dang bat
2. http://localhost mo duoc frontend
3. Backend/gateway dang chay
4. http://localhost:9000/actuator/health OK
5. cloudflared tunnel dang chay
6. https://wisebot.qzz.io mo duoc
```

Neu chi can public frontend tinh, co the bo qua backend. Neu can dang nhap, widget, API, chat thi backend bat buoc phai chay.
