## Why

Anh cần một công cụ đơn giản, offline, chạy trên điện thoại để **ghi lại bữa ăn hằng ngày** và biết mình đang ăn bao nhiêu calo/đạm/carb/béo so với mục tiêu — hiện chưa có gì theo dõi dinh dưỡng (các app có sẵn như MyFitnessPal quá nặng, nhiều quảng cáo, dữ liệu món Việt kém và phải trả phí cho tính năng cơ bản). Đồng thời cần **lên kế hoạch bữa ăn theo tuần** để chủ động nấu/ăn thay vì ăn tùy hứng. Đây là bước tiếp theo tự nhiên sau app theo dõi thuốc lá (cùng nhu cầu: theo dõi hành vi + thống kê + kỷ luật mục tiêu), và phải làm trước khi thực hiện để chốt được dữ liệu/công thức dinh dưỡng đúng ngay từ đầu.

## What Changes

- Tạo app PWA mới **"Nhật Ký Bữa Ăn"** — static site (không backend, không build step), chạy offline, cài được vào màn hình chính, deploy qua GitHub → Vercel (cùng mô hình app thuốc lá).
- **Ghi bữa trong ngày**: 5 nhóm bữa (Sáng · Trưa · Chiều · Tối · Ăn vặt), thêm nhanh món từ thư viện, chọn khẩu phần (bát/tô/ổ/miếng/hệ số), xem tổng kcal + 3 macro đã ăn so với mục tiêu trong ngày; sửa/xoá từng món (long-press xoá, time-picker 5 phút cho món ăn thêm hồi tố).
- **Thư viện món Việt**: ~150–200 món ăn/thức uống phổ biến kèm kcal + đạm/carb/béo theo **khẩu phần thực tế người Việt** (1 bát cơm, 1 tô phở, 1 ổ bánh mì…); người dùng thêm được món riêng (tự khai báo dinh dưỡng).
- **Mục tiêu dinh dưỡng**: nhập thông tin cơ thể (cao/nặng/tuổi/giới/mức vận động) → tự tính kcal mục tiêu (Mifflin-St Jeor × hệ số vận động, điều chỉnh theo mục tiêu giảm/giữ/tăng cân) + tỉ lệ macro; hiển thị tiến độ còn lại trong ngày.
- **Dữ liệu của người dùng**: toàn bộ dữ liệu lưu localStorage; xuất/nhập file JSON để tự backup và đồng bộ thủ công (kênh Telegram); xuất CSV để phân tích định kỳ; tự xoá dữ liệu cũ hơn 31 ngày khi khởi động.
- **PWA app shell**: manifest + service worker (cập nhật có kiểm soát, bump cache mỗi deploy), giao diện tối, tiếng Việt, tối đa **4 tab** (Hôm nay · Thống kê · Kế hoạch · Cài đặt).
- **Ngoài phạm vi change này** (sẽ là change riêng): thống kê/biểu đồ nâng cao + theo dõi cân nặng (`add-meal-stats`); kế hoạch bữa ăn tuần + auto-gợi ý + danh sách đi chợ (`add-meal-planning`); đồng bộ vào `~/suc-khoe/suc_khoe.db`.

## Capabilities

### New Capabilities
- `app-shell`: khung PWA (manifest, service worker + chiến lược cập nhật, theme tối, điều hướng 4 tab, install-to-homescreen, trạng thái rỗng khi chưa có dữ liệu).
- `food-library`: thư viện món ăn/thức uống Việt Nam kèm dữ liệu dinh dưỡng theo khẩu phần thực tế; tìm kiếm món; thêm/sửa/xoá món tự khai báo; đánh dấu món yêu thích.
- `meal-log`: ghi nhận bữa ăn theo ngày và nhóm bữa; thêm/sửa/xoá mục; quản lý khẩu phần; tổng hợp kcal + macro trong ngày so với mục tiêu.
- `nutrition-targets`: hồ sơ cơ thể + tính kcal mục tiêu (Mifflin-St Jeor × mức vận động, điều chỉnh theo mục tiêu cân nặng) + tỉ lệ macro; ngưỡng cảnh báo khi vượt/thiếu mục tiêu.
- `data-portability`: xuất/nhập JSON toàn bộ dữ liệu, xuất CSV, tự dọn dữ liệu cũ >31 ngày.

### Modified Capabilities
- (không có — đây là dự án mới, chưa có capability nào tồn tại)

## Impact

- **Repo mới**: `~/meal-tracker` → GitHub `dinhtrung/meal-tracker` → Vercel (static, framework = Other). Chưa có code cũ nên không có thay đổi phá vỡ (breaking) nào.
- **File mới**: `index.html`, `styles.css`, `app.js`, `manifest.json`, `service-worker.js`, `data/foods.json` (thư viện món), `icon-192.png`/`icon-512.png`, `CHANGELOG.md`, `README.md`.
- **Tái sử dụng pattern đã kiểm chứng từ `~/smoking-tracker`**: khung PWA + SW bump, chart SVG pixel-perfect, long-press delete, time-picker 5 phút, export/import JSON qua Telegram, verify layout 328px bằng puppeteer probe, luật tối đa 4 tab, nút icon-only.
- **Ràng buộc riêng tư**: `defaultData()` trả cấu trúc rỗng — KHÔNG nhúng dữ liệu thật (cân nặng, món ăn) vào source vì repo/Vercel là public.
- **Không phụ thuộc dịch vụ trả phí/API ngoài**; không backend, không tài khoản, không đồng bộ tự động (chủ đích — dữ liệu không rời khỏi máy trừ file do người dùng tự xuất).
