# Changelog — Nhật Ký Dinh Dưỡng

## v1.2.1 — 2026-09-16

### 🍜 Thư viện món (203 → 205)

- Thêm **Mì vằn thắn** (1 tô 450 g · 480 kcal · Đ24 C60 B16) — gõ *mi van than*, *mì hoành thánh*, *wonton* đều ra.
- Thêm **Miến lươn** (1 tô 450 g · 460 kcal · Đ26 C59,5 B13) — gõ *mien luon*, *miến lươn nước*, *miến lươn Nghệ An*, *miến lươn trộn* đều ra.
- Đối chiếu bảng thành phần dinh dưỡng món ăn (**TT 30/2026/TT-BYT**) rồi quy về khẩu phần "1 tô" theo đúng quy ước thư viện (~90–110 kcal/100 g cả bát gồm nước dùng) để nhất quán với phở/hủ tiếu/miến gà.
- Bump cache service worker **v4 → v5** để PWA đã cài trên máy nhận thư viện mới.

## v1.2.0 — 2026-09-10

### ✨ Mới

- **Chạm vào Đạm / Carb / Béo để xem giải thích** — mỗi macro có một bảng gồm: năng lượng (4 · 4 · 9 kcal mỗi gram) và mục tiêu của bạn, **tác dụng**, **ăn gì thì tăng** (nhóm thực phẩm + 6 món đậm đặc nhất lấy từ chính thư viện của app, xếp theo g/100 kcal), và **có nên hạn chế không**:
  - **Đạm** → *không nên hạn chế* (1,2–1,6 g/kg nếu tập đều) — phần lớn người Việt ăn thiếu.
  - **Carb** → *kiểm soát, không cắt hẳn* — ưu tiên carb chậm, cắt nước ngọt/bia trước khi cắt cơm.
  - **Béo** → *nên để ý nhưng đừng cắt về 0* — 1 g = 9 kcal, giảm dễ nhất bằng cách bớt đồ chiên rán.
- Vào bảng giải thích từ **tab Hôm nay** (nhãn macro có gạch chân chấm) hoặc **tab Cài đặt** (3 ô mục tiêu macro).

## v1.1.0 — 2026-09-10

### ✨ Mới

- **📷 Chụp hoá đơn để điền nhanh** (change `add-bill-ocr`): chụp ảnh bill nhà hàng (hoặc chọn ảnh có sẵn) → nhận diện chữ tiếng Việt **ngay trên thiết bị** → tách dòng món → khớp thư viện → **màn xem lại** (sửa khẩu phần, đổi món, bỏ dòng, chọn nhóm bữa + giờ cho cả loạt) → xác nhận ghi một lần nhiều món. **Không tự động ghi** — OCR chỉ tạo bản nháp.
- **Khớp món chịu lỗi dấu/chính tả**: bỏ dấu + chịu lỗi 1–2 ký tự mỗi từ (`Rau muôúg xào tỏi` → *Rau muống xào tỏi*), kèm guard không gán món 1 từ cho dòng nhiều từ (`Bò né` ≠ `Bơ`); món chưa có trong thư viện được đánh dấu để thêm mới tại chỗ.
- **Số khẩu phần suy từ tiền**: ưu tiên `thành tiền ÷ đơn giá` có đối chiếu chéo với cột SL (cột SL hay bị đọc thành `4.5`/`11.`), không suy được thì mặc định 1.
- **Lọc dòng rác của bill** kể cả khi OCR hỏng dấu: `Tôủg cộng`, `THANH. TOÁN`, `VAT`, tiêu đề, địa chỉ, SĐT, ngày giờ, lời cảm ơn.
- **Tiền xử lý ảnh**: resize cạnh dài ≤1600px + ảnh xám + giãn tương phản percentile 2–98 → đo được confidence 85→89% và **sửa được dấu sai** (`cá tóc` → `cá lóc`).
- **Tài nguyên OCR theo nhu cầu**: tải ~7MB ở lần dùng đầu rồi lưu trên máy (cache riêng `nhat-ky-dinh-duong-ocr-v1`) → các lần sau chạy offline; người không dùng tính năng không tải gì thêm.

### 🔒 Riêng tư

- Ảnh hoá đơn và chữ nhận diện **không rời khỏi thiết bị** — chỉ có request tài nguyên nhận diện, không có request nào mang ảnh/dữ liệu (đã kiểm bằng probe theo dõi network).

### 🎨 UI

- Dòng nháp trong màn xem lại: checkbox chọn/bỏ, chữ OCR (mờ) bên dưới tên món khớp, chip gợi ý món khác, nút ± khẩu phần, tổng kcal dự kiến; footer gọn 2 nút *Huỷ* / *Ghi N món*.

## v1.0.0 — 2026-09-10

Bản MVP đầu tiên (change `add-meal-tracker-mvp`): PWA tĩnh ghi bữa ăn + mục tiêu dinh dưỡng.

### ✨ Mới

- **Ghi bữa ăn theo ngày** — 5 nhóm bữa (Sáng · Trưa · Chiều · Tối · Ăn vặt); mục bữa ăn lưu kèm **snapshot dinh dưỡng** nên sửa/xoá món trong thư viện về sau không làm lệch dữ liệu đã ghi.
- **Khẩu phần linh hoạt** — 0.5 · 1 · 1.5 · 2 hoặc nhập tay; dinh dưỡng tính lại theo hệ số.
- **Thư viện hơn 175 món/thức uống Việt** với kcal + đạm/carb/béo theo **1 khẩu phần thực tế** (1 bát cơm, 1 tô phở, 1 ổ bánh mì…), không phải quy đổi từ 100g.
- **Tìm kiếm không dấu** (`com tam` → *Cơm tấm*), lọc theo nhóm món, ghim **Yêu thích**.
- **Món tự khai báo** — thêm/sửa/xoá món riêng với đơn vị khẩu phần của bạn.
- **Quick pick 1 chạm** — 8 chip món hay ăn tính theo **tần suất chọn trong 30 ngày** (yêu thích trước, rồi số lần chọn giảm dần); suy ra nhóm bữa theo giờ hiện tại và cho **đổi nhóm bữa ngay** nếu bấm nhầm.
- **Mục tiêu dinh dưỡng** — Mifflin-St Jeor × hệ số vận động (1.2/1.375/1.55/1.725), điều chỉnh giảm −15% / giữ 0% / tăng +10%, làm tròn 10 kcal; preset macro 30/35/35 · 25/45/30 · 30/45/25 hoặc tự nhập (chặn nếu tổng ≠ 100% ±1).
- **Tiến độ trong ngày** — tổng kcal đã ăn, còn lại/vượt (đổi màu cảnh báo), 3 thanh macro theo % mục tiêu.
- **Thêm hồi tố** — chọn ngày khác và giờ theo bước **5 phút**, chặn thời gian tương lai.
- **Sửa/xoá mục** — chạm để sửa khẩu phần/giờ/nhóm bữa; **nhấn giữ 500ms** để xoá (kèm xác nhận; desktop dùng chuột phải).
- **Dữ liệu của bạn** — xuất JSON toàn bộ, nhập JSON có validate + màn xác nhận thay thế, xuất CSV (ngày, nhóm bữa, tên món, khẩu phần, kcal, đạm, carb, béo) sắp xếp theo ngày.
- **Tự dọn dữ liệu cũ hơn 31 ngày** khi khởi động (chỉ ghi localStorage khi thực sự có xoá; không đụng hồ sơ/món tự khai báo).
- **PWA** — manifest standalone, service worker cache-first với `skipWaiting` + `clients.claim`, tự tải lại đúng 1 lần khi có bản mới (guard `swReloaded`), chip phiên bản cạnh tiêu đề.

### 🎨 UI

- Theme tối, tiếng Việt toàn bộ, container tối đa 480px, thanh tab dưới đáy (2 tab hoạt động, chừa chỗ cho Thống kê · Kế hoạch).
- Nút thao tác phụ dùng **icon SVG** (`stroke="currentColor"`) kèm tooltip, không dùng chữ.
- Trạng thái rỗng an toàn: chưa có dữ liệu → hướng dẫn thêm món, chưa có hồ sơ → mời thiết lập mục tiêu (không bao giờ hiện `NaN`).
- Bottom sheet cho mọi luồng nhập liệu, toast phản hồi sau mỗi thao tác.
