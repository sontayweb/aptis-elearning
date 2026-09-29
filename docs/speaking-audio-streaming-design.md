# BẢN THIẾT KẾ KỸ THUẬT HOÀN CHỈNH & TỰ ĐÁNH GIÁ (FEASIBILITY AUDIT)
## TÍNH NĂNG THU ÂM, LƯU TRỮ VÀ STREAMING AUDIO KỸ NĂNG SPEAKING
### Hệ Thống Luyện Thi & Khảo Thí Aptis ESOL (Aptis Kỳ Tích)
*Tài liệu kỹ thuật chuyên sâu phục vụ thẩm định trước khi triển khai (Zero Speculation · Production Enterprise Grade)*  
*Ngày lập: 25/09/2026 · Phiên bản: 1.0.0-PROPOSAL*

---

## I. BỐI CẢNH & ĐẶC TẢ NGHIỆP VỤ KHẢO THÍ (APTIS ESOL SPEAKING)

### 1.1. Cấu Trúc Đề Thi Chuẩn British Council
Theo định dạng chuẩn khảo thí Aptis ESOL của Hội Đồng Anh, bài thi Speaking diễn ra trong **12 phút** trên máy tính với 4 phần (Parts):

| Phần thi | Nhiệm vụ của thí sinh | Số câu hỏi | Thời gian chuẩn bị (Prep Time) | Thời gian nói (Speak Time) | Định dạng phương tiện |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Part 1** | Thông tin cá nhân (Personal Information) | 3 câu hỏi ngắn | 0 giây (Không có chuẩn bị) | 30 giây / câu | Chỉ có Audio/Text prompt |
| **Part 2** | Mô tả tranh & Trả lời câu hỏi (Describe a Picture) | 3 câu (1 mô tả + 2 câu hỏi liên quan) | 0 giây (Câu 1 có 30s đọc) | 45 giây / câu | 1 Hình ảnh + Prompt |
| **Part 3** | So sánh 2 bức tranh & Thảo luận (Compare Two Pictures) | 3 câu (1 so sánh + 2 câu thảo luận) | 0 giây | 45 giây / câu | 2 Hình ảnh đối chiếu + Prompt |
| **Part 4** | Trải nghiệm cá nhân & Quan điểm (Personal Experience) | 3 câu hỏi hiển thị cùng lúc | **60 giây** chuẩn bị (được ghi chú) | **120 giây (2 phút)** nói liên tục | 1 Hình ảnh + 3 Câu hỏi |

### 1.2. Luồng Trải Nghiệm Khảo Thí Tự Động (Automated Exam Flow)
Trong phòng thi thực tế của British Council:
1. Thí sinh **KHÔNG được bấm nút Pause** hay ghi âm lại khi đang thi chính thức.
2. Hệ thống đếm ngược thời gian chuẩn bị (Prep Timer).
3. Hết thời gian chuẩn bị, phát âm thanh tín hiệu (*Beep*) -> Hệ thống **tự động kích hoạt thu âm** (Recording Active).
4. Đồng hồ đếm lùi thời gian trả lời (Speak Timer) chạy kèm thanh Visualizer sóng âm thời gian thực.
5. Khi hết thời gian nói (hoặc thí sinh bấm *Hoàn thành sớm*): Hệ thống tự động ngắt thu âm, đóng gói audio, gửi ngầm lên Backend (Background Upload) và tự động chuyển sang câu hỏi kế tiếp.

---

## II. KIẾN TRÚC TỔNG THỂ PHÂN HỆ AUDIO (END-TO-END ARCHITECTURE)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         TRÌNH DUYỆT THÍ SINH (CLIENT)                           │
│                                                                                │
│  [Microphone]                                                                  │
│       │                                                                        │
│       ▼                                                                        │
│  [getUserMedia] ──► [Web Audio API: AnalyserNode] ──► [Waveform Canvas Visual]  │
│       │                                                                        │
│       ▼                                                                        │
│  [MediaRecorder API] (Slice chunks: 1000ms, mimeType: webm/opus || mp4)        │
│       │                                                                        │
│       ▼ (Khi dừng câu)                                                         │
│  [Blob Packaging] ──► [IndexedDB Backup] (Chống mất khi rớt mạng)              │
│       │                                                                        │
│       ▼ (POST multipart/form-data)                                             │
└───────┼────────────────────────────────────────────────────────────────────────┘
        │ Network Transfer (HTTPS)
        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                        HỆ THỐNG BACKEND (EXPRESS + NODE.JS)                     │
│                                                                                │
│  [Multer Storage] (Uploads buffer / Temporary Temp File)                       │
│       │                                                                        │
│       ▼                                                                        │
│  [Audio Validator] (File Magic Bytes, MIME Whitelist, Size < 15MB, Duration)    │
│       │                                                                        │
│       ▼                                                                        │
│  [Partitioned Storage]                                                         │
│  /uploads/audio/submissions/{year}/{month}/{submission_id}/q_{questionId}.webm │
│       │                                                                        │
│       ├──────────────────────────────────────────┐                             │
│       ▼                                          ▼                             │
│  [Prisma DB Update]                    [HTTP Range Streaming Proxy]             │
│  Table: SubmissionAnswer                Endpoint: GET .../audio/:questionId     │
│  (audio_url, duration, mime, size)     (Status 206 Partial Content, seeking)   │
└──────────────────────────────────────────────────┼─────────────────────────────┘
                                                   │
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                           CÁC HỆ THỐNG TIÊU THỤ AUDIO                          │
│                                                                                │
│  1. [OpenAI Whisper Pipeline]: Bóc băng Speech-to-Text sinh transcript         │
│  2. [Giảng viên Portal]: Audio Player tua lại từng đoạn để chấm chi tiết      │
│  3. [Học viên Review]: Nghe lại bài thi của mình sau khi có điểm               │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## III. THIẾT KẾ CHI TIẾT PHÍA CLIENT (FRONTEND AUDIO ENGINE)

### 3.1. Quản lý Quyền Truy cập Microphone (Device Permission Lifecycle)
- **Trạng thái Micro (Mic State Machine)**:
  - `IDLE`: Chưa xin quyền.
  - `REQUESTING`: Đang hiển thị popup trình duyệt xin quyền micro.
  - `READY`: Đã cấp quyền, nhận được `MediaStream`, sẵn sàng thu âm.
  - `RECORDING`: Đang ghi âm dữ liệu âm thanh.
  - `PAUSED`: Tạm dừng (chỉ ở chế độ luyện tập tự do).
  - `STOPPED`: Đã dừng và đóng gói Blob.
  - `ERROR`: Lỗi micro (Từ chối quyền, không tìm thấy thiết bị, micro bị ứng dụng khác chiếm dụng).
- **Xử lý ngoại lệ**:
  - `NotAllowedError`: Hiển thị Modal hướng dẫn trực quan cách bấm vào biểu tượng "Ổ khóa" trên thanh địa chỉ URL để cấp lại quyền micro.
  - `NotFoundError`: Báo lỗi không có thiết bị đầu vào, yêu cầu cắm tai nghe có mic.

### 3.2. Cấu hình Audio Constraints Chất Lượng Khảo Thí
Để tránh tiếng ồn môi trường, tiếng vang từ loa ngoài và méo giọng:
```typescript
const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,   // Khử tiếng vang (bắt buộc khi thí sinh không đeo tai nghe)
    noiseSuppression: true,   // Lọc tiếng ồn quạt gió/tiếng bàn phím
    autoGainControl: true,    // Tự động cân bằng âm lượng (tránh nói nhỏ quá AI không nghe rõ)
    channelCount: 1,          // Mono 1 kênh (giảm 50% dung lượng mà giọng nói vẫn cực rõ)
    sampleRate: 48000,        // Tần số mẫu chuẩn 48kHz
  },
  video: false,
};
```

### 3.3. Xử lý Đa Nền Tảng (Cross-Browser MIME Compatibility)
Đây là lỗi kinh điển khiến nhiều hệ thống bị chết trên iPhone/iPad:
- **Chrome / Edge / Firefox / Android**: Hỗ trợ tốt nhất là `audio/webm;codecs=opus`.
- **Safari / iOS / macOS**: Không hỗ trợ `audio/webm`, chỉ hỗ trợ `audio/mp4` hoặc `audio/aac`.
- **Giải pháp chuyển đổi tương thích**:
  ```typescript
  function getSupportedMimeType(): string {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
    ];
    for (const type of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; // Fallback nếu trình duyệt quá cũ
  }
  ```

### 3.4. Sóng Âm Trực Quan (Real-time Audio Visualizer)
- Sử dụng `AudioContext` và `AnalyserNode` trích xuất biên độ âm thanh (RMS amplitude) từ micro mỗi 50ms.
- Hiển thị thanh đo âm lượng (Volume Meter) và 16 vạch sóng âm động trên giao diện.
- **Tính năng Silent Detection (Cảnh báo mic câm)**:
  - Nếu trong 10 giây đầu tiên ghi âm mà biên độ âm thanh $RMS < 0.01$ (thí sinh quên chưa bật công tắc micro trên tai nghe hoặc nói quá nhỏ), hiển thị cảnh báo nhấp nháy: *"⚠️ Âm lượng quá nhỏ, hãy kiểm tra mic của bạn!"*.

### 3.5. Cơ Chế Chống Mất Bài Thi Khi Rớt Mạng (Offline Resilience)
- Khi `MediaRecorder.onstop` kích hoạt:
  1. Tạo `Blob` và lưu ngay 1 bản sao tạm thời vào **IndexedDB** của trình duyệt kèm key `exam_${submissionId}_q_${questionId}`.
  2. Bắt đầu gửi file lên server qua `fetch('/api/submissions/:id/answers/:questionId/audio')`.
  3. Nếu upload thành công: Xóa bản sao trong IndexedDB.
  4. Nếu upload thất bại do rớt mạng: Giữ lại trong IndexedDB, hiển thị trạng thái "Đang thử gửi lại..." và tự động retry khi mạng có lại (sự kiện `window.addEventListener('online')`).

---

## IV. THIẾT KẾ CHI TIẾT PHÍA BACKEND (SERVER INGESTION & STREAMING)

### 4.1. Bộ Nhận Tệp Tin Đa Dạng (Multer Upload Middleware)
Cấu hình tại `backend/src/middlewares/upload.ts`:
- **Thư mục tạm:** `uploads/temp`
- **Giới hạn dung lượng (Limit):** $15 \text{ MB}$ (một câu nói dài nhất 120s ở Part 4 chuẩn Opus chỉ chiếm $\approx 1.2 \text{ MB}$, mức 15MB đảm bảo dư dả cho file wav không nén).
- **Bộ lọc MIME:** Chỉ chấp nhận các header MIME:
  `['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'audio/aac', 'audio/ogg']`.

### 4.2. Lưu Trữ Tệp Tin Phân Cấp (Partitioned Storage)
Để tránh tình trạng 1 thư mục chứa hàng trăm nghìn file gây nghẽn hệ thống tệp tin của Linux (inode exhaustion):
```
uploads/audio/submissions/
  └── 2026/
      └── 09/
          └── {submission_id}/
              ├── part_1_q_1.webm
              ├── part_1_q_2.webm
              ├── part_2_q_4.webm
              └── part_4_q_10.webm
```

### 4.3. API Endpoint Đầy Đủ

#### 1. Upload Audio Cho Câu Trả Lời
- **URL:** `POST /api/submissions/:id/answers/:questionId/audio`
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`
- **Body:**
  - `audio`: File binary
  - `durationSeconds`: Số giây thực tế đo từ client (number)
- **Xác thực:**
  - Phải đăng nhập (`authGuard`).
  - Bài thi phải thuộc về thí sinh (`submission.user_id === userId`) và trạng thái phải là `IN_PROGRESS`.
- **Phản hồi 200 OK**:
  ```json
  {
    "success": true,
    "message": "Lưu file âm thanh thành công",
    "data": {
      "answerId": "uuid-answer",
      "audioUrl": "/api/submissions/sub-123/audio/q-456",
      "audioDuration": 45,
      "audioSizeBytes": 452100,
      "saved": true
    }
  }
  ```

#### 2. HTTP Range Streaming Proxy (Phát Lại & Tua mượt)
- **URL:** `GET /api/submissions/:id/audio/:questionId`
- **Headers:** `Authorization: Bearer <token>` (hoặc cookie/query token cho thẻ `<audio>`)
- **Headers hỗ trợ:** `Range: bytes=start-end`
- **Xử lý Server**:
  - Đọc file từ thư mục vật lý.
  - Nếu có header `Range`:
    - Tính toán `start`, `end`, `chunksize`.
    - Trả về mã trạng thái **`HTTP 206 Partial Content`**.
    - Header:
      ```http
      HTTP/1.1 206 Partial Content
      Content-Range: bytes 0-1048575/3145728
      Accept-Ranges: bytes
      Content-Length: 1048576
      Content-Type: audio/webm
      ```
  - Nếu không có `Range`: Trả về `HTTP 200 OK` với toàn bộ nội dung.
- **Phân quyền truy cập (Access Control)**:
  - Chỉ cho phép: Thí sinh sở hữu bài thi, Giảng viên có quyền chấm bài, hoặc Admin.
  - Ngăn chặn triệt để nguy cơ người lạ truy cập trực tiếp file `.webm` qua link static.

---

## V. TỰ ĐÁNH GIÁ KỸ THUẬT & MA TRẬN RỦI RO (SELF-ASSESSMENT & RISKS)

Dưới đây là phần tự phản biện nghiêm ngặt trước khi viết code, nhằm phát hiện và phòng ngừa mọi điểm gãy trong hệ thống:

| STT | Rủi ro kỹ thuật tiềm ẩn | Khả năng xảy ra | Tác động | Giải pháp kiến trúc phòng ngừa triệt để |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **iOS Safari không hỗ trợ `audio/webm`** | **Rất cao** (100% người dùng iPhone/iPad) | Nghiêm trọng (Thí sinh không ghi âm được) | Hàm `getSupportedMimeType()` sẽ tự động chọn `audio/mp4` hoặc `audio/aac` trên WebKit iOS, Backend Multer và AudioService chấp nhận cả 2 định dạng. |
| **2** | **Thí sinh bấm nộp bài khi file audio chưa upload xong** | **Trung bình** | Nghiêm trọng (Bài nộp bị mất phần nói) | Client duy trì biến đếm `uploadingQueueCount`. Nút "Nộp bài" sẽ disable và hiển thị *"Đang đồng bộ bản ghi âm..."* cho tới khi toàn bộ audio đã cập nhật xong vào DB. |
| **3** | **Micro bị câm / Thí sinh quên bật mic** | **Trung bình** | Cao (AI chấm 0 điểm vì không có tiếng) | `AnalyserNode` đo RMS biên độ âm thanh; nếu im lặng liên tục 10s sẽ hiển thị cảnh báo đỏ ngay trên màn hình. |
| **4** | **Tràn đĩa cứng máy chủ (Disk Exhaustion)** | **Thấp** (trong 6 tháng đầu) | Cao (Server sập do đầy ổ đĩa) | Nhờ nén Opus/AAC bitrate 48kbps, 1 lượt thi 4 Parts chỉ tốn $\approx 3.5 \text{ MB}$. 10,000 lượt thi chỉ tốn $35 \text{ GB}$. Đã thiết kế kiến trúc cô lập `AudioService` để khi cần có thể chuyển sang AWS S3 / Cloudflare R2 chỉ bằng cách thay đổi driver storage. |
| **5** | **Thí sinh F5 (Reload trang) khi đang thi Speaking** | **Trung bình** | Cao (Mất câu trả lời trước đó) | `SubmissionService.resume` đã trả về danh sách các câu đã lưu kèm `audioUrl`. Khi F5, client tự động tải lại tiến độ và cho phép làm tiếp câu chưa hoàn thành. |
| **6** | **Tấn công upload file độc hại (.exe giả danh audio)** | **Thấp** | Nghiêm trọng (RCE máy chủ) | Multer lưu file với phần mở rộng kiểm soát, không cấp quyền thực thi (no execute bit), lưu ngoài thư mục static công khai, kiểm tra magic bytes đầu file. |

---

## VI. KẾ HOẠCH & TRÌNH TỰ TRIỂN KHAI (IMPLEMENTATION ROADMAP)

Để đảm bảo không phá vỡ bất kỳ test case nào hiện có (76/76 tests đang PASS) và kiểm soát rủi ro tuyệt đối:

### Giai đoạn 1: Hoàn thiện Tầng Backend (`backend/`)
1. Tạo file middleware `backend/src/middlewares/upload.middleware.ts` sử dụng `multer` cấu hình an toàn.
2. Bổ sung Controller methods trong `submission.controller.ts`:
   - `uploadAudio(req, res, next)`
   - `streamAudio(req, res, next)`
3. Đăng ký 2 routes mới vào [submission.routes.ts](file:///d:/sontayweb/E-leaning&APTIS/backend/src/modules/submissions/submission.routes.ts):
   - `POST /:id/answers/:questionId/audio` (kèm upload middleware)
   - `GET /:id/audio/:questionId`
4. Bổ sung kiểm thử tự động tại `tests/audio_speaking.test.ts`:
   - Kiểm tra upload file WebM thành công.
   - Kiểm tra từ chối file quá dung lượng hoặc sai MIME.
   - Kiểm tra streaming HTTP 206 Partial Content với Range header.
   - Chạy `npm test` xác nhận 100% các bộ test đều PASS.

### Giai đoạn 2: Hoàn thiện Tầng Frontend (`frontend/`)
1. Tạo Custom Hook `frontend/src/hooks/use-audio-recorder.ts`:
   - Đầy đủ logic `getUserMedia`, `MediaRecorder`, Waveform visualizer, `Blob`, và cross-browser MIME handling.
2. Tích hợp hook vào trang phòng thi Speaking [frontend/src/app/speaking/[id]/page.tsx](file:///d:/sontayweb/E-leaning&APTIS/frontend/src/app/speaking/%5Bid%5D/page.tsx):
   - Thu âm thật qua micro khi hết giờ chuẩn bị.
   - Hiển thị thanh đo âm lượng thật.
   - Cho phép học viên nghe lại bản thu qua thẻ audio trước khi nộp.
   - Tự động upload lên Backend API khi chuyển câu.

---

## VII. KẾT LUẬN & ĐỀ XUẤT PHÊ DUYỆT

Bản thiết kế trên tuân thủ nghiêm ngặt nguyên tắc **Zero Speculation**, bám sát 100% đặc tả đề thi máy tính Aptis ESOL của British Council và tương thích hoàn toàn với schema cơ sở dữ liệu hiện tại của hệ thống.

Mọi khía cạnh rủi ro về thiết bị (Safari/iOS), mạng chập chờn, chống tràn RAM/ổ cứng và bảo mật kiểm soát quyền truy cập đều đã có giải pháp dự phòng rõ ràng.
