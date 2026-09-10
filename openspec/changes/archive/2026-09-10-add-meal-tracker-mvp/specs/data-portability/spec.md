## Purpose

Giữ dữ liệu bữa ăn thuộc quyền kiểm soát của người dùng: tự sao lưu, tự khôi phục, tự trích xuất để phân tích, và giới hạn thời gian lưu trữ trên thiết bị.

## ADDED Requirements

### Requirement: Xuất toàn bộ dữ liệu ra file JSON

Ứng dụng SHALL xuất được một file JSON chứa toàn bộ dữ liệu: các mục bữa ăn theo ngày, cấu hình/hồ sơ, danh sách món tự khai báo, và danh sách món yêu thích; tên file SHALL kèm ngày xuất.

#### Scenario: Xuất dữ liệu để sao lưu

- **WHEN** người dùng bấm "Xuất dữ liệu" trong tab Cài đặt
- **THEN** trình duyệt tải về một file JSON chứa đầy đủ dữ liệu hiện có và tên file có ngày (ví dụ `nhat-ky-bua-an-2026-09-09.json`)

#### Scenario: Xuất khi chưa có dữ liệu

- **WHEN** người dùng bấm "Xuất dữ liệu" nhưng chưa ghi bữa nào
- **THEN** ứng dụng vẫn xuất file JSON rỗng hợp lệ (có cấu trúc) thay vì báo lỗi

### Requirement: Nhập dữ liệu từ file JSON có kiểm tra

Ứng dụng SHALL cho phép nhập file JSON, kiểm tra cấu trúc bắt buộc trước khi ghi, yêu cầu xác nhận khi thao tác sẽ thay thế dữ liệu hiện có, và SHALL không thay đổi dữ liệu nếu file không hợp lệ.

#### Scenario: Nhập file hợp lệ

- **WHEN** người dùng chọn file JSON hợp lệ do chính ứng dụng xuất ra và xác nhận thay thế
- **THEN** dữ liệu trong file được nạp vào localStorage và giao diện hiển thị đúng dữ liệu vừa nhập

#### Scenario: File hỏng hoặc sai định dạng

- **WHEN** người dùng chọn file JSON không đúng cấu trúc hoặc không parse được
- **THEN** ứng dụng hiển thị thông báo lỗi rõ ràng và giữ nguyên dữ liệu hiện có

### Requirement: Xuất CSV để phân tích

Ứng dụng SHALL xuất được file CSV trong đó mỗi dòng là một mục bữa ăn với các cột: ngày, nhóm bữa, tên món, số khẩu phần, kcal, đạm, carb, béo.

#### Scenario: Xuất CSV theo khoảng thời gian dữ liệu hiện có

- **WHEN** người dùng bấm "Xuất CSV"
- **THEN** file CSV được tải về, dòng đầu là tiêu đề cột, các dòng sau đúng thứ tự ngày tăng dần

### Requirement: Tự dọn dữ liệu cũ hơn 31 ngày

Ứng dụng SHALL tự xoá các mục bữa ăn cũ hơn **31 ngày** khi khởi động, SHALL giữ nguyên cấu hình/hồ sơ và danh sách món tự khai báo, và SHALL chỉ ghi lại localStorage khi thực sự có dữ liệu bị xoá.

#### Scenario: Mở app sau nhiều tháng

- **WHEN** ứng dụng khởi động và tồn tại dữ liệu bữa ăn cũ hơn 31 ngày
- **THEN** các mục cũ hơn 31 ngày bị xoá khỏi dữ liệu bữa ăn, hồ sơ và món tự khai báo vẫn còn

#### Scenario: Không ghi thừa localStorage

- **WHEN** ứng dụng khởi động và không có dữ liệu nào cũ hơn 31 ngày
- **THEN** ứng dụng không thực hiện ghi lại localStorage
