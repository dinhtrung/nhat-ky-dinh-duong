## Purpose

Ghi nhận bữa ăn hằng ngày theo nhóm bữa với khẩu phần linh hoạt, và tổng hợp dinh dưỡng trong ngày để so với mục tiêu.

## ADDED Requirements

### Requirement: Ghi món theo ngày và nhóm bữa

Ứng dụng SHALL cho phép ghi món ăn vào **5 nhóm bữa**: Sáng, Trưa, Chiều, Tối, Ăn vặt; mỗi mục ghi gồm món, số khẩu phần, và **giá trị dinh dưỡng được lưu kèm tại thời điểm ghi**.

#### Scenario: Thêm món vào bữa trưa

- **WHEN** người dùng chọn bữa Trưa, chọn "Cơm tấm" với 1 khẩu phần và xác nhận
- **THEN** mục xuất hiện trong bữa Trưa của ngày hôm nay kèm kcal và macro tương ứng

#### Scenario: Dữ liệu cũ không đổi khi thư viện thay đổi

- **WHEN** món dựng sẵn hoặc món tự khai báo được cập nhật dinh dưỡng sau đó
- **THEN** các mục bữa ăn đã ghi trước đó vẫn giữ nguyên giá trị dinh dưỡng ban đầu

### Requirement: Khẩu phần theo bội số nửa khẩu phần

Ứng dụng SHALL cho phép chọn khẩu phần theo bội số **0.5** (0.5 · 1 · 1.5 · 2 …) hoặc nhập số khẩu phần trực tiếp, và SHALL tính lại dinh dưỡng theo đúng hệ số đã chọn.

#### Scenario: Ăn nửa bát cơm

- **WHEN** người dùng ghi "Cơm trắng" với 0.5 khẩu phần (1 bát = 200 kcal)
- **THEN** mục đó được tính 100 kcal và tổng kcal của ngày tăng đúng 100 kcal

### Requirement: Tổng hợp dinh dưỡng trong ngày

Ứng dụng SHALL hiển thị trên tab Hôm nay: tổng kcal đã ăn, kcal còn lại (hoặc vượt) so với mục tiêu ngày, và tiến độ 3 macro (đạm, carb, béo) theo giá trị mục tiêu; tổng SHALL cập nhật ngay sau mỗi thao tác thêm/sửa/xoá.

#### Scenario: Xem tiến độ trong ngày

- **WHEN** người dùng đã ghi 1.200 kcal với mục tiêu 2.000 kcal
- **THEN** ứng dụng hiển thị còn lại 800 kcal và tiến độ từng macro theo tỉ lệ phần trăm mục tiêu

#### Scenario: Vượt mục tiêu

- **WHEN** tổng kcal trong ngày vượt giá trị mục tiêu
- **THEN** phần chênh lệch hiển thị ở trạng thái cảnh báo (màu nhấn) kèm số kcal vượt

### Requirement: Sửa và xoá mục bữa ăn

Ứng dụng SHALL cho phép sửa số khẩu phần và thời gian của một mục, và cho phép xoá mục bằng thao tác **nhấn giữ** trên điện thoại (kèm xác nhận) cùng phương án tương đương trên desktop.

#### Scenario: Xoá mục ghi nhầm

- **WHEN** người dùng nhấn giữ một mục trong danh sách bữa và xác nhận xoá
- **THEN** mục bị xoá, tổng kcal/macro của bữa và của ngày được tính lại ngay

#### Scenario: Sửa khẩu phần

- **WHEN** người dùng sửa một mục từ 1 khẩu phần thành 2 khẩu phần
- **THEN** dinh dưỡng của mục và tổng ngày cập nhật theo hệ số mới

### Requirement: Ghi hồi tố với thời gian chính xác theo bước 5 phút

Ứng dụng SHALL cho phép thêm mục bữa ăn với thời gian chọn tay theo **bước 5 phút**, và SHALL không cho chọn thời gian trong tương lai.

#### Scenario: Thêm món đã ăn sáng nay

- **WHEN** người dùng thêm món với thời gian 07:15 trong ngày hôm nay
- **THEN** mục được ghi đúng ngày và giờ đã chọn, danh sách bữa sắp xếp theo thời gian tăng dần

#### Scenario: Chặn thời gian tương lai

- **WHEN** người dùng chọn thời gian muộn hơn thời điểm hiện tại trong ngày hôm nay
- **THEN** ứng dụng không cho xác nhận và hiển thị thông báo thời gian không hợp lệ

### Requirement: Dữ liệu theo ngày, tách biệt và an toàn

Ứng dụng SHALL lưu dữ liệu theo khoá ngày `YYYY-MM-DD` trong localStorage; một ngày không có dữ liệu SHALL hiển thị trạng thái rỗng thay vì lỗi.

#### Scenario: Xem một ngày chưa ghi gì

- **WHEN** người dùng mở một ngày chưa có mục bữa ăn nào
- **THEN** ứng dụng hiển thị trạng thái rỗng với hướng dẫn thêm món, tổng kcal bằng 0
