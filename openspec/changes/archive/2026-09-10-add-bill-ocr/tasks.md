# Tasks — add-bill-ocr

Quy ước: mỗi task đủ nhỏ cho một phiên làm việc; task verify nằm trong cùng change.

## 1. Tài nguyên OCR & khung

- [x] 1.1 Tải `vendor/tesseract/tesseract.min.js` (63KB) + `vendor/tesseract/worker.min.js` (111KB) — tesseract.js **v6.0.1** (pin) — và ghi nguồn + giấy phép Apache-2.0 + SHA-256 vào README
- [x] 1.2 Khai báo hằng số OCR ở đầu `app.js` (cạnh `DB_KEY`): đường dẫn vendor/core/lang, ngôn ngữ `vie`, giới hạn cạnh dài 1600px, ngưỡng khớp, số dòng tối đa — tránh TDZ
- [x] 1.3 `service-worker.js`: thêm bucket `nhat-ky-dinh-duong-ocr-v1` + nhánh runtime-cache cho `cdn.jsdelivr.net` và `tessdata.projectnaptha.com`; bump `CACHE` lên `nhat-ky-dinh-duong-v3`; thêm 2 tệp vendor vào pre-cache
- [x] 1.4 `index.html`: thêm `<input type="file" id="billFile" accept="image/*" capture="environment" hidden>` + gắn listener trong `init()`

## 2. Chụp & tiền xử lý ảnh

- [x] 2.1 Nút "Chụp hoá đơn để điền nhanh" trong sheet chọn món + icon camera trong sheet khẩu phần; mở camera sau, vẫn chọn được ảnh có sẵn
- [x] 2.2 `preprocessBillImage(file)`: `createImageBitmap(file, {imageOrientation:'from-image'})` → canvas cạnh dài ≤1600px → ảnh xám (luma) + giãn tương phản percentile 2–98 → trả canvas
- [x] 2.3 Xử lý lỗi: tệp không phải ảnh → toast; ảnh hỏng/không decode được → thông báo riêng; không treo app

## 3. Nhận diện (worker)

- [x] 3.1 `loadOcrEngine()`: lazy `Tesseract.createWorker('vie', 1, {workerPath, corePath, langPath, logger})`, cache promise để không tạo lại worker
- [x] 3.2 Trạng thái "Đang đọc hoá đơn… X%" + thanh tiến trình trong sheet; UI không bị chặn (worker riêng)
- [x] 3.3 Không tải được tài nguyên OCR (lần đầu offline / CDN lỗi) → thông báo "cần mạng cho lần đầu" + nút "Chụp lại"; các chức năng khác vẫn chạy
- [x] 3.4 `recognizeBill` qua `worker.recognize(canvas)` → `{text, confidence, ms}`; giữ ấm 1 worker cho cả phiên

## 4. Phân tích dòng & khớp món

- [x] 4.1 `looksLikeSkip()` + `buildBillRows()`: bỏ dòng tiêu đề/địa chỉ/SĐT/ngày/số hoá đơn/tổng/VAT/thanh toán/cảm ơn bằng **so khớp mờ theo từ** (ngưỡng 0.7) nên bắt được cả `Tôủg cộng`, `THANH. TOÁN`
- [x] 4.2 `inferQty()`: đối chiếu chéo `thành tiền ÷ đơn giá` (0.5–20, cách bội 0.5 ≤0.15) với cột SL (`|đơn giá × SL − thành tiền| ≤15%`) → chọn giá trị tròn hơn → không có thì mặc định 1
- [x] 4.3 `matchFood()`: `norm()` + so khớp từ chịu lỗi Levenshtein (≥0.8/từ, phủ ≥0.6) + guard "tên thư viện 1 từ vs dòng ≥2 từ" (chặn `Bò né` → `Bơ`); trả top 3 ứng viên
- [x] 4.4 Probe: 11 case cho parser/matcher/qty — `Rau muôúg xào tỏi`, `Cơm chiên hải sản`, `Canh chua cá tóc`, `Bia Lon 4.5 25.090 100.000`, `1090.000`, `Bò né`, dòng `Tôủg cộng`/`VAT (8s)` (PASS hết)

## 5. Màn xem lại & ghi bữa

- [x] 5.1 Sheet xem lại: checkbox, chữ OCR (nhỏ/mờ), món khớp (đậm) + 2 ứng viên khác, số khẩu phần ±, kcal dòng, tổng kcal dự kiến
- [x] 5.2 "Chạm để chọn/đổi món" (picker ở chế độ thay dòng) + "＋ Thêm món tự khai báo" (tên điền sẵn từ OCR) cho dòng chưa khớp
- [x] 5.3 Chọn nhóm bữa (mặc định suy từ giờ hiện tại) + giờ (`floorTo5`, chặn tương lai) cho cả loạt; bỏ chọn từng dòng
- [x] 5.4 Xác nhận → ghi hàng loạt bằng `addEntry` vào ngày đang xem → `render()` + toast tổng; đóng sheet → không ghi gì; chặn xác nhận khi 0 dòng được gán món; dòng chưa gán bị bỏ qua và báo rõ
- [x] 5.5 Trạng thái rỗng/rác an toàn: không có dòng món → thông báo + gợi ý ghi tay (không ghi gì)

## 6. Verify & deploy

- [x] 6.1 Probe puppeteer (`/tmp/probe_bill.js`): sinh bill giả (bản sạch + bản mô phỏng ảnh chụp) → chạy luồng thật chụp→OCR→xem lại→xác nhận; assert 6 dòng món, SL suy từ tỉ lệ tiền, kcal ghi vào log, đóng sheet không ghi gì, sửa khẩu phần cập nhật tổng — **27/27 PASS**
- [x] 6.2 Probe: theo dõi yêu cầu mạng → chỉ có tài nguyên nhận diện (`tesseract-core-simd-lstm.wasm.js`, `vie.traineddata.gz`), không POST/PUT, không request nào mang ảnh/chữ; ca không tải được tài nguyên hiện đúng thông báo "cần mạng cho lần đầu"
- [x] 6.3 `node --check app.js` + bump chip phiên bản `v1.1.0` + `CHANGELOG.md` (mục v1.1.0) + `README.md` (mục Chụp bill, giấy phép, giới hạn, cách vendor toàn bộ); probe bộ cũ **43/43 PASS**
- [x] 6.4 Commit **targeted add**, push `main`; verify asset live sau Vercel deploy: `app.js` 200 (101KB, marker `v1.2.0` + `buildBillRows` + `matchFood`), `vendor/tesseract/worker.min.js` 200 (111.162B), `foods.json` 203 món — và chạy **luồng thật trên URL Vercel** (chụp bill → 6 dòng, bia 4 khẩu phần → ghi 5 món vào bữa tối) + **offline re-run pass**
