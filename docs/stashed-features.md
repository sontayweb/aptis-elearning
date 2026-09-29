# TÀI LIỆU LƯU TRỮ CÁC TÍNH NĂNG TẠM ẨN (STASHED FEATURES & COMPONENTS)
> **Cập nhật ngày:** 27/09/2026  
> **Mục đích:** Ghi nhận chi tiết các component mở rộng đã hoàn thiện nhưng đang tạm ẩn (commented out) để giao diện Dashboard chuẩn 100% theo bản mẫu `https://aptiskytich.vn/dashboard` phục vụ demo hoặc bàn giao. Khi cần tái kích hoạt chỉ cần uncomment theo hướng dẫn bên dưới.

---

## 1. Component `GoalTracker` (Bộ Đếm Mục Tiêu & Gợi Ý Ôn Luyện)

* **Đường dẫn tệp:** `frontend/src/components/goal-tracker.tsx`
* **Vị trí tích hợp:** `frontend/src/app/page.tsx` (Sidebar cột phải - `lg:col-span-1`)
* **Trạng thái hiện tại:** Đã tinh chỉnh lại layout cột dọc chuẩn responsive (`flex-col`, không vỡ layout) và đang tạm comment out tại `frontend/src/app/page.tsx`.

### Chức năng chính:
1. **Đếm ngược ngày thi & Aim:** Hiển thị số ngày còn lại tới ngày thi thật (`daysRemaining`) và mục tiêu chứng chỉ (Aim B1, B2, C).
2. **Theo dõi chỉ tiêu hàng ngày:** Vòng tròn tiến độ hoàn thành bài luyện trong ngày (`todayCount / targetCount`).
3. **Modal chỉnh sửa mục tiêu:** Bấm nút "Chỉnh sửa" mở pop-up cho phép học viên cập nhật ngày thi, band mục tiêu và chỉ tiêu bài tập mỗi ngày.
4. **Gợi ý đề học hôm nay:** 3 đề xuất bài học dựa trên kỹ năng yếu (Reading, Listening, Speaking).

### Cách kích hoạt lại:
Mở `frontend/src/app/page.tsx`, tìm dòng 104 và bỏ comment:
```tsx
{/* Right 1 Col: Blog Tips + Referral + Speedup Speaking + History */}
<div className="space-y-6">
  <GoalTracker
    examDate={stats?.goal?.examDate || "2026-10-15"}
    aim={stats?.goal?.aim || "B2"}
    dailyTarget={stats?.goal?.dailyTarget || 3}
    todayCount={stats?.goal?.todayCount || 1}
  />
  <TipsSection />
  ...
```

---

## 2. Component `TodayPlan` (Đề Xuất Phân Tích Điểm Yếu AI - "Hôm Nay Nên Làm")

* **Đường dẫn tệp:** `frontend/src/components/today-plan.tsx`
* **Vị trí tích hợp:** `frontend/src/app/page.tsx` (Đầu cột trái - `lg:col-span-2`)
* **Trạng thái hiện tại:** Đang tạm comment out tại `frontend/src/app/page.tsx`.

### Chức năng chính:
* Hiển thị 3 thẻ nhiệm vụ AI phân tích thông minh:
  1. *Reading Part 3 đang là phần yếu nhất* (Dẫn tới `/reading?part=3`).
  2. *12 câu sai đang chờ ôn tập* (Dẫn tới `/grammar?filter=wrong`).
  3. *Lỗi thì quá khứ đơn (Past Simple) lặp 4 lần* (Dẫn tới `/grammar?topic=past-simple`).

### Cách kích hoạt lại:
Mở `frontend/src/app/page.tsx`, tìm dòng 92 và bỏ comment:
```tsx
{/* Left 2 Cols: Streak Meter + Skill Progress */}
<div className="lg:col-span-2 space-y-6">
  <TodayPlan />
  <WeeklyStreakCard ... />
  <SkillProgressCard ... />
</div>
```

---

## 3. Lý Do Tạm Ẩn
1. **Đồng bộ 100% với UI/UX thực tế:** Trên hệ thống `https://aptiskytich.vn/dashboard`, tiến độ tuần đã được tích hợp gọn gàng trong khối `WeeklyStreakCard` ("0/7 Tuần này").
2. **Tối ưu không gian demo:** Tránh trùng lặp nội dung gợi ý giữa 2 bên cột trái và cột phải, giữ trang Dashboard thanh thoát, trực quan đúng chuẩn bản gốc.
