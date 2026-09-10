# Tasks — add-bill-ocr

Quy ước: mỗi task đủ nhỏ cho một phiên làm việc; task verify nằm trong cùng change.

## 1. Tài nguyên OCR & khung

- [ ] 1.1 Tải `vendor/tesseract/tesseract.min.js` + `vendor/tesseract/worker.min.js` (tesseract.js v6, pin phiên bản chính xác) và ghi nguồn + giấy phép Apache-2.0 vào README
- [ ] 1.2 Khai báo hằng số OCR ở đầu `app.js` (cạnh `DB_KEY`): đường dẫn vendor/core/lang, ngôn ngữ `vie`, giới hạn cạnh dài 1600px, tên cache OCR, tên khoá tìm kiếm — tránh TDZ
- [ ] 1.3 `service-worker.js`: thêm bucket `nhat-ky-dinh-duong-ocr-v1` + nhánh runtime-cache cho `cdn.jsdelivr.net/npm/tesseract.js-core` và `tessdata.projectnaptha.com`; bump `CACHE` lên `nhat-ky-dinh-duong-v3`
- [ ] 1.4 `index.html`: thêm `<input type="file" accept="image/*" capture="environment" hidden>` cho ảnh bill

## 2. Chụp & tiền xử lý ảnh

- [ ] 2.1 Nút "Chụp bill" trong sheet chọn món + trong sheet khẩu phần; mở camera sau, có đường chọn ảnh từ thư viện
- [ ] 2.2 `preprocessBillImage(file)`: `createImageBitmap(file, {imageOrientation:'from-image'})` → canvas cạnh dài ≤1600px → ảnh xám (luma) + giãn tương phản percentile 2–98 → trả canvas/bitmap
- [ ] 2.3 Xử lý lỗi: tệp không phải ảnh, ảnh hỏng/quá lớn, canvas lỗi → toast rõ ràng, không treo app

## 3. Nhận diện (worker)

- [ ] 3.1 `loadOcrEngine()`: lazy `Tesseract.createWorker('vie', 1, {workerPath, corePath, langPath, logger})`, cache promise để không tạo lại worker
- [ ] 3.2 Trạng thái "Đang đọc bill…" + tiến trình (%) trong sheet; UI không bị chặn (worker)
- [ ] 3.3 Lỗi tài nguyên (offline lần đầu / CDN lỗi) → thông báo cần mạng cho lần đầu + nút "Thử lại"; các chức năng khác vẫn chạy
- [ ] 3.4 `recognizeBill(bitmap)` → `{ text, lines, confidence, ms }`; giải phóng worker khi không dùng (giữ ấm tối đa 1 phiên)

## 4. Phân tích dòng & khớp món

- [ ] 4.1 `parseBillLines(text)`: bỏ dòng tiêu đề/địa chỉ/SĐT/ngày/số hoá đơn/tổng/VAT/thanh toán/cảm ơn; nhận dòng món theo số tiền `\d{1,3}([.,]\d{3})+` hoặc chỉ số đầu dòng
- [ ] 4.2 `inferQty(line)`: ưu tiên `thành tiền ÷ đơn giá` (0.5–20, gần bội số 0.5) → số nguyên SL đọc được → mặc định 1
- [ ] 4.3 `matchFood(name)`: `norm()` + so khớp theo từ chịu lỗi Levenshtein (≥0.8/từ, phủ ≥0.6) + guard "1 từ vs nhiều từ"; trả top 3 ứng viên + cờ khớp được
- [ ] 4.4 Unit test trong probe cho các ca đã đo: `Rau muôúg xào tỏi`, `Cơm chiên hải sản`, `Bia Lon 4.5 25.090 100.000`, `Bò né` (không được gán thành `Bơ`), dòng `Tổng cộng`/`VAT` (phải bị loại)

## 5. Màn xem lại & ghi bữa

- [ ] 5.1 Sheet xem lại: mỗi dòng có checkbox, chữ OCR (nhỏ/mờ), món khớp (đậm) + 2 ứng viên khác, số khẩu phần (+/−, bước 0.5), kcal dòng; hiển thị tổng kcal dự kiến
- [ ] 5.2 "Đổi món" tái dùng picker (chế độ thay dòng) và "Thêm món tự khai báo" (tên điền sẵn từ OCR, người dùng nhập kcal) cho dòng chưa khớp
- [ ] 5.3 Chọn nhóm bữa (mặc định suy từ giờ hiện tại) + giờ (`floorTo5`, không cho tương lai) cho cả loạt; bỏ chọn từng dòng
- [ ] 5.4 Xác nhận → ghi hàng loạt bằng `addEntry` vào ngày đang xem → `render()` + toast tổng kcal; đóng sheet → không ghi gì; chặn xác nhận khi 0 dòng được chọn
- [ ] 5.5 Trạng thái rỗng/rác an toàn: không có dòng món → thông báo + gợi ý ghi tay; dòng chưa gán món không được ghi

## 6. Verify & deploy

- [ ] 6.1 Probe puppeteer: sinh bill giả (bản sạch + bản mô phỏng ảnh chụp) → chạy luồng thật chụp→OCR→xem lại→xác nhận; assert số dòng món, SL suy từ tỉ lệ tiền, kcal ghi vào log, đóng sheet không ghi gì
- [ ] 6.2 Probe: theo dõi yêu cầu mạng trong luồng OCR → chỉ có tài nguyên nhận diện, không có request chứa ảnh/chữ; và ca "offline lần đầu" hiện thông báo đúng
- [ ] 6.3 `node --check app.js`; bump chip phiên bản `v1.1.0`; cập nhật `CHANGELOG.md` (mục v1.1.0) + `README.md` (mục Chụp bill, tài nguyên OCR, giấy phép, giới hạn bill viết tay)
- [ ] 6.4 Commit **targeted add**, push `main`; verify asset live sau khi Vercel deploy (grep marker trong `app.js` + `vendor/tesseract/worker.min.js` trả 200)
