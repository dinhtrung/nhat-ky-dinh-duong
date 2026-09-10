## Why

Đi ăn nhà hàng, việc ghi lại từng món vào app rất mất công (mở thư viện, tìm món, chọn khẩu phần cho từng món) — trong khi trên bàn đã có sẵn hoá đơn liệt kê đủ món và số lượng. Đã đo thực tế: OCR tiếng Việt chạy hoàn toàn trong browser (tesseract.js + `vie`) nhận ra **6/6 tên món** trên bill in nhiệt, kể cả ảnh mô phỏng chụp bằng điện thoại (xoay 1.4°, mờ, nhiễu) — đủ tốt để **điền sẵn** danh sách món, chỉ cần người dùng xác nhận thay vì gõ tay.

## What Changes

- Thêm luồng **"📷 Chụp bill"** trong màn thêm món: chụp ảnh hoá đơn (hoặc chọn ảnh có sẵn) → nhận diện chữ **ngay trên thiết bị** → tách ra các dòng món → khớp với thư viện món → hiện **màn xem lại** để sửa/bỏ chọn → chỉ ghi vào nhật ký khi người dùng bấm xác nhận.
- **Không tự động ghi**: OCR chỉ tạo bản nháp. Lý do đã đo: tên món sai dấu ~1/3 trường hợp (`Rau muống` → `Rau muôúg`, `cá lóc` → `cá tóc`) và cột số tiền đọc sai nặng (`95.000` → `95.0900`).
- **Số khẩu phần suy từ tỉ lệ tiền**: khi cột SL hỏng, dùng `thành tiền ÷ đơn giá` (đo được: cột SL đọc thành `4.5` nhưng tỉ lệ cho ra đúng `4`); không suy được thì mặc định 1 và người dùng sửa được.
- **Khớp món chịu lỗi dấu/chính tả** (so khớp bỏ dấu + chịu lỗi 1–2 ký tự mỗi từ) để `Rau muôúg xào tỏi` vẫn về đúng nhóm rau muống; dòng không khớp (vd `Bò né`) được đánh dấu để thêm món tự khai báo tại chỗ.
- **Tài nguyên OCR tải theo nhu cầu**: lần đầu dùng tải bộ máy + dữ liệu tiếng Việt (~7,5MB) rồi **lưu lại thiết bị** để các lần sau chạy offline; app không phình thêm cho người không dùng tính năng.
- Không thay đổi mô hình dữ liệu: món từ bill vẫn ghi bằng entry hiện có (snapshot dinh dưỡng), nên mọi tính năng thống kê/xuất CSV/nhập JSON đang có vẫn dùng nguyên.

## Capabilities

### New Capabilities
- `bill-ocr`: chụp/chọn ảnh hoá đơn, nhận diện tiếng Việt trên thiết bị, tách dòng món + số lượng, khớp thư viện món chịu lỗi dấu, màn xem lại bắt buộc trước khi ghi, quản lý tài nguyên OCR theo nhu cầu và riêng tư ảnh.

### Modified Capabilities
- (không có — luồng ghi bữa ăn hiện tại không đổi yêu cầu; bill-ocr chỉ tạo thêm bản nháp rồi gọi lại đúng luồng ghi hiện có)

## Impact

- **Code**: `app.js` (hằng số OCR + tiền xử lý ảnh + loader tesseract + parser dòng + matcher + sheet xem lại), `styles.css` (kiểu dòng nháp), `service-worker.js` (bucket cache OCR + bump cache name), `index.html` (input file ẩn cho ảnh bill), `README.md`/`CHANGELOG.md`.
- **Tài nguyên mới (vendor, ~174KB)**: `vendor/tesseract/tesseract.min.js` (63KB) + `vendor/tesseract/worker.min.js` (111KB) — tesseract.js v6.0.1, Apache-2.0 — vendored vì worker **phải cùng origin**.
- **Tài nguyên tải theo nhu cầu (không commit)**: lõi wasm `tesseract-core-simd.wasm` (~3,5MB) + `vie.traineddata.gz` (3,85MB) từ CDN, lưu vào cache riêng trên thiết bị.
- **Phụ thuộc ngoài mới**: jsDelivr (tesseract.js-core) + tessdata.projectnaptha.com (dữ liệu tiếng Việt) ở **lần dùng đầu tiên**; sau đó chạy offline. Đường dẫn gom vào một hằng số để có thể vendor toàn bộ sau này.
- **Riêng tư**: ảnh hoá đơn và chữ nhận diện **không rời khỏi thiết bị** — chỉ có request tài nguyên OCR, không có request nào chứa ảnh/dữ liệu.
- **Ngoài phạm vi**: ghi tổng tiền hoá đơn sang Money Lover/nhà hàng (change khác); bill viết tay vẫn phải ghi tay; không đọc mã số thuế/mã đơn.
