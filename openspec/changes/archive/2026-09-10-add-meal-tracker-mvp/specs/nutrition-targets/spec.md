## Purpose

Tính mục tiêu năng lượng và tỉ lệ macro từ thông tin cơ thể và mức vận động, để việc ghi bữa có ngưỡng so sánh rõ ràng thay vì cảm tính.

## ADDED Requirements

### Requirement: Hồ sơ cơ thể và mức vận động

Ứng dụng SHALL lưu hồ sơ gồm: giới tính, tuổi, chiều cao (cm), cân nặng (kg) và mức vận động; mức vận động SHALL chọn từ 4 mức cố định: ít vận động, vận động nhẹ, vận động vừa, vận động nhiều.

#### Scenario: Nhập hồ sơ lần đầu

- **WHEN** người dùng mở tab Cài đặt khi chưa có hồ sơ
- **THEN** ứng dụng hiển thị form nhập hồ sơ và yêu cầu hoàn tất trước khi hiển thị mục tiêu kcal

#### Scenario: Hồ sơ thiếu hoặc không hợp lệ

- **WHEN** người dùng lưu hồ sơ với tuổi ngoài khoảng 10–100 hoặc chiều cao/cân nặng ≤ 0
- **THEN** ứng dụng từ chối lưu và hiển thị thông báo lỗi theo trường tương ứng

### Requirement: Tính năng lượng mục tiêu hằng ngày

Ứng dụng SHALL tính nhu cầu cơ bản theo công thức **Mifflin-St Jeor**, nhân với hệ số vận động (ít vận động 1.2 · nhẹ 1.375 · vừa 1.55 · nhiều 1.725), rồi điều chỉnh theo mục tiêu cân nặng: giảm cân **−15%**, giữ cân **0%**, tăng cân **+10%**; kết quả SHALL làm tròn tới 10 kcal gần nhất.

#### Scenario: Tính mục tiêu cho hồ sơ cụ thể

- **WHEN** hồ sơ là nam 38 tuổi, cao 170 cm, nặng 70 kg, vận động nhẹ, mục tiêu giữ cân
- **THEN** ứng dụng hiển thị mục tiêu kcal/ngày được tính theo Mifflin-St Jeor × 1.375 và làm tròn tới 10 kcal, kèm giải thích ngắn công thức đang dùng

#### Scenario: Đổi mức vận động

- **WHEN** người dùng đổi mức vận động từ "nhẹ" sang "vừa"
- **THEN** mục tiêu kcal/ngày được tính lại và hiển thị giá trị mới ngay

### Requirement: Tỉ lệ macro và quy đổi gram

Ứng dụng SHALL cho phép chọn bộ tỉ lệ macro dựng sẵn (**giảm cân 30/35/35**, **giữ dáng 25/45/30**, **tăng cơ 30/45/25** theo Đạm/Carb/Béo) hoặc tự nhập tỉ lệ; tổng ba tỉ lệ SHALL bằng 100%; ứng dụng SHALL quy đổi ra gram bằng 4 kcal/g cho đạm và carb, 9 kcal/g cho béo.

#### Scenario: Chọn preset macro

- **WHEN** người dùng chọn preset "giảm cân 30/35/35" với mục tiêu 2.000 kcal
- **THEN** ứng dụng hiển thị mục tiêu đạm 150 g, carb 175 g, béo 78 g (làm tròn tới 1 g)

#### Scenario: Tỉ lệ tự nhập không hợp lệ

- **WHEN** người dùng nhập tỉ lệ macro có tổng khác 100% (sai lệch hơn 1%)
- **THEN** ứng dụng không lưu và hiển thị thông báo yêu cầu tổng bằng 100%

### Requirement: Mục tiêu hiển thị trên tab Hôm nay

Ứng dụng SHALL hiển thị mục tiêu kcal/ngày và mục tiêu 3 macro trên tab Hôm nay, kèm phần đã ăn/còn lại; khi chưa có hồ sơ, ứng dụng SHALL hiển thị mời thiết lập mục tiêu thay vì so sánh với giá trị mặc định.

#### Scenario: Chưa thiết lập hồ sơ

- **WHEN** người dùng mới ghi bữa nhưng chưa nhập hồ sơ cơ thể
- **THEN** tab Hôm nay vẫn hiển thị tổng kcal đã ăn, và hiển thị lời mời "thiết lập mục tiêu" ở vị trí thanh tiến độ

### Requirement: Thay đổi mục tiêu không sửa dữ liệu đã ghi

Ứng dụng SHALL chỉ áp dụng mục tiêu mới cho việc so sánh từ thời điểm thay đổi trở đi; dữ liệu bữa ăn đã ghi SHALL giữ nguyên.

#### Scenario: Đổi mục tiêu giữa tuần

- **WHEN** người dùng đổi mục tiêu từ 2.000 kcal xuống 1.800 kcal
- **THEN** tổng kcal của các ngày đã ghi không thay đổi, chỉ phần "còn lại" của ngày hiện tại được tính theo mục tiêu mới
