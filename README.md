# Nhật Ký Dinh Dưỡng

PWA ghi bữa ăn hằng ngày: chọn món từ thư viện món Việt (dinh dưỡng theo **1 khẩu phần thực tế** — 1 bát, 1 tô, 1 ổ), xem ngay còn lại bao nhiêu kcal và đạm/carb/béo so với mục tiêu trong ngày.

- **Không backend, không tài khoản, không quảng cáo.** Mọi tính toán chạy trên máy bạn, dữ liệu nằm trong localStorage của trình duyệt.
- **Chạy offline** sau lần mở đầu tiên (service worker cache-first).
- **Tối giản, tiếng Việt, theme tối**, thiết kế cho điện thoại; cài được vào màn hình chính như app thật.
- Tự dọn mục bữa ăn cũ hơn 31 ngày để dữ liệu không phình vô hạn; hồ sơ và món tự khai báo vẫn giữ.

## Tính năng

| Nhóm | Nội dung |
|---|---|
| 🍚 Ghi bữa | 5 nhóm bữa (Sáng · Trưa · Chiều · Tối · Ăn vặt), thêm món trong ≤3 thao tác, khẩu phần 0.5/1/1.5/2 hoặc nhập tay, sửa giờ theo bước 5 phút, xoá bằng nhấn giữ |
| ⚡ Quick pick | 8 chip "món hay ăn" tính theo tần suất chọn 30 ngày gần nhất + món yêu thích, 1 chạm là ghi xong; đổi nhóm bữa ngay nếu bấm nhầm |
| 📚 Thư viện | Hơn 175 món/thức uống Việt kèm kcal + macro theo khẩu phần, tìm không dấu; tự thêm/sửa/xoá món riêng, đánh dấu yêu thích |
| 🎯 Mục tiêu | Hồ sơ cơ thể (giới tính, tuổi, cao, nặng, mức vận động) → Mifflin-St Jeor × hệ số vận động, điều chỉnh −15%/0/+10%; preset macro 30/35/35 · 25/45/30 · 30/45/25 hoặc tự nhập |
| 💾 Dữ liệu | Xuất/nhập JSON để sao lưu, xuất CSV để phân tích, tự dọn dữ liệu cũ >31 ngày |

## Dùng trên điện thoại

1. Mở URL Vercel của app (hoặc `index.html` khi chạy local) bằng Chrome.
2. Menu ⋮ → **Thêm vào màn hình chính** → mở app ở chế độ standalone.
3. Vào tab **Cài đặt** nhập hồ sơ để có mục tiêu kcal, rồi bắt đầu ghi bữa.
4. Mỗi tuần vào **Cài đặt → Xuất JSON** và gửi file vào Telegram để sao lưu (dữ liệu nằm trên máy, xoá dữ liệu trình duyệt là mất).

## Chạy local

Static site, không cần build:

```bash
python3 -m http.server 8080     # rồi mở http://localhost:8080
```

Service worker chỉ đăng ký khi chạy qua http/https (không chạy trên `file://`), còn toàn bộ tính năng khác vẫn hoạt động trên `file://`.

## Deploy

Repo GitHub → Vercel, framework = **Other** (static). Push `main` là deploy.

> Nhớ bump `CACHE = 'nhat-ky-dinh-duong-vN'` trong `service-worker.js` trong **cùng commit** với thay đổi asset — nếu quên, điện thoại vẫn chạy bản cũ.

Tạo lại icon khi cần: `NODE_PATH=$(npm root -g) node gen_icons.js`

## Cấu trúc

```
index.html          khung app + thanh tab
styles.css          theme tối, container 480px
app.js              toàn bộ logic (hằng số ở đầu file)
manifest.json       khai báo PWA
service-worker.js   cache-first + skipWaiting/clients.claim
data/foods.json     thư viện món dựng sẵn
gen_icons.js        sinh icon PNG bằng puppeteer
```

## Ghi chú về số liệu

Giá trị dinh dưỡng của thư viện là **tham khảo** (sai số ±15–25% tuỳ cách nấu và khẩu phần thật). Mục tiêu của app là **nhất quán trong ghi chép** để thấy xu hướng, không phải đo tuyệt đối. Bát/tô nhà bạn to hơn thì sửa khẩu phần của từng mục.
