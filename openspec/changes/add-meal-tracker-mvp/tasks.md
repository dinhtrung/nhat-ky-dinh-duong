# Tasks — add-meal-tracker-mvp

Quy ước: mỗi task đủ nhỏ cho một phiên làm việc; task deploy/verify nằm trong cùng change.

## 1. Khung dự án & PWA shell

- [ ] 1.1 Tạo `~/meal-tracker/`: `index.html`, `styles.css`, `app.js`, `manifest.json`, `service-worker.js`, `data/`, `icon-192.png`, `icon-512.png`, `README.md`, `CHANGELOG.md`, `.gitignore` (chặn `_seed.js`, `*-bua-an-*.json`, `*.csv`)
- [ ] 1.2 Dựng layout cơ bản: container tối đa 480px, theme tối (biến CSS ở `:root`), thanh tab dưới đáy **2 tab hoạt động** (Hôm nay · Cài đặt) + chừa chỗ cho Thống kê/Kế hoạch ở change sau
- [ ] 1.3 Viết `manifest.json` (`display: standalone`, tên tiếng Việt, theme tối, icon 192/512) và sinh icon PNG bằng puppeteer (script `gen_icons.js`) — tránh lỗi icon lệch trên Android
- [ ] 1.4 Viết `service-worker.js` cache-first với `const CACHE = 'meal-tracker-v1'`, cache `index.html`, `styles.css`, `app.js`, `manifest.json`, `data/foods.json`; thêm `skipWaiting` + `clients.claim`
- [ ] 1.5 Đăng ký SW trong `app.js` + `controllerchange` → reload đúng 1 lần (guard `swReloaded`); hiển thị chip phiên bản cạnh tiêu đề
- [ ] 1.6 Trạng thái rỗng toàn cục: `defaultData()` trả rỗng; tab Hôm nay hiển thị hướng dẫn khi chưa có dữ liệu (không `NaN`)

## 2. Thư viện món (data + tìm kiếm)

- [ ] 2.1 Định nghĩa schema món `{id, name, group, unit, refGrams, kcal, protein, carb, fat, aliases?}` và viết `data/foods.json` với **≥150 món/thức uống Việt** (món chính, canh-rau, đồ uống, ăn vặt, trái cây), giá trị theo **1 khẩu phần thực tế** (1 bát cơm ~200g, 1 tô phở ~500ml, 1 ổ bánh mì ~100g…)
- [ ] 2.2 Loader nạp `data/foods.json` (cache vào biến, fallback đọc localStorage nếu offline lần đầu); chuẩn hoá tìm kiếm **bỏ dấu** (NFD + xoá combining marks) và tìm theo `name` + `aliases`
- [ ] 2.3 UI thư viện: danh sách theo nhóm + ô tìm kiếm trả kết quả khi gõ; nhóm "Yêu thích" và "Gần đây" ở đầu
- [ ] 2.4 Form thêm/sửa/xoá **món tự khai báo** (tên, đơn vị, ghi chú khối lượng, kcal, đạm, carb, béo) lưu vào `meal_foods`; validate: kcal ≥ 0, tên không rỗng, số không âm
- [ ] 2.5 Đánh dấu/bỏ yêu thích món (món dựng sẵn vẫn không sửa được nội dung dinh dưỡng)

## 3. Mục tiêu dinh dưỡng (Cài đặt)

- [ ] 3.1 Form hồ sơ: giới tính, tuổi (10–100), cao (cm), nặng (kg), mức vận động (1 trong 4) lưu vào `meal_config`
- [ ] 3.2 Hàm `calcBMR` (Mifflin-St Jeor), `calcTDEE` (× 1.2/1.375/1.55/1.725), `applyGoal` (−15%/0/+10%), làm tròn 10 kcal
- [ ] 3.3 Chọn preset macro (30/35/35 · 25/45/30 · 30/45/25) hoặc nhập tay; chặn lưu khi tổng ≠ 100% (±1); quy đổi gram 4/4/9 kcal
- [ ] 3.4 Hiển thị mục tiêu kcal + 3 mục tiêu macro (gram) trong Cài đặt, kèm dòng giải thích công thức đang dùng
- [ ] 3.5 Tab Hôm nay đọc mục tiêu từ `meal_config`; khi chưa có hồ sơ → hiển thị lời mời thiết lập thay vì so sánh mặc định

## 4. Tab Hôm nay — ghi bữa ăn

- [ ] 4.1 Data layer: `loadData/saveData` cho `meal_log`, `getDayEntries(dateKey)` sắp xếp theo thời gian, helper `mealKey` cho 5 nhóm (Sáng · Trưa · Chiều · Tối · Ăn vặt)
- [ ] 4.2 Entry model + `addEntry(entry)`: chụp snapshot dinh dưỡng (`kcal/protein/carb/fat` = giá trị món × qty), thời gian mặc định = hiện tại **làm tròn 5 phút** (giống quick-add app thuốc lá)
- [ ] 4.3 UI 5 thẻ bữa: mỗi thẻ hiển thị danh sách mục (tên món, số khẩu phần, kcal) + tổng kcal của bữa + nút ＋ thêm món
- [ ] 4.4 Luồng thêm món: mở thư viện → chọn món → chọn khẩu phần (0.5 · 1 · 1.5 · 2 · nhập tay) → xác nhận; đóng modal không ghi gì
- [ ] 4.5 Thanh tiến độ ngày: tổng kcal, còn lại/vượt (đổi màu cảnh báo khi vượt), 3 thanh macro theo % mục tiêu; cập nhật ngay sau mọi thao tác
- [ ] 4.6 Sửa mục: đổi khẩu phần và thời gian (time-picker bước **5 phút**, chặn thời gian tương lai); xoá mục bằng **nhấn giữ 500ms + xác nhận** (kèm `oncontextmenu` cho desktop)
- [ ] 4.7 Thêm hồi tố cho ngày khác/giờ khác trong ngày (tái dùng time-picker, không dùng `Date.now()` cho ngày quá khứ)
- [ ] 4.8 Sau mọi thao tác gọi một hàm `refreshAll()` (thẻ bữa + thanh tiến độ + chip phiên bản) để tránh view cũ

## 5. Dữ liệu của người dùng

- [ ] 5.1 Xuất JSON toàn bộ (`meal_log` + `meal_config` + `meal_foods`) qua Blob + `a.download`, tên file `nhat-ky-bua-an-YYYY-MM-DD.json`
- [ ] 5.2 Nhập JSON: `<input type=file>` + FileReader → `JSON.parse` → **validate cấu trúc** → màn xác nhận thay thế → ghi localStorage → refresh; lỗi thì giữ nguyên dữ liệu cũ và báo rõ
- [ ] 5.3 Xuất CSV (cột: ngày, nhóm bữa, tên món, khẩu phần, kcal, đạm, carb, béo) sắp xếp theo ngày
- [ ] 5.4 `cleanupOldData()`: xoá mục trong `meal_log` cũ hơn 31 ngày khi khởi động, **chỉ** `saveData` khi thực sự có xoá; không đụng `meal_config`/`meal_foods`

## 6. Verify & deploy

- [ ] 6.1 Seed dữ liệu test bằng `_seed.js` tạm (3–5 ngày, đủ 5 nhóm bữa, có mục 0.5 khẩu phần) → đo layout ở 328px bằng puppeteer probe: không tràn, nút cùng hàng, không tràn chữ
- [ ] 6.2 `node --check app.js` + kiểm tra thủ công luồng thêm/sửa/xoá/import/export trên `file://` (localStorage hoạt động trên file://)
- [ ] 6.3 **Xoá `_seed.js` + thẻ `<script>` seed khỏi `index.html`**, verify `grep -c "_seed" index.html` = 0
- [ ] 6.4 Bump `CACHE = 'meal-tracker-v2'`, cập nhật `CHANGELOG.md` (mục `## v1.0.0 — 2026-09-09` + các nhóm ✨ Mới / 🎨 UI) và README (mô tả + cách cài)
- [ ] 6.5 Tạo GitHub repo `dinhtrung/meal-tracker`, commit **targeted add** (không `git add -A`), push `main`
- [ ] 6.6 Import repo vào Vercel (framework = Other), deploy, rồi **verify asset live**: `curl -s https://<url>/app.js | grep -c <marker>` = 1 và `curl -s https://<url>/data/foods.json | grep -c '"kcal"'` > 100
- [ ] 6.7 Verify riêng tư: `curl -s https://<url>/app.js | grep -c "<dữ liệu cá nhân>"` = 0
- [ ] 6.8 Cài lên điện thoại người dùng, thêm thử 1 bữa thật, xuất JSON + nhập lại để xác nhận vòng dữ liệu
