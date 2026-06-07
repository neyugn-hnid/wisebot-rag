# Huong dan trien khai WiseBot voi Apache

## 1. Kien truc trien khai

Apache chi nen lam 2 viec:

- Serve frontend React/Vite tu `frontend/dist`
- Reverse proxy API ve `api-gateway` o port `9000`

Luon chay cac service backend rieng:

```txt
user-service       : 8080
document-service   : 8081
chat-service       : 8082
widget-service     : 8084
billing-service    : 8085
api-gateway        : 9000
```

Frontend se goi API qua:

```txt
/api/...
```

Apache chuyen `/api/...` ve:

```txt
http://127.0.0.1:9000/api/...
```

## 2. Build frontend

Mo terminal tai thu muc du an:

```powershell
cd "C:\Users\VanDinh\OneDrive\Máy tính\ĐATN\frontend"
npm install
npm run build
```

Sau khi build xong, frontend nam o:

```txt
C:\Users\VanDinh\OneDrive\Máy tính\ĐATN\frontend\dist
```

Trong do phai co:

```txt
index.html
widget.js
assets/
```

## 3. Bat module Apache can thiet

Trong `httpd.conf`, bo comment cac dong nay neu dang bi comment:

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
```

Neu dung VirtualHost, dam bao co:

```apache
Include conf/extra/httpd-vhosts.conf
```

## 4. Them VirtualHost

Da co file cau hinh mau:

```txt
C:\Users\VanDinh\OneDrive\Máy tính\ĐATN\apache-wisebot.conf
```

Noi dung chinh:

```apache
DocumentRoot "C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/frontend/dist"

ProxyPass "/api/" "http://127.0.0.1:9000/api/"
ProxyPassReverse "/api/" "http://127.0.0.1:9000/api/"
```

Copy noi dung file `apache-wisebot.conf` vao:

```txt
conf/extra/httpd-vhosts.conf
```

Hoac include truc tiep file do trong `httpd.conf`.

## 5. Chay backend

Can chay toi thieu:

```txt
api-gateway
user-service
document-service
chat-service
widget-service
billing-service
ai-service
embedding-service
```

Neu gateway khong chay, frontend se loi khi goi `/api`.

Kiem tra gateway:

```txt
http://localhost:9000/actuator/health
```

## 6. Restart Apache

Sau khi sua config:

- Restart Apache trong XAMPP/WAMP, hoac
- Restart service Apache tren Windows

Mo:

```txt
http://wisebot.qzz.io
```

Neu test local bang domain, them vao file hosts:

```txt
127.0.0.1 wisebot.qzz.io
```

File hosts Windows:

```txt
C:\Windows\System32\drivers\etc\hosts
```

## 7. Luu y voi Widget

Widget nhung se load:

```txt
https://wisebot.qzz.io/widget.js
```

Va goi:

```txt
/api/widget/public/widgets/code/{widgetCode}
```

Vi vay Apache phai proxy `/api` ve `api-gateway`.

Neu widget khong hien, kiem tra:

- Domain hien tai da them trong Allowed domains chua
- `widget-service` co chay port `8084` khong
- `api-gateway` co chay port `9000` khong
- Apache da proxy `/api` dung chua

## 8. Loi hay gap

### Refresh trang con bi 404

Can co rewrite ve `index.html`. File `apache-wisebot.conf` da co:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^ index.html [L]
```

### API loi 500 connection refused

Thuong la service backend chua chay hoac gateway tro sai port.

Kiem tra:

```txt
http://localhost:9000/actuator/health
```

### Widget bi chan domain

Them domain dang mo web vao Allowed domains, vi du:

```txt
wisebot.qzz.io
localhost
```

