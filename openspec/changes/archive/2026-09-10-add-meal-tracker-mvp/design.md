## Context

Xem `proposal.md` — Why. Ràng buộc kỹ thuật đang định hình thiết kế:

- Đây là **repo mới hoàn toàn** (chưa có code), nhưng người dùng đã có 2 PWA chạy ổn định (`~/smoking-tracker`, `~/flowfi`) với pattern đã được kiểm chứng: static site không build step, GitHub → Vercel, localStorage, export/import JSON qua Telegram.
- Người dùng mobile-first (dùng trên điện thoại hằng ngày), yêu cầu **pixel-perfect**, tối đa **4 tab**, nút icon-only, tiếng Việt, theme tối.
- Không có backend và không muốn thêm backend (dữ liệu sức khoẻ tư nhân) → mọi tính toán và lưu trữ phải chạy phía client, offline.
- Máy chủ dev có `openspec` CLI v1.8.0, puppeteer (global) để verify layout và sinh icon.

## Goals / Non-Goals

**Goals:**
- Một PWA tĩnh, chạy offline, ghi bữa ăn ≤ 3 thao tác/món và cho biết ngay còn lại bao nhiêu kcal + macro trong ngày.
- Thư viện món Việt có sẵn dữ liệu dinh dưỡng **theo khẩu phần thực tế** (không bắt người dùng cân gram).
- Mục tiêu kcal/macro tính từ hồ sơ cơ thể, có thể chỉnh tay.
- Dữ liệu thuộc quyền người dùng: xuất/nhập JSON, xuất CSV, tự dọn dữ liệu cũ.
- Deploy pipeline giống app thuốc lá: push `main` là deploy, verify được bản live.

**Non-Goals:**
- Thống kê/biểu đồ nâng cao, theo dõi cân nặng → change `add-meal-stats`.
- Kế hoạch tuần, auto-gợi ý bữa, danh sách đi chợ → change `add-meal-planning`.
- Quét barcode / nhận diện ảnh món ăn / gọi API dinh dưỡng ngoài.
- Đồng bộ nhiều thiết bị, tài khoản, backend.
- Log nước uống (đưa vào `add-meal-stats` cùng lúc làm chart).

## Decisions

**D1 — Static multi-file PWA, không build step.** `index.html` + `styles.css` + `app.js` + `manifest.json` + `service-worker.js` + `data/foods.json`. Lý do: app này chắc chắn vượt ~1.500 dòng (5 capability), single-file sẽ khó bảo trì; Vercel phục vụ static thuần nên `fetch('data/foods.json')` vẫn cache được offline qua SW. *Loại bỏ:* single-file (quá dài), React/Vite (thêm toolchain không cần thiết).

**D2 — Ba khoá localStorage tách biệt.** `meal_log` = `{ "YYYY-MM-DD": [entry, …] }`, `meal_config` = hồ sơ + mục tiêu + preset macro, `meal_foods` = món tự khai báo + danh sách yêu thích/gần đây. Lý do: dọn dữ liệu cũ chỉ cần xoá key ngày trong `meal_log`, không đụng hồ sơ/món tự khai báo (đúng yêu cầu spec). *Loại bỏ:* IndexedDB (phức tạp không cần cho ~vài nghìn bản ghi), gộp một khoá duy nhất (khó dọn theo ngày).

**D3 — Mục bữa ăn lưu kèm "snapshot" dinh dưỡng.** Mỗi entry: `{ id, meal, foodId?, name, unit, qty, kcal, protein, carb, fat, time }` — giá trị dinh dưỡng **chụp tại thời điểm ghi**, không tra lại thư viện khi hiển thị. Đây là hệ quả bắt buộc của scenario "dữ liệu cũ không đổi khi thư viện thay đổi" (spec `meal-log`) và cũng giúp app chạy đúng khi món bị xoá khỏi thư viện.

**D4 — Dữ liệu món là file JSON tĩnh, khẩu phần hoá.** Schema: `{ id, name, group, unit, refGrams, kcal, protein, carb, fat, aliases? }`, trong đó `unit` là đơn vị người Việt dùng ("1 bát", "1 tô", "1 ổ", "1 ly") và các giá trị dinh dưỡng ứng với **1 đơn vị đó**; `aliases` phục vụ tìm không dấu. Curate ~150–200 món phổ biến, ưu tiên món nhà hay ăn + món quán phổ thông. *Loại bỏ:* OpenFoodFacts/Edamam (cần mạng, dữ liệu món Việt kém, khoá API), bảng 100 g (người dùng phải quy đổi — đúng thứ proposal muốn tránh).

**D5 — Công thức dinh dưỡng chuẩn hoá một chỗ.** BMR Mifflin-St Jeor; hệ số vận động 1.2/1.375/1.55/1.725; điều chỉnh −15%/0/+10%; macro preset 30/35/35 · 25/45/30 · 30/45/25; quy đổi 4 kcal/g (đạm, carb), 9 kcal/g (béo); làm tròn 10 kcal và 1 g. Tất cả hằng số đặt ở đầu `app.js` cạnh `DB_KEY` (tránh TDZ — bài học từ app thuốc lá).

**D6 — Service worker cache-first + bump version mỗi deploy.** Giữ đúng pattern app thuốc lá (đã chạy ổn định): `const CACHE = 'nhat-ky-dinh-duong-vN'` bump trong **cùng commit** với thay đổi asset, kèm `skipWaiting` + `clients.claim` + auto-reload 1 lần qua `controllerchange`. *Loại bỏ:* network-first (FlowFi dùng để tránh quên bump) — nhưng với app ăn uống, ưu tiên mở nhanh offline (bữa sáng ở ngoài đường), nên chọn cache-first và siết kỷ luật bump bằng task checklist.

**D7 — Kiểm chứng bằng puppeteer probe + seed file tạm.** Layout đo ở 328px (màn 360px) như app thuốc lá; dữ liệu test nạp bằng file `_seed.js` tạm (thêm `<script>` rồi **xoá trước khi commit**, verify bằng grep `_seed`). Thời gian ghi record dùng chuỗi ISO **giờ local không có `Z`** để tránh lệch ngày do UTC.

**D8 — Không nhúng dữ liệu thật; repo/Vercel công khai.** `defaultData()` trả rỗng; `.gitignore` chặn file seed/export (`_seed.js`, `nhat-ky-dinh-duong-*.json`, `*.csv`). Sau deploy verify bằng `curl` + grep tên dữ liệu cá nhân = 0.

**D9 — Deploy: GitHub `dinhtrung/nhat-ky-dinh-duong` + Vercel `nhat-ky-dinh-duong.vercel.app`.** Push `main` = deploy; verify bằng grep marker trong `app.js` trên URL live (bài học: URL cũ có thể vẫn trả 200).

**D10 — Đặt tên thống nhất "Nhật Ký Dinh Dưỡng".** App name hiển thị "Nhật Ký Dinh Dưỡng"; repo `dinhtrung/nhat-ky-dinh-duong`; URL Vercel `nhat-ky-dinh-duong.vercel.app`; thư mục local `~/nhat-ky-dinh-duong`; tên file xuất `nhat-ky-dinh-duong-YYYY-MM-DD.json` / `nhat-ky-dinh-duong-YYYY-MM-DD.csv`; cache SW `nhat-ky-dinh-duong-vN`. Lý do: một tên duy nhất từ repo → URL → tên file giúp nhận diện và tránh nhầm với app thuốc lá khi mở nhiều PWA trên cùng điện thoại.

**D11 — Quick pick tính theo tần suất chọn trong lịch sử, không theo "món mới nhất".** Đếm số lần mỗi `foodId` xuất hiện trong `meal_log` của **30 ngày gần nhất**; sắp xếp: yêu thích trước → số lần chọn giảm dần → đồng hạng thì lần dùng gần nhất mới hơn đứng trước; hiển thị tối đa ~8 chip ở tab Hôm nay. Tính lại mỗi lần render (rẻ: chỉ quét log 30 ngày), **không** lưu bảng đếm riêng để tránh lệch dữ liệu khi sửa/xoá mục. *Loại bỏ:* chỉ dùng "gần đây" (tín hiệu yếu — món ăn 1 lần tuần trước sẽ đè món ăn hằng ngày), bảng đếm lưu sẵn (thêm trạng thái dễ sai).

## Risks / Trade-offs

- **Sai số kcal của thư viện món (±15–25% tuỳ cách nấu)** → Ghi rõ trong app "giá trị tham khảo"; cho phép sửa khẩu phần từng mục; mục tiêu là **nhất quán trong ghi chép**, không phải đo tuyệt đối.
- **Xoá dữ liệu trình duyệt = mất dữ liệu** → Nhắc xuất JSON trong Cài đặt; đề xuất nhịp xuất hằng tuần qua Telegram (đã có thói quen với MoneyLover/thuốc lá).
- **Quên bump SW = điện thoại không thấy bản mới** → Task bắt buộc trong checklist deploy + verify chip phiên bản trên app.
- **Áp lực thêm tab (stats/plan sắp tới)** → Luật ≤4 tab trong spec `app-shell`; nội dung mới phải nằm trong tab hiện có hoặc thay thế tab.
- **Tên món/khẩu phần người dùng dị (tô to, bát nhỏ)** → Cho phép hệ số khẩu phần 0.5 và hiển thị `refGrams` để người dùng tự hiệu chỉnh.
- **Nạp chồng file khi import JSON (mất dữ liệu hiện có)** → Bắt buộc màn xác nhận + mô tả rõ (thay thế hay bổ sung) trước khi ghi.

## Migration Plan

Repo mới nên không cần migrate dữ liệu. Triển khai: khởi tạo repo → code → verify local → tạo GitHub repo + push `main` → import Vercel (framework Other) → verify live → cài trên điện thoại → test 1 ngày thật trước khi tin tưởng. Rollback: `git revert` + push (Vercel deploy lại bản trước trong ~5s); dữ liệu người dùng không bị ảnh hưởng vì nằm ở localStorage.

## Open Questions

Không còn câu hỏi mở — 3 điểm đã chốt với người dùng (2026-09-09):

1. **Tên/URL**: app "Nhật Ký Dinh Dưỡng", repo `dinhtrung/nhat-ky-dinh-duong`, URL `nhat-ky-dinh-duong.vercel.app` (xem D10).
2. **Quick pick**: CÓ — tính theo tần suất chọn trong 30 ngày, quick pick 1 chạm ở tab Hôm nay (xem D11).
3. **Vùng miền**: KHÔNG chia Bắc/Trung/Nam — chỉ nhóm theo loại món; người dùng vẫn tự tạo món ăn riêng (yêu cầu bắt buộc trong spec `food-library`).

Còn lại chỉ là quyết định nhỏ khi code: số lượng chip quick pick (mặc định 8) và vị trí đặt chip trong tab Hôm nay — không ảnh hưởng spec.
