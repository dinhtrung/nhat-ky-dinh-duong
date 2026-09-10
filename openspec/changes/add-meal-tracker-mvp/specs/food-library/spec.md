## Purpose

Thư viện món ăn/thức uống Việt Nam kèm dữ liệu dinh dưỡng theo khẩu phần thực tế, làm nguồn dữ liệu để ghi bữa ăn nhanh mà không cần cân đo từng gram.

## ADDED Requirements

### Requirement: Thư viện món dựng sẵn

Ứng dụng SHALL kèm sẵn tối thiểu **150 món ăn và thức uống phổ biến của người Việt**, mỗi món có: tên tiếng Việt, nhóm (món chính / món phụ / canh-rau / đồ uống / ăn vặt), đơn vị khẩu phần hiển thị (bát, tô, ổ, miếng, ly, cái), khối lượng tham chiếu của một khẩu phần, và giá trị kcal + đạm + carb + béo cho một khẩu phần đó.

#### Scenario: Tra cứu một món quen thuộc

- **WHEN** người dùng mở thư viện và tìm "phở"
- **THEN** kết quả hiển thị món phở với đơn vị "1 tô", khối lượng tham chiếu, và giá trị dinh dưỡng cho một tô

#### Scenario: Dữ liệu dinh dưỡng hiển thị theo khẩu phần

- **WHEN** người dùng xem chi tiết một món trong thư viện
- **THEN** giá trị kcal và macro được hiển thị trên một khẩu phần (không phải trên 100g) để người dùng không phải tự quy đổi

### Requirement: Tìm kiếm món không phân biệt dấu

Ứng dụng SHALL cho phép tìm món theo tên, chấp nhận cả cách gõ có dấu và không dấu, và trả kết quả ngay khi người dùng gõ.

#### Scenario: Gõ không dấu

- **WHEN** người dùng gõ "com tam"
- **THEN** kết quả bao gồm "Cơm tấm"

#### Scenario: Không có kết quả

- **WHEN** người dùng gõ một chuỗi không khớp món nào
- **THEN** ứng dụng hiển thị thông báo không tìm thấy kèm gợi ý thêm món tự khai báo

### Requirement: Thêm món tự khai báo

Ứng dụng SHALL cho phép người dùng tạo món mới với tên, đơn vị khẩu phần, khối lượng (tuỳ chọn) và kcal + đạm + carb + béo cho một khẩu phần; món mới SHALL dùng được ngay để ghi bữa và tồn tại qua các lần mở ứng dụng.

#### Scenario: Tạo món riêng

- **WHEN** người dùng nhập món "Cơm gạo lứt nhà nấu" với 1 bát = 180 kcal, 4g đạm, 38g carb, 1g béo và lưu
- **THEN** món xuất hiện trong thư viện, tìm kiếm được, và ghi được vào bữa ăn

#### Scenario: Dữ liệu không hợp lệ bị chặn

- **WHEN** người dùng lưu món với kcal âm hoặc tên để trống
- **THEN** ứng dụng từ chối lưu và hiển thị thông báo lỗi tương ứng

### Requirement: Quản lý món tự khai báo

Ứng dụng SHALL cho phép sửa và xoá món do người dùng tạo; món dựng sẵn SHALL không sửa được nhưng có thể đánh dấu yêu thích.

#### Scenario: Sửa món tự khai báo

- **WHEN** người dùng chỉnh kcal của món tự khai báo từ 180 thành 200 và lưu
- **THEN** các lần ghi bữa **trước đó** giữ nguyên giá trị cũ, các lần ghi **sau đó** dùng giá trị mới

#### Scenario: Xoá món tự khai báo

- **WHEN** người dùng xoá một món tự khai báo đã từng được dùng để ghi bữa
- **THEN** món biến khỏi thư viện nhưng các mục bữa ăn đã ghi vẫn hiển thị đúng tên và dinh dưỡng cũ

### Requirement: Món ưu tiên hiển thị trước

Ứng dụng SHALL hiển thị món **yêu thích** và món **vừa dùng gần đây** ở đầu danh sách chọn món để thao tác ghi bữa nhanh.

#### Scenario: Người dùng ăn món lặp lại hằng ngày

- **WHEN** người dùng đã ghi "Cơm trắng" 3 lần trong tuần và mở danh sách chọn món
- **THEN** "Cơm trắng" nằm trong nhóm món gần đây ở đầu danh sách, không cần tìm kiếm
