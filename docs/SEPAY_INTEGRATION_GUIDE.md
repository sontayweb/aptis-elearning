# Tài Liệu Chuẩn Tích Hợp Thanh Toán Tự Động SePay (VietQR & VA)

Tài liệu này tổng hợp đầy đủ quy trình tích hợp **SePay (VietQR & Tài khoản ảo VA)** từ thực tế triển khai trên hệ thống **Aptis E-learning (`aptisesolpremier.com`)**, dùng làm sổ tay chuẩn khi đổi ngân hàng hoặc tích hợp cho các dự án tiếp theo.

---

## 1. Cấu Hình Trên Dashboard SePay (`my.sepay.vn`)

### Bước 1.1: Liên kết tài khoản ngân hàng & Tạo mã VA
1. Vào **Ngân hàng** → **Kết nối tài khoản**.
2. Chọn ngân hàng (khuyên dùng **BIDV**, **MBBank**, **ACB**, **VPBank**, **TPBank** có hỗ trợ API chính thức & VA đồng bộ tức thì 1–3 giây).
3. Hoàn tất xác thực OTP và tạo **Số tài khoản VA** (ví dụ: `96247SONTAY` của `BIDV`).
4. Thực hiện 1 giao dịch chuyển thử (ví dụ `3.000đ`) trên bước kiểm tra của SePay để xác nhận trạng thái **"Nhận giao dịch thành công"**.

### Bước 1.2: Tạo Webhook (4 Bước trên giao diện SePay)

| Bước trên SePay | Trường cấu hình | Giá trị chuẩn cần chọn | Lưu ý quan trọng |
| :--- | :--- | :--- | :--- |
| **1. Cơ bản** | **Tên webhook** | Tên dự án (VD: `Sơn Tây Web`) | Dễ phân biệt khi có nhiều web |
| | **URL nhận webhook** | `https://api.<ten-mien>/api/payment/webhook` | **Phải trỏ đúng vào subdomain của Backend API** (`api.`), không trỏ vào Frontend Next.js nếu tách 2 container |
| | **Loại giao dịch** | `Tiền vào` | Chỉ nhận biến động cộng tiền |
| | **Định dạng dữ liệu** | `JSON (khuyến nghị) — application/json` | Chuẩn REST API |
| | **Tự động gửi lại khi lỗi** | **BẬT (ON)** | Tự gửi lại tối đa 7 lần nếu server đang restart |
| **2. Tài khoản** | **Tài khoản ngân hàng** | `Tất cả tài khoản` (hoặc chọn TK cụ thể) | |
| | **Dùng để xác thực thanh toán** | **TẮT (OFF)** | **Rất quan trọng**: Để TẮT giúp SePay bắn 100% giao dịch tiền vào về Backend để Backend tự lọc mã đơn (`APTIS1M`, `APTIS3M`, `APTIS6M`) |
| **3. Bảo mật** | **Phương thức xác thực** | **`API Key`** | SePay sẽ gửi header `Authorization: Apikey <MA_KEY>` |
| | **Mã API Key** | Chuỗi bí mật tự đặt (VD: `sepay_aptis_sontay_2026_key99`) | Copy mã này để cấu hình vào biến `SEPAY_API_KEY` trên Server |
| **4. Cảnh báo** | **Bật cảnh báo khi lỗi** | Tùy chọn (Tắt hoặc Bật) | Bấm **`✓ Thêm`** để hoàn tất |

---

## 2. Cấu Hình Biến Môi Trường (`.env` / Coolify)

Trên môi trường Server (Ubuntu / Docker / Coolify), cần khai báo đủ **5 biến môi trường** sau cho Backend:

```env
SEPAY_API_KEY=sepay_aptis_sontay_2026_key99
SEPAY_WEBHOOK_SECRET=sepay_aptis_sontay_2026_key99
SEPAY_BANK_ACCOUNT=96247SONTAY
SEPAY_BANK_NAME=BIDV
SEPAY_ACCOUNT_NAME=TRUONG HOANG HIEP
```

- Trên môi trường `NODE_ENV=production`, không được để các giá trị mặc định như `sepay_api_key_demo`, `demo`, `test` vì hàm bảo mật `verifySepayWebhookAuth` sẽ tự động từ chối (HTTP 503) để chống giả mạo.
- Nếu dùng **Tài khoản ảo (VA)** như `96247SONTAY`, biến `SEPAY_BANK_ACCOUNT` phải đặt là mã VA (`96247SONTAY`) để mã QR VietQR sinh ra hướng tiền vào đúng VA đó.

---

## 3. Các Điểm Kỹ Thuật Cốt Lõi Trong Code (Dành Cho Dự Án Mới)

### 3.1. Công thức tạo ảnh VietQR động qua SePay
```ts
const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(bankAccount)}&bank=${encodeURIComponent(bankName)}&amount=${amount}&des=${encodeURIComponent(orderCode)}`;
```

### 3.2. Lưu ý quan trọng khi dùng Tài khoản VA (BIDV / ACB / VPBank)
Khi khách quét mã QR của tài khoản VA (`96247SONTAY`), JSON mà SePay gửi về Webhook sẽ có:
- `accountNumber`: Số tài khoản gốc tại ngân hàng.
- `subAccount`: Mã tài khoản VA (`96247SONTAY`).

Do đó, khi kiểm tra tài khoản thụ hưởng trong Backend (`backend/src/modules/payment/payment.service.ts`), **bắt buộc phải so khớp với cả `accountNumber` HOẶC `subAccount`**:

```ts
const configuredAccount = (process.env.SEPAY_BANK_ACCOUNT || '').replace(/\s+/g, '').toUpperCase();
const incomingAccount = (data.accountNumber || '').replace(/\s+/g, '').toUpperCase();
const incomingSubAccount = (data.subAccount || '').replace(/\s+/g, '').toUpperCase();

if (
  configuredAccount &&
  (incomingAccount || incomingSubAccount) &&
  configuredAccount !== incomingAccount &&
  configuredAccount !== incomingSubAccount
) {
  return { success: false, message: 'Số tài khoản thụ hưởng không khớp' };
}
```

---

## 4. Lệnh Kiểm Thử Nhanh (Troubleshooting Checklist)

```powershell
curl.exe -i -X POST https://api.aptisesolpremier.com/api/payment/webhook `
  -H "Content-Type: application/json" `
  -H "Authorization: Apikey sepay_aptis_sontay_2026_key99" `
  -d '{\"content\":\"APTIS1M9999999\",\"transferAmount\":10000,\"transferType\":\"in\",\"accountNumber\":\"2151000000\",\"subAccount\":\"96247SONTAY\"}'
```

- **Nếu trả về `HTTP 400` kèm `{"success":false,"message":"Không tìm thấy giao dịch chờ xử lý khớp mã"}`**: Đã cấu hình **ĐÚNG 100%** (vượt qua xác thực `SEPAY_API_KEY` và khớp tài khoản VA `96247SONTAY`).
- **Nếu trả về `HTTP 401 Unauthorized`**: Chưa lưu `SEPAY_API_KEY` mới trên Coolify hoặc chưa bấm **Redeploy** sau khi lưu.
