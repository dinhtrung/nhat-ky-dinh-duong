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
| 📷 Chụp bill | Chụp ảnh hoá đơn nhà hàng → nhận diện tiếng Việt **ngay trên máy** → điền sẵn danh sách món + số lượng → xem lại rồi xác nhận ghi cả loạt |
| ⚡ Quick pick | 8 chip "món hay ăn" tính theo tần suất chọn 30 ngày gần nhất + món yêu thích, 1 chạm là ghi xong; đổi nhóm bữa ngay nếu bấm nhầm |
| 📚 Thư viện | Hơn 175 món/thức uống Việt kèm kcal + macro theo khẩu phần, tìm không dấu; tự thêm/sửa/xoá món riêng, đánh dấu yêu thích |
| 🎯 Mục tiêu | Hồ sơ cơ thể (giới tính, tuổi, cao, nặng, mức vận động) → Mifflin-St Jeor × hệ số vận động, điều chỉnh −15%/0/+10%; preset macro 30/35/35 · 25/45/30 · 30/45/25 hoặc tự nhập |
| 📖 Giải thích macro | Chạm **Đạm / Carb / Béo** → tác dụng, ăn gì thì tăng (kèm 6 món đậm đặc nhất trong thư viện), và có nên hạn chế hay không |
| 💾 Dữ liệu | Xuất/nhập JSON để sao lưu, xuất CSV để phân tích, tự dọn dữ liệu cũ >31 ngày |

## Hàng ngày nên ăn gì? (giải thích 3 macro)

Chạm vào **Đạm · Carb · Béo** ở tab Hôm nay hoặc ô mục tiêu macro trong Cài đặt để xem:

| | Năng lượng | Tác dụng chính | Nên hạn chế? |
|---|---|---|---|
| **Đạm** | 4 kcal/g | Xây/sửa cơ, giữ cơ khi giảm cân, no lâu | **Không** — nên 1,2–1,6 g/kg cân nặng nếu tập đều |
| **Carb** | 4 kcal/g | Năng lượng chính cho não và cơ (nhất là khi chạy/đạp) | **Kiểm soát, đừng cắt hẳn** — chọn carb chậm, cắt nước ngọt/bia trước |
| **Béo** | 9 kcal/g | Hấp thu vitamin A/D/E/K, hormone, omega-3 cho tim | **Để ý** — 1 g = 9 kcal, giảm bằng cách bớt chiên rán (không cắt về 0) |

Mỗi bảng còn liệt kê **6 món đậm đặc nhất theo macro đó trong chính thư viện của app** (xếp theo g/100 kcal) để biết ngay nên ăn gì.

## 📷 Chụp hoá đơn (OCR)

Đi ăn nhà hàng: vào luồng thêm món → **Chụp hoá đơn để điền nhanh** (hoặc chọn ảnh đã chụp sẵn) → app đọc bill, tách ra từng dòng món, đoán số lượng, khớp với thư viện 203 món → **màn xem lại** để sửa/đổi món/bỏ dòng → bấm *Ghi N món* là xong cả bữa.

**Nguyên tắc:** OCR chỉ tạo **bản nháp**, không bao giờ tự ghi. Số liệu đo thật cho thấy phải như vậy: bill in nhiệt đọc được **6/6 tên món** nhưng sai dấu khoảng 1/3 trường hợp (`Rau muống` → `Rau muôúg`, `cá lóc` → `cá tóc`), và cột số tiền đọc sai nhiều (`95.000` → `95.0900`).

**Cách app bù sai số:**
- **Khớp món chịu lỗi**: bỏ dấu + chịu lỗi 1–2 ký tự mỗi từ → `Rau muôúg xào tỏi` vẫn về đúng *Rau muống xào tỏi*; dòng không khớp (vd *Bò né* — có thật ngoài quán nhưng chưa có trong thư viện) được đánh dấu để thêm món tự khai báo ngay tại dòng.
- **Số khẩu phần suy từ tiền**: ưu tiên `thành tiền ÷ đơn giá` có đối chiếu chéo với cột SL (vì cột SL hay bị đọc thành `4.5` hay `11.`), không suy được thì mặc định 1.
- **Lọc dòng rác**: bỏ tên quán, địa chỉ, SĐT, ngày giờ, `Tổng cộng`, `VAT`, `Thanh toán`, lời cảm ơn — kể cả khi OCR làm hỏng dấu (`Tôủg cộng`, `THANH. TOÁN`).

**Tài nguyên & offline:** lần **đầu tiên** dùng tính năng cần mạng để tải bộ nhận diện (≈7MB: lõi wasm 3,5MB + dữ liệu tiếng Việt 3,85MB), sau đó **lưu trên máy và chạy offline**. Người không dùng tính năng này không phải tải gì thêm. Ảnh resize về cạnh dài 1600px, chuyển ảnh xám + giãn tương phản trước khi đọc (đo được: confidence 85→89% và sửa được dấu sai như `cá tóc` → `cá lóc`).

**Riêng tư:** ảnh hoá đơn và chữ đọc được **không rời khỏi thiết bị**. Yêu cầu mạng duy nhất là tài nguyên nhận diện — app không có backend, không upload ảnh.

**Giới hạn chấp nhận:** bill **viết tay** hoặc bill chỉ ghi **tổng tiền** thì OCR không đọc được dòng món (app báo rõ và vẫn cho ghi tay). Ảnh mờ/nghiêng nhiều thì nên chụp lại. Số tiền trên bill chỉ dùng để suy số lượng — app **không** ghi số tiền vào sổ chi tiêu.

**Muốn offline 100% ngay từ cài đặt đầu?** Tải `tesseract-core-simd-lstm.wasm.js` + `vie.traineddata.gz` vào `vendor/tesseract/` rồi trỏ `corePath`/`langPath` trong `app.js` (hằng số `OCR`) về đường dẫn nội bộ.

### Bên thứ ba & giấy phép

| Thành phần | Nguồn | Giấy phép | Ghi chú |
|---|---|---|---|
| `tesseract.js` (bộ máy OCR) | [naptha/tesseract.js](https://github.com/naptha/tesseract.js) v6.0.1 | Apache-2.0 | vendored trong `vendor/tesseract/` (worker/wrapper ~174KB) vì worker **phải cùng origin** |
| `tesseract.js-core` (lõi wasm) | jsDelivr | Apache-2.0 | tải lần đầu, cache trong `nhat-ky-dinh-duong-ocr-v1` |
| `vie.traineddata` | tessdata.projectnaptha.com | Apache-2.0 | dữ liệu tiếng Việt, tải lần đầu |

SHA-256 của hai tệp vendored (để kiểm tra khi cập nhật phiên bản):

```
10fff78484067759c43028a02a72d76d0b90eb17302bb23b58a9ec5410bc928b  vendor/tesseract/tesseract.min.js
38645599043239c0eb6db08a6504a92dcdc292200535f3e9339cd77c4443b842  vendor/tesseract/worker.min.js
```

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
service-worker.js   cache-first + skipWaiting/clients.claim + bucket cache tài nguyên OCR
data/foods.json     thư viện món dựng sẵn
vendor/tesseract/   tesseract.js v6.0.1 (wrapper + worker, Apache-2.0) — worker phải cùng origin
gen_icons.js        sinh icon PNG bằng puppeteer
```

## Ghi chú về số liệu

Giá trị dinh dưỡng của thư viện là **tham khảo** (sai số ±15–25% tuỳ cách nấu và khẩu phần thật). Mục tiêu của app là **nhất quán trong ghi chép** để thấy xu hướng, không phải đo tuyệt đối. Bát/tô nhà bạn to hơn thì sửa khẩu phần của từng mục.
