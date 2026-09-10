# app-shell Specification

## Purpose
Khung ứng dụng PWA của Nhật Ký Bữa Ăn: cài được vào màn hình chính, chạy offline, tự cập nhật có kiểm soát và giữ giao diện tiếng Việt tối giản trên điện thoại.
## Requirements
### Requirement: Cài đặt và chạy offline

Ứng dụng SHALL cung cấp `manifest.json` với `display: standalone`, tên ứng dụng tiếng Việt, theme tối và icon PNG 192×192 + 512×512, để người dùng cài được vào màn hình chính và mở như một app độc lập.

#### Scenario: Cài vào màn hình chính

- **WHEN** người dùng mở URL ứng dụng trên Chrome Android và chọn "Thêm vào màn hình chính"
- **THEN** ứng dụng cài thành công, mở ở chế độ standalone (không thanh địa chỉ), hiển thị đúng tên và icon

#### Scenario: Mở lại khi không có mạng

- **WHEN** thiết bị mất mạng và người dùng mở ứng dụng đã cài từ trước
- **THEN** ứng dụng vẫn tải được giao diện và dữ liệu bữa ăn đã lưu (localStorage), không hiển thị trang lỗi của trình duyệt

### Requirement: Cập nhật phiên bản có kiểm soát

Ứng dụng SHALL tự phát hiện bản mới và tải lại một lần duy nhất để người dùng nhận được thay đổi mà không phải xoá dữ liệu trình duyệt.

#### Scenario: Có bản deploy mới

- **WHEN** một phiên bản mới được deploy và người dùng mở lại ứng dụng
- **THEN** service worker mới được cài, trang tự tải lại đúng một lần, và giao diện hiển thị phiên bản mới nhất

#### Scenario: Không tải lại lặp vô hạn

- **WHEN** trang đã ở phiên bản mới nhất và người dùng mở lại nhiều lần
- **THEN** không có vòng lặp tải lại trang và không mất dữ liệu đang nhập

### Requirement: Điều hướng tối đa bốn tab

Thanh điều hướng SHALL có tối đa **4 tab**, mỗi tab là một khu vực chức năng riêng, hiển thị đầy đủ không tràn trên màn hình hẹp 360px.

#### Scenario: Thêm tab mới trong tương lai

- **WHEN** một tính năng mới cần thêm khu vực điều hướng và thanh tab đang có 4 tab
- **THEN** nội dung mới được đặt trong một tab hiện có thay vì thêm tab thứ năm

#### Scenario: Kiểm tra trên màn hình hẹp

- **WHEN** giao diện được hiển thị ở bề rộng container 328px (tương đương máy 360px)
- **THEN** không nhãn tab nào bị tràn hay xuống dòng, và mọi nút đều nằm trong vùng chứa

### Requirement: Giao diện tiếng Việt, theme tối, nút icon-only

Toàn bộ nhãn, thông báo và định dạng số/ngày SHALL bằng tiếng Việt; nút thao tác phụ SHALL dùng icon SVG (`stroke="currentColor"`) thay cho chữ, kèm `title` mô tả.

#### Scenario: Nút thao tác phụ dùng icon

- **WHEN** người dùng xem một mục bữa ăn trong danh sách
- **THEN** nút sửa/xoá hiển thị dạng icon SVG kế thừa màu nút, có tooltip tiếng Việt mô tả hành động

### Requirement: Trạng thái rỗng an toàn

Khi chưa có dữ liệu, ứng dụng SHALL hiển thị hướng dẫn khởi đầu thay vì giá trị rỗng, `NaN` hoặc lỗi JavaScript.

#### Scenario: Lần đầu mở ứng dụng

- **WHEN** localStorage chưa có dữ liệu bữa ăn và cấu hình
- **THEN** tab Hôm nay hiển thị tổng kcal bằng 0 kèm hướng dẫn "thêm món đầu tiên", không hiển thị `NaN` hay màn hình trắng

### Requirement: Không nhúng dữ liệu cá nhân vào mã nguồn

Ứng dụng SHALL khởi tạo dữ liệu trống (không có bữa ăn, cân nặng hay mục tiêu cá nhân thật trong mã nguồn) vì repository và bản deploy là công khai.

#### Scenario: Kiểm tra bản deploy công khai

- **WHEN** kiểm tra file `app.js` trên URL công khai sau khi deploy
- **THEN** không tìm thấy tên món ăn riêng, cân nặng hay số liệu sức khoẻ cá nhân nào của người dùng

