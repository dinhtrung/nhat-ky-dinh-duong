# Tasks — add-meal-tracker-mvp

Quy ước: mỗi task đủ nhỏ cho một phiên làm việc; task deploy/verify nằm trong cùng change.

## 1. Khung dự án & PWA shell

- [x] 1.1 Tạo `~/nhat-ky-dinh-duong/`: `index.html`, `styles.css`, `app.js`, `manifest.json`, `service-worker.js`, `data/`, `icon-192.png`, `icon-512.png`, `README.md`, `CHANGELOG.md`, `.gitignore` (chặn `_seed.js`, `nhat-ky-dinh-duong-*.json`, `*.csv`)
- [x] 1.2 Dựng layout cơ bản: container tối đa 480px, theme tối (biến CSS ở `:root`), thanh tab dưới đáy **2 tab hoạt động** (Hôm nay · Cài đặt) + chừa chỗ cho Thống kê/Kế hoạch ở change sau
- [x] 1.3 Viết `manifest.json` (`display: standalone`, tên tiếng Việt, theme tối, icon 192/512) và sinh icon PNG bằng puppeteer (script `gen_icons.js`) — tránh lỗi icon lệch trên Android
- [x] 1.4 Viết `service-worker.js` cache-first với `const CACHE = 'nhat-ky-dinh-duong-v2'`, cache `index.html`, `styles.css`, `app.js`, `manifest.json`, `data/foods.json`; thêm `skipWaiting` + `clients.claim`
- [x] 1.5 Đăng ký SW trong `app.js` + `controllerchange` → reload đúng 1 lần (guard `swReloaded`); hiển thị chip phiên bản cạnh tiêu đề
- [x] 1.6 Trạng thái rỗng toàn cục: `defaultData()` trả rỗng; tab Hôm nay hiển thị hướng dẫn khi chưa có dữ liệu (không `NaN`)

## 2. Thư viện món (data + tìm kiếm)

- [x] 2.1 Định nghĩa schema món `{id, name, group, unit, refGrams, kcal, protein, carb, fat, aliases?}` và viết `data/foods.json` với **≥150 món/thức uống Việt** (món chính, canh-rau, đồ uống, ăn vặt, trái cây), giá trị theo **1 khẩu phần thực tế** (1 bát cơm ~200g, 1 tô phở ~500ml, 1 ổ bánh mì ~100g…) → **197 món** (main 63 · side 34 · soup 24 · fruit 20 · drink 28 · snack 28)
- [x] 2.2 Loader nạp `data/foods.json` (cache vào biến, fallback đọc localStorage nếu offline lần đầu); chuẩn hoá tìm kiếm **bỏ dấu** (NFD + xoá combining marks) và tìm theo `name` + `aliases`
- [x] 2.3 UI thư viện: danh sách theo nhóm món (không chia vùng miền) + ô tìm kiếm trả kết quả khi gõ; ghim nhóm "Yêu thích" ở đầu
- [x] 2.4 Form thêm/sửa/xoá **món tự khai báo** (tên, đơn vị, ghi chú khối lượng, kcal, đạm, carb, béo) lưu vào `meal_foods`; validate: kcal ≥ 0, tên không rỗng, số không âm
- [x] 2.5 Đánh dấu/bỏ yêu thích món (món dựng sẵn vẫn không sửa được nội dung dinh dưỡng)
- [x] 2.6 Hàm `getQuickPicks(limit=8)`: đếm tần suất `foodId` trong `meal_log` 30 ngày gần nhất → sắp xếp yêu thích trước → số lần chọn giảm dần → đồng hạng thì lần dùng gần nhất mới hơn; tính lại mỗi lần render, KHÔNG lưu bảng đếm riêng

## 3. Mục tiêu dinh dưỡng (Cài đặt)

- [x] 3.1 Form hồ sơ: giới tính, tuổi (10–100), cao (cm), nặng (kg), mức vận động (1 trong 4) lưu vào `meal_config`
- [x] 3.2 Hàm `calcBMR` (Mifflin-St Jeor), `calcTDEE` (× 1.2/1.375/1.55/1.725), `applyGoal` (−15%/0/+10%), làm tròn 10 kcal
- [x] 3.3 Chọn preset macro (30/35/35 · 25/45/30 · 30/45/25) hoặc nhập tay; chặn lưu khi tổng ≠ 100% (±1); quy đổi gram 4/4/9 kcal
- [x] 3.4 Hiển thị mục tiêu kcal + 3 mục tiêu macro (gram) trong Cài đặt, kèm dòng giải thích công thức đang dùng
- [x] 3.5 Tab Hôm nay đọc mục tiêu từ `meal_config`; khi chưa có hồ sơ → hiển thị lời mời thiết lập thay vì so sánh mặc định

## 4. Tab Hôm nay — ghi bữa ăn

- [x] 4.1 Data layer: `loadData/saveData` cho `meal_log`, `getDayEntries(dateKey)` sắp xếp theo thời gian, helper `mealKey` cho 5 nhóm (Sáng · Trưa · Chiều · Tối · Ăn vặt)
- [x] 4.2 Entry model + `addEntry(entry)`: chụp snapshot dinh dưỡng (`kcal/protein/carb/fat` = giá trị món × qty), thời gian mặc định = hiện tại **làm tròn 5 phút** (giống quick-add app thuốc lá)
- [x] 4.3 UI 5 thẻ bữa: mỗi thẻ hiển thị danh sách mục (tên món, số khẩu phần, kcal) + tổng kcal của bữa + nút ＋ thêm món
- [x] 4.4 Luồng thêm món: mở thư viện → chọn món → chọn khẩu phần (0.5 · 1 · 1.5 · 2 · nhập tay) → xác nhận; đóng modal không ghi gì
- [x] 4.5 Thanh tiến độ ngày: tổng kcal, còn lại/vượt (đổi màu cảnh báo khi vượt), 3 thanh macro theo % mục tiêu; cập nhật ngay sau mọi thao tác
- [x] 4.6 Sửa mục: đổi khẩu phần và thời gian (time-picker bước **5 phút**, chặn thời gian tương lai); xoá mục bằng **nhấn giữ 500ms + xác nhận** (kèm `oncontextmenu` cho desktop)
- [x] 4.7 Thêm hồi tố cho ngày khác/giờ khác trong ngày (tái dùng time-picker, không dùng `Date.now()` cho ngày quá khứ)
- [x] 4.8 Sau mọi thao tác gọi **một hàm refresh duy nhất** (`render()` trong `app.js` — thẻ bữa + thanh tiến độ + chip phiên bản) để tránh view cũ
- [x] 4.9 Dải quick pick ở tab Hôm nay: hiển thị ~8 chip món hay ăn (từ `getQuickPicks`), 1 chạm là ghi ngay 1 khẩu phần vào nhóm bữa suy ra từ giờ hiện tại (trước 10h Sáng · 10–14h Trưa · 14–17h Chiều · 17–22h Tối · còn lại Ăn vặt), kèm nút đổi nhóm bữa của mục vừa thêm (không cần xoá/tạo lại)

## 5. Dữ liệu của người dùng

- [x] 5.1 Xuất JSON toàn bộ (`meal_log` + `meal_config` + `meal_foods`) qua Blob + `a.download`, tên file `nhat-ky-dinh-duong-YYYY-MM-DD.json`
- [x] 5.2 Nhập JSON: `<input type=file>` + FileReader → `JSON.parse` → **validate cấu trúc** → màn xác nhận thay thế → ghi localStorage → refresh; lỗi thì giữ nguyên dữ liệu cũ và báo rõ
- [x] 5.3 Xuất CSV (cột: ngày, nhóm bữa, tên món, khẩu phần, kcal, đạm, carb, béo) sắp xếp theo ngày
- [x] 5.4 `cleanupOldData()`: xoá mục trong `meal_log` cũ hơn 31 ngày khi khởi động, **chỉ** `saveData` khi thực sự có xoá; không đụng `meal_config`/`meal_foods`

## 6. Verify & deploy

- [x] 6.1 Seed dữ liệu test bằng `_seed.js` tạm (3–5 ngày, đủ 5 nhóm bữa, có mục 0.5 khẩu phần) → đo layout ở 328px bằng puppeteer probe: không tràn, nút cùng hàng, không tràn chữ
- [x] 6.2 `node --check app.js` + kiểm tra thủ công luồng thêm/sửa/xoá/import/export trên `file://` (localStorage hoạt động trên file://) → tự động hoá bằng puppeteer: 42/42 check PASS
- [x] 6.3 **Xoá `_seed.js` + thẻ `<script>` seed khỏi `index.html`**, verify `grep -c "_seed" index.html` = 0
- [x] 6.4 Bump `CACHE = 'nhat-ky-dinh-duong-v2'`, cập nhật `CHANGELOG.md` (mục `## v1.0.0 — 2026-09-10` + các nhóm ✨ Mới / 🎨 UI) và README (mô tả + cách cài)
- [ ] 6.5 Tạo GitHub repo `dinhtrung/nhat-ky-dinh-duong`, commit **targeted add** (không `git add -A`), push `main`
- [ ] 6.6 Import repo vào Vercel (framework = Other), deploy, rồi **verify asset live**: `curl -s https://nhat-ky-dinh-duong.vercel.app/app.js | grep -c <marker>` = 1 và `curl -s https://nhat-ky-dinh-duong.vercel.app/data/foods.json | grep -c '"kcal"'` ≥ 150
- [ ] 6.7 Verify riêng tư: `curl -s https://nhat-ky-dinh-duong.vercel.app/app.js | grep -c "<dữ liệu cá nhân>"` = 0
- [ ] 6.8 Cài lên điện thoại người dùng, thêm thử 1 bữa thật, xuất JSON + nhập lại để xác nhận vòng dữ liệu
