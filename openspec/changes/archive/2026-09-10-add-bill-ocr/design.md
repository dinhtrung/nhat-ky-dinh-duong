## Context

Xem `proposal.md` — Why. Ràng buộc kỹ thuật định hình thiết kế (đã đo thực tế bằng puppeteer + tesseract.js v6 + `vie` trên bill in nhiệt giả lập, cả bản "sạch" và bản mô phỏng ảnh chụp tay — xoay 1.4°, mờ, nhiễu):

- Tên món: **6/6 dòng món nhận ra**, nhưng chỉ **4/6 đúng dấu hoàn toàn** (`Rau muống` → `Rau muôúg`, `cá lóc` → `cá tóc`).
- Cột số: **sai nặng** (`95.000` → `95.0900`, `100.000` → `1090.000`), nhưng tỉ lệ `thành tiền ÷ đơn giá` vẫn cho đúng số lượng (cột SL đọc thành `4.5` → tỉ lệ cho 4).
- Thời gian: **1,7s (ảnh sạch) / 2,0s (ảnh kiểu chụp)** trên headless Chrome, confidence 85% → trên điện thoại ước 3–8s.
- Dung lượng: `tesseract.min.js` 63KB + `worker.min.js` 32KB (vendor được), lõi `tesseract-core-simd.wasm` 3,5MB + `vie.traineddata.gz` 3,85MB (tải theo nhu cầu).
- App hiện tại: static PWA không build step, 3 khoá localStorage, thư viện 203 món đã có `norm()` bỏ dấu, entry lưu **snapshot** dinh dưỡng, SW cache-first có bump phiên bản, và probe puppeteer 43 check làm lưới an toàn.
- Worker của tesseract **phải cùng origin** với trang → không thể chỉ dùng CDN cho `worker.min.js` (khác origin sẽ bị chặn).

## Goals / Non-Goals

**Goals:**
- Giảm thao tác ghi một bữa nhà hàng từ ~20 chạm xuống còn chụp 1 ảnh + xác nhận.
- Chấp nhận OCR **không hoàn hảo**: thiết kế sao cho lỗi dấu và lỗi số không dẫn tới dữ liệu sai (khớp chịu lỗi + màn xem lại bắt buộc).
- Không làm app phình cho người không dùng tính năng (tài nguyên tải theo nhu cầu, cache riêng).
- Giữ đúng mô hình riêng tư hiện có: ảnh và chữ không rời thiết bị.

**Non-Goals:**
- Không nhận diện bill viết tay, không đọc mã số thuế/mã đơn/QR.
- Không ghi số tiền hoá đơn vào sổ chi tiêu (Money Lover) — change khác.
- Không tự động ghi vào nhật ký mà không có xác nhận (lý do ở proposal).
- Không dùng API OCR đám mây (phá offline/riêng tư), không thêm backend.

## Decisions

**D1 — tesseract.js v6.0.1 (pin) + `vie`, vendored phần nhỏ, CDN phần nặng.** Vendor `tesseract.min.js` (63KB) + `worker.min.js` (111KB → ~174KB tổng) vào `vendor/tesseract/` vì worker buộc cùng origin; lõi wasm 3,5MB + dữ liệu tiếng Việt 3,85MB tải từ jsDelivr/tessdata ở lần dùng đầu rồi SW cache lại (đã kiểm chứng: worker vendor + core/lang CDN chạy tốt trong Chrome headless). *Loại bỏ:* vendor toàn bộ (+7,3MB vào repo, phình mọi lần clone/deploy); chỉ dùng CDN (worker khác origin → không đáng tin); PaddleOCR ONNX (chính xác hơn nhưng 10–20MB model không có SDK JS chính thức cho tiếng Việt, phải tự ghép det+rec+dict → quá nặng cho MVP này); API đám mây (Google Vision) — bị loại vì riêng tư/offline.

**D2 — Tải theo nhu cầu, cache trong bucket riêng.** Không thêm tài nguyên OCR vào `ASSETS` pre-cache của SW (install app vẫn ~200KB). Thêm nhánh runtime-cache trong SW cho miền `tessdata.projectnaptha.com` và `cdn.jsdelivr.net/npm/tesseract.js-core` vào cache `nhat-ky-dinh-duong-ocr-v1`; bump `CACHE` lên `nhat-ky-dinh-duong-v3` (asset trong app đổi). *Loại bỏ:* pre-cache (bắt mọi người tải 7,3MB dù không dùng).

**D3 — Tiền xử lý ảnh bằng canvas, thu nhỏ + ảnh xám + giãn tương phản.** `createImageBitmap(file, {imageOrientation:'from-image'})` → canvas cạnh dài ≤1600px → lấy `ImageData`, chuyển xám theo luma và **giãn tương phản** (percentile 2–98) → trả canvas cho OCR. Đo được lợi ích thật: confidence 85→87% (ảnh sạch) và 85→89% (ảnh chụp), và **sửa được dấu sai** — `Canh chua cá tóc` → `Canh chua cá lóc`, `4.5` → `4`, `95.099` → `95.000`. *Loại bỏ:* đưa ảnh gốc 12MP vào OCR (chậm 3–5×, dễ OOM trên máy yếu).

**D4 — Parser theo dòng, dựa trên bằng chứng đo được.** Tách dòng → bỏ dòng khớp từ khoá header/footer (`tổng`, `vat`, `thanh toán`, `cảm ơn`, `địa chỉ/ĐC`, `SĐT`, `ngày`, `số:`...). Một dòng là món khi có **số tiền dạng `\d{1,3}([.,]\d{3})+`** hoặc có chỉ số đầu dòng `1.`/`1)`. Số cuối cùng = thành tiền, số liền trước = đơn giá; SL lấy từ số nguyên nhỏ (1–99) đứng ngay trước cụm tiền. *Loại bỏ:* regex một phát cho cả bill (dễ vỡ với bill nhiều cột), đọc theo toạ độ từng ô (tesseract.js không trả layout dễ dùng nếu không bật `tsv` — thêm phức tạp, không cần).

**D5 — Số lượng: tin tỉ lệ tiền hơn cột SL, nhưng phải đối chiếu chéo.** Tính `r = thành tiền ÷ đơn giá` (chỉ nhận khi `r` trong 0.5–20 và cách bội số 0.5 ≤0.15) và `small` (số nguyên nhỏ ở cột SL, chỉ nhận khi `|đơn giá × small − thành tiền| ≤ 15% thành tiền`). Cả hai cùng hợp lệ → chọn giá trị "tròn" hơn (ưu tiên số nguyên). Chỉ một hợp lệ → dùng nó. Không có → 1. *Loại bỏ:* chỉ tin cột SL (hay hỏng: `11.`, `4.5`), chỉ tin tỉ lệ (thành tiền cũng hay hỏng: `1090.000`).

**D6 — Matcher chịu lỗi dấu + chịu lỗi 1–2 ký tự.** Chuẩn hoá `norm()` (đã có) → so khớp theo **từ**: mỗi từ của tên món thư viện phải tìm được một từ trong dòng OCR có `1 - dist/max(len) ≥ 0.8` (Levenshtein); điểm = tỉ lệ từ khớp × độ tương đồng trung bình. Guard chống gán bừa: **bỏ qua hoàn toàn khi tên thư viện chỉ có 1 từ mà dòng OCR có ≥2 từ** (bài học từ test: `Bò né` bị gán thành `Bơ`) và bỏ qua khi độ phủ <0.6. Trả **top 3 ứng viên** để người dùng đổi. Cùng cơ chế này dùng để nhận biết dòng tiêu đề/tổng tiền: so khớp mờ từng từ với danh sách từ khoá (ngưỡng 0.7) nên bắt được cả `THANH. TOÁN` và `Tôủg cộng` — substring thuần trượt cả hai. *Loại bỏ:* substring thuần (test cho thấy `muôúg` không khớp `muống`), fuzzy toàn chuỗi (không xử lý được dòng có cả số tiền — nhưng vẫn dùng sau khi đã tách phần tên).

**D7 — Màn xem lại là bottom sheet dùng lại UI hiện có.** Mỗi dòng: checkbox · chữ OCR (nhỏ, mờ) · món khớp (đậm) + 2 ứng viên khác · số khẩu phần (+/−) · kcal dòng; cuối sheet: tổng kcal dự kiến, nhóm bữa (seg 5 bữa, mặc định suy từ giờ hiện tại), giờ (time-picker 5 phút, dùng `floorTo5` — không bao giờ ở tương lai), nút "Ghi N món". *Loại bỏ:* ghi thẳng rồi cho sửa (dễ tạo dữ liệu sai hàng loạt), modal từng dòng (chậm, mất công hơn gõ tay).

**D8 — Tạo món tự khai báo ngay trong dòng chưa khớp.** Mở form món tự khai báo hiện có với **tên điền sẵn từ OCR**, người dùng nhập kcal/macro (không tự bịa dinh dưỡng), lưu xong thì dòng nháp tự gán vào món mới. Tái dùng nguyên `openCustomFood()`.

**D9 — Không đổi mô hình dữ liệu.** Dòng được xác nhận ghi qua `addEntry(food, qty, meal, time, dateKey)` như thường → snapshot + mọi tính năng cũ (thống kê, CSV, JSON, dọn 31 ngày) hoạt động không cần sửa. `ST.bill` chỉ là state tạm của sheet, không lưu localStorage.

## Risks / Trade-offs

- **Phụ thuộc CDN ở lần dùng đầu** (jsDelivr/tessdata) → Đường dẫn gom vào hằng số `OCR_PATHS`; thông báo lỗi cho phép thử lại; nếu sau này cần offline 100% từ đầu thì chỉ việc copy 2 tệp vào `vendor/` và đổi hằng số (đã ghi trong README).
- **7,3MB lần tải đầu trên 4G** → tải theo nhu cầu + hiện tiến trình + cache lại; người không dùng OCR không bị ảnh hưởng.
- **OCR điện thoại chậm 3–8s** → chạy trong worker (UI vẫn cuộn được), thu nhỏ 1600px, hiện tiến trình; kết quả sai thì người dùng sửa ở màn xem lại chứ không mất gì.
- **Dữ liệu dinh dưỡng của món ghép từ OCR vẫn là tham khảo** → giữ nguyên ghi chú sai số trên tab Cài đặt; bill không cho biết khối lượng thật của món.
- **Bill viết tay / bill chỉ ghi tổng** → không hỗ trợ; spec yêu cầu thông báo rõ + rơi về ghi tay, và README ghi rõ giới hạn này.
- **SW cache-first có thể giữ bản cũ** → bump `CACHE` v3 trong cùng commit với thay đổi asset; chip phiên bản lên v1.1.0 để kiểm tra trên máy.

## Migration Plan

Không có thay đổi dữ liệu (chỉ thêm luồng nhập). Triển khai: vendor tài nguyên → code → probe puppeteer (bill giả) → commit + push → Vercel deploy → cài lại trên điện thoại và chụp 1 bill thật. Rollback: `git revert` + push (feature độc lập, không ảnh hưởng entry đã ghi).

## Open Questions

Không còn câu hỏi mở. Hai điểm đã chốt khi lập kế hoạch:

1. **Tài nguyên**: vendor phần nhỏ (worker/wrapper) + CDN phần nặng, có đường lùi là vendor toàn bộ nếu CDN thành vấn đề (D1/D2).
2. **Số tiền trên bill**: chỉ dùng để suy số lượng và lọc dòng, **không** ghi vào sổ chi tiêu — việc nối sang Money Lover là change riêng.
