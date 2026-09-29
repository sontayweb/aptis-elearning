# 🚀 Hướng dẫn Deploy lên Coolify — aptis-elearning

**Server**: `http://103.90.227.117:8000`
**Project**: `aptis-elearning` → Environment: `production`

---

## ✅ BƯỚC 1 — PostgreSQL (Đã tạo)

**Cấu hình đã set:**
| Field | Giá trị |
|-------|---------|
| Name | `aptis-postgres` |
| Image | `postgres:16-alpine` |
| Username | `postgres` |
| Password | `123456` |
| Initial Database | `aptis_kytich_db` |

**→ Sau khi Start, Internal URL sẽ có dạng:**
```
postgresql://postgres:123456@aptis-postgres:5432/aptis_kytich_db
```
*(Ghi lại URL này, sẽ dùng cho Backend)*

---

## ✅ BƯỚC 2 — Redis

1. Vào project → **+ Add Resource** → **Databases** → **Redis**
2. Cấu hình:

| Field | Giá trị |
|-------|---------|
| Name | `aptis-redis` |
| Password | `123456` |

3. Click **Save** → Click **Start**

**Internal host**: `aptis-redis` / **Port**: `6379`

---

## ✅ BƯỚC 3 — Backend (Express + Prisma)

1. Vào project → **+ Add Resource** → **Applications** → **Public Repository**
2. Nhập URL repo:
```
https://github.com/sontayweb/aptis-elearning
```
3. **Build Pack**: chọn `Dockerfile`
4. **Dockerfile Location**:
```
Dockerfile.backend
```
5. **Port**: `5000`
6. Click **Save**

### Environment Variables — Backend

Vào tab **Environment Variables** → thêm từng biến:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:123456@aptis-postgres:5432/aptis_kytich_db
REDIS_HOST=aptis-redis
REDIS_PORT=6379
REDIS_PASSWORD=123456
JWT_ACCESS_SECRET=aptis_super_secret_access_2026_!@#
JWT_REFRESH_SECRET=aptis_super_secret_refresh_2026_!@#
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://103.90.227.117:3000
API_BASE_URL=http://103.90.227.117:5000
GOOGLE_CLIENT_ID=mock-google-client-id
GOOGLE_CLIENT_SECRET=mock-google-client-secret
GOOGLE_CALLBACK_URL=http://103.90.227.117:5000/api/auth/google/callback
OPENAI_API_KEY=
USE_REAL_AI=false
UPLOAD_DIR=./uploads
SEPAY_API_KEY=sepay_api_key_demo
SEPAY_WEBHOOK_SECRET=sepay_webhook_secret_demo
SEPAY_BANK_ACCOUNT=0866950837
SEPAY_BANK_NAME=MBBank
```

7. Click **Deploy**

---

## ✅ BƯỚC 4 — Frontend (Next.js)

1. Vào project → **+ Add Resource** → **Applications** → **Public Repository**
2. Nhập URL repo:
```
https://github.com/sontayweb/aptis-elearning
```
3. **Build Pack**: chọn `Dockerfile`
4. **Dockerfile Location**:
```
Dockerfile.frontend
```
5. **Port**: `3000`

### Environment Variables — Frontend

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://103.90.227.117:5000
```

6. Click **Deploy**

---

## 🔍 Kiểm tra sau khi deploy

| Service | URL kiểm tra |
|---------|-------------|
| Backend Health | `http://103.90.227.117:5000/api/health` |
| Frontend | `http://103.90.227.117:3000` |

---

## ⚠️ Lưu ý quan trọng

> [!WARNING]
> Password `123456` rất yếu. Sau khi deploy xong, nên đổi thành password mạnh hơn trong phần **Danger Zone** của từng service.

> [!NOTE]
> Lần deploy đầu tiên backend sẽ tự chạy `prisma migrate deploy` để tạo toàn bộ bảng trong PostgreSQL.
> Nếu muốn seed data mẫu, vào **Terminal** của service backend trong Coolify rồi chạy:
> ```bash
> node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts
> ```

> [!TIP]
> Nếu backend và frontend cùng project trong Coolify, chúng kết nối với nhau qua **tên container** (internal network), không cần IP công khai.
