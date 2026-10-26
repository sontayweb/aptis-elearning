# BÁO CÁO ĐÁNH GIÁ UI/UX & ĐỀ XUẤT CẢI TIẾN HỆ THỐNG QUẢN TRỊ ĐỀ THI (ADMIN EXAMS)

> **Tài liệu tổng hợp**: Đánh giá bố cục tìm kiếm, phân tích lỗi lệch pha dữ liệu, hướng dẫn chỉnh sửa nội dung/hình ảnh và đề xuất module quản lý Đề Key Dự Đoán (☘️ / Hot Level).  
> **Hệ thống**: Aptis ESOL Premier (Admin Portal & Student Portal)  
> **Ngày lập**: 25/10/2026

---

## 1. PHÂN TÍCH BỐ CỤC TÌM KIẾM HIỆN TẠI (THE CURRENT LAYOUT FLOW)

Qua đối soát thực tế giao diện tại `/admin/exams` và phản hồi của người dùng, bố cục hiện tại bộc lộ 3 vấn đề lớn:

```
[ TẦNG 1: Tab chính ]         [ Đề thi (0) ]   [ Ngân hàng câu hỏi ]
[ TẦNG 2: Kỹ năng ]           (Tất cả) (Nghe) (Đọc) (Viết) [Nói - Active] (Full Test)
[ TẦNG 3: Phần thi (Part) ]   (Tất cả) (Part 1) (Part 2) [Part 3 - Active] (Part 4)
[ TẦNG 4: Breadcrumb lọc ]    Bộ lọc đang xem: SPEAKING -> Part 3 -> So sánh 2 bức tranh [Xóa lọc]
[ TẦNG 5: Hàng tìm kiếm ]     [ Ô nhập từ khóa dài... ] --- khoảng trống --- [ Dropdown ] --- [ Nút tím ]
```

### 1.1. Phân tách chức năng chưa rõ ràng giữa các tầng (Scope Confusion)
- **Vấn đề**: Giao diện có tới 5 tầng lọc xếp chồng lên nhau theo chiều dọc. Khi người dùng nhập từ khóa vào ô search ở tầng 5, họ hoàn toàn bị mơ hồ: *Từ khóa này đang tìm kiếm trên toàn hệ thống hay chỉ lọc trong phạm vi `Nói > Part 3` đã chọn ở trên?*
- **Thực tế trong code**: Backend xử lý theo phép giao đồng thời:
  $$\text{Query} = \text{Skill (SPEAKING)} \land \text{Part (3)} \land \text{Search Keyword}$$
  Tuy nhiên, cách dàn trải giao diện không thể hiện được tính kế thừa này, tạo cảm giác rời rạc.

### 1.2. Điểm bất hợp lý về luồng thao tác mắt (Eye-tracking Friction)
- **Vấn đề**: Ô nhập text đặt bên trái, Dropdown dạng câu/Hot đặt ở giữa, trong khi nút bấm hành động `[Tìm câu hỏi]` (màu tím) lại nằm tít bên phải cùng.
- **Hệ quả**: Chuyển động mắt bị ngắt quãng: Nhìn bên trái $\rightarrow$ nhảy qua dropdown ở giữa $\rightarrow$ liếc sang góc phải để bấm nút $\rightarrow$ nhìn xuống dưới xem kết quả. Thao tác này đi ngược lại nguyên lý UX tự nhiên của thanh tìm kiếm.

### 1.3. Lỗi tìm kiếm rỗng ("Không tìm thấy")
- Khi người dùng copy tên đề từ trang học sinh: `Đề 010 — Two Pictures Comparison` dán vào ô tìm kiếm thì cả 2 tab `[Đề thi]` và `[Ngân hàng câu hỏi]` đều trả về rỗng.

---

## 2. NGUYÊN NHÂN CỐT LÕI VỀ KỸ THUẬT & DỮ LIỆU (ROOT CAUSES)

Kiểm tra trực tiếp database với ID đề thi `88b39b82-5fde-4a22-b08e-a827902e2873` (Part 3):

```json
{
  "id": "88b39b82-5fde-4a22-b08e-a827902e2873",
  "title": "Đề 04 — Full Speaking · 4 Parts",
  "skill": "SPEAKING",
  "parts": [
    {
      "part_number": 3,
      "title": "Part 3: Part 3 - Compare & Explain",
      "image_url": "/uploads/speaking/part3/image1.jpg, /uploads/speaking/part3/image4.jpg",
      "questions": [
        { "prompt": "Describe the picture.", "explanation": "In the first picture, I can see several football players..." }
      ]
    }
  ]
}
```

### 2.1. Lệch pha giữa Giao diện Học viên và Cơ sở dữ liệu
* Tại trang học viên (`frontend/src/app/speaking/page.tsx` dòng 540-558):
  * Tên đề thi được **nối chuỗi động bằng mã frontend** theo chỉ số mảng:
    $$\text{Tên hiển thị} = \text{"Đề "} + (index + 1) + \text{" — Two Pictures Comparison"}$$
  * Đề thứ 10 trong danh sách được hiển thị thành `Đề 010 — Two Pictures Comparison`.
* Nhưng trong Database:
  * Tên gốc của đề thi này là: **`Đề 04 — Full Speaking · 4 Parts`**.
  * Tiêu đề Part 3 là: **`Part 3: Part 3 - Compare & Explain`**.
  * Chuỗi `"Đề 010"` và `"Two Pictures Comparison"` **hoàn toàn không tồn tại trong DB**, khiến câu lệnh tìm kiếm SQL/Prisma trả về 0 kết quả.

### 2.2. Vị trí lưu trữ hình ảnh (Media Architecture)
* Trong bài thi Speaking (đặc biệt Part 2 miêu tả tranh và Part 3 so sánh tranh), hình ảnh được lưu ở cấp độ **Phần thi (`Part.image_url`)**, không lưu trong từng câu hỏi con (`Question`).
* Vì vậy, khi Admin tìm kiếm trong tab `[Ngân hàng câu hỏi]`, bảng này chỉ quản lý các câu hỏi văn bản, không hiển thị trường chỉnh sửa ảnh của Part.

### 2.3. Hạn chế của Search Engine Admin
* `admin.service.ts` hiện tại chỉ tìm kiếm theo `title contains term` hoặc `prompt contains term`.
* Hệ thống **chưa hỗ trợ tìm kiếm bằng mã UUID** (`88b39b82-...`) hoặc dán trực tiếp đường link bài thi của học sinh vào ô tìm kiếm.

---

## 3. VẤN ĐỀ VỀ "MỨC ĐỘ HOT" (⭐) VÀ "ĐỀ KEY DỰ ĐOÁN" (☘️)

### 3.1. Hiện trạng
* **Trên Sidebar Admin**: Hiện tại **CHƯA CÓ** menu riêng cho *"Đề Key Dự Đoán"* hay *"Quản lý Đề Hot / Trúng Tủ ☘️"*.
* **Cơ chế hiện tại**: Tính năng này đang được gắn phân tán:
  1. Nút bấm đổi sao tại cột `MỨC ĐỘ HOT` trong bảng danh sách đề thi (xoay vòng: 0⭐ $\rightarrow$ 1⭐ $\rightarrow$ 2⭐ $\rightarrow$ 3⭐).
  2. Dropdown lọc theo mức độ Hot tại thanh tìm kiếm.
  3. Trường nhập nhãn dự đoán `forecast_tag` (ví dụ: *"Đề tủ tháng này"*, *"90% trúng tủ"*) bị giấu bên trong modal `[Cấu hình đề]` của trang biên soạn.
* **Mâu thuẫn trải nghiệm**: Trong khi ở trang học viên có hẳn mục lớn **[✨ Đề Key Dự Đoán]** (`/key-du-doan`), thì Admin lại không có một bảng riêng để quản lý tập trung các đề này.

---

## 4. HƯỚNG DẪN THAO TÁC SỬA ẢNH ĐỀ BỊ LỖI HIỆN TẠI

Để sửa ảnh Part 3 của đề `http://localhost:3000/speaking/88b39b82-5fde-4a22-b08e-a827902e2873?part=3`:

1. **Truy cập trực tiếp đường link biên soạn**:
   ```
   http://localhost:3000/admin/exams/88b39b82-5fde-4a22-b08e-a827902e2873/edit
   ```
   *(Hoặc vào `/admin/exams`, chọn kỹ năng Speaking, gõ tìm từ khóa `Đề 04` rồi bấm `Biên soạn`)*.
2. Cuộn xuống mục **Part 3** (`Part 3: Part 3 - Compare & Explain`).
3. Bấm vào icon **✏️ (Sửa phần thi)** ở bên phải thanh tiêu đề Part 3.
4. Tại ô **"Hình ảnh minh họa Part (Speaking / Reading)"**:
   * Tải ảnh mới từ máy tính hoặc cập nhật 2 URL ảnh cách nhau bởi dấu phẩy:  
     `https://link-anh-1.jpg, https://link-anh-2.jpg`
5. Bấm **[Lưu phần thi]**.

---

## 5. ĐỀ XUẤT CẢI TIẾN & THIẾT KẾ LẠI (ACTION PLAN)

### 5.1. Cải tiến 1: Thiết kế lại Thanh tìm kiếm (Phương án B - Live Filter)
Tối ưu hóa thành thanh tìm kiếm thông minh dạng Live Search ngay dưới thanh chọn Part:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [ KỸ NĂNG:  (Tất cả)  (🎧 Nghe)  (📖 Đọc)  (✍️ Viết)  [🎙️ Nói (Active)]  (Full Test) ]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ PHẦN THI: (Tất cả)  (Part 1)   (Part 2)  [Part 3 (Active)]  (Part 4)               ]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔍 [ Tìm kiếm theo tên đề, mã UUID, từ khóa câu hỏi hoặc dán link bài thi... ]   [X]   │
│    Bộ lọc nhanh: [Tất cả] [🔥 Đề tủ 3⭐] [⭐ Có gắn sao] [VIP PRO] [Bản nháp]           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Bỏ nút tím rườm rà**: Tự động lọc khi gõ (Debounce 300ms).
* **Placeholder động theo Part**: Khi đang ở Speaking Part 3, hiển thị: *"Tìm câu hỏi, tranh ảnh trong Speaking Part 3..."*.
* **Hỗ trợ dán Link / UUID**: Nếu admin dán `88b39b82-...` hoặc dán link URL `http://localhost:3000/speaking/...`, hệ thống tự trích xuất ID và lọc ra chính xác đề đó.

### 5.2. Cải tiến 2: Bổ sung Module Quản lý "Đề Key Dự Đoán / Đề Hot ☘️"
* **Trên Sidebar Admin**: Thêm menu **"☘️ Đề Key Dự Đoán"** trong mục **HỌC VỤ** (đường dẫn `/admin/forecast`).
* **Tính năng trang**:
  * Hiển thị danh sách tất cả đề thi có `hot_level > 0` hoặc có `forecast_tag`.
  * Cho phép chỉnh sửa nhanh nhãn dự đoán (ví dụ: *"Hay ra tháng 10"*, *"Đề tủ 95%"*), gán ảnh đại diện và tỷ lệ trúng tủ đồng bộ với trang học viên `/key-du-doan`.

### 5.3. Cải tiến 3: Đồng bộ số thứ tự Đề thi
* Chuẩn hóa lại trường `title` trong Database hoặc xây dựng trường `display_code` (ví dụ: `SP-010`) để tên đề hiển thị của học sinh và tên đề trong trang quản trị hoàn toàn trùng khớp nhau.
