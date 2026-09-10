## Purpose

Cho phép người dùng chụp ảnh hoá đơn nhà hàng và để ứng dụng nhận diện tên món, số lượng rồi điền sẵn vào nhật ký bữa ăn — người dùng xác nhận thay vì gõ tay từng món.

## ADDED Requirements

### Requirement: Chụp hoặc chọn ảnh hoá đơn

Ứng dụng SHALL cho phép người dùng chụp ảnh hoá đơn bằng camera sau hoặc chọn một ảnh có sẵn trong máy, và SHALL xử lý ảnh **hoàn toàn trên thiết bị**.

#### Scenario: Chụp bill từ màn thêm món

- **WHEN** người dùng bấm "Chụp bill" trong luồng thêm món và chụp ảnh hoá đơn
- **THEN** ứng dụng hiển thị trạng thái đang xử lý ảnh và tiến trình đọc chữ, không có yêu cầu mạng nào chứa ảnh hoá đơn

#### Scenario: Chọn ảnh có sẵn

- **WHEN** người dùng chọn một ảnh hoá đơn đã chụp trước đó từ thư viện ảnh
- **THEN** ứng dụng chạy đúng luồng nhận diện như khi chụp trực tiếp

### Requirement: Nhận diện chữ và tách dòng món

Ứng dụng SHALL nhận diện chữ tiếng Việt trên ảnh, SHALL tách nội dung thành từng dòng, và SHALL chỉ đưa vào danh sách nháp những dòng là **món** — loại bỏ tên/địa chỉ nhà hàng, số điện thoại, số hoá đơn, ngày giờ, tổng tiền, thuế và lời cảm ơn.

#### Scenario: Bill có dòng tổng và thuế

- **WHEN** ảnh hoá đơn gồm 6 dòng món cùng các dòng tiêu đề, "Tổng cộng", "VAT", "Thanh toán" và lời cảm ơn
- **THEN** danh sách nháp chỉ có 6 dòng món, không có dòng tổng/VAT/lời cảm ơn

#### Scenario: Ảnh không có dòng món nào

- **WHEN** ảnh là hoá đơn chỉ ghi tổng tiền (hoặc ảnh không đọc được chữ)
- **THEN** ứng dụng thông báo không tìm thấy dòng món nào, gợi ý thêm món thủ công, và **không ghi** mục nào vào nhật ký

### Requirement: Xác định số khẩu phần cho mỗi dòng

Ứng dụng SHALL xác định số khẩu phần của mỗi dòng theo thứ tự ưu tiên: (1) cột số lượng nếu đọc được, (2) suy từ tỉ lệ `thành tiền ÷ đơn giá` khi cả hai số đọc được và tỉ lệ nằm trong khoảng hợp lý (làm tròn tới bội số 0.5), (3) mặc định **1**.

#### Scenario: Cột số lượng đọc được

- **WHEN** dòng hoá đơn là "Bia lon 4 25.000 100.000"
- **THEN** dòng nháp có 4 khẩu phần

#### Scenario: Cột số lượng đọc sai nhưng tỉ lệ tiền đúng

- **WHEN** cột số lượng được đọc thành "4.5" nhưng đơn giá 25.000 và thành tiền 100.000
- **THEN** dòng nháp dùng **4** khẩu phần (suy từ tỉ lệ), không dùng 4.5

#### Scenario: Chỉ đọc được tên món

- **WHEN** dòng chỉ còn tên món, không có số nào đọc được
- **THEN** dòng nháp mặc định 1 khẩu phần và người dùng sửa được ở màn xem lại

### Requirement: Khớp tên món với thư viện, chịu lỗi dấu và chính tả

Ứng dụng SHALL so khớp tên món nhận diện được với thư viện món hiện có (gồm món tự khai báo) theo cách **bỏ dấu** và **chịu lỗi 1–2 ký tự mỗi từ**, SHALL đề xuất tối đa 3 ứng viên xếp theo độ khớp giảm dần, và SHALL đánh dấu rõ dòng chưa khớp được món nào.

#### Scenario: Tên món sai dấu vẫn khớp đúng

- **WHEN** OCR trả về "Rau muôúg xào tỏi" trong khi thư viện có món rau muống
- **THEN** dòng nháp hiển thị món rau muống của thư viện là ứng viên khớp, kèm các ứng viên khác để đổi

#### Scenario: Món không có trong thư viện

- **WHEN** OCR trả về "Bò né" và thư viện không có món nào tương ứng
- **THEN** dòng nháp được đánh dấu "chưa có trong thư viện" và cho phép tạo món tự khai báo ngay tại dòng đó (tên điền sẵn từ OCR, người dùng nhập kcal)

#### Scenario: Không gán bừa món ngắn

- **WHEN** tên món OCR có nhiều từ nhưng chỉ khớp lờ mờ với một món một từ của thư viện
- **THEN** ứng dụng không tự gán món đó mà để dòng ở trạng thái chưa khớp

### Requirement: Màn xem lại bắt buộc trước khi ghi

Ứng dụng SHALL hiển thị **màn xem lại** gồm: chữ nhận diện được, món khớp (và ứng viên khác), số khẩu phần, kcal từng dòng, tổng kcal dự kiến, cùng lựa chọn nhóm bữa và thời gian cho cả loạt; SHALL cho sửa số khẩu phần, đổi món, bỏ chọn từng dòng; và SHALL **không ghi** mục nào vào nhật ký trước khi người dùng bấm xác nhận.

#### Scenario: Đóng màn xem lại

- **WHEN** người dùng đóng màn xem lại mà không bấm xác nhận
- **THEN** không có mục bữa ăn nào được ghi vào nhật ký

#### Scenario: Xác nhận ghi cả loạt

- **WHEN** người dùng chọn nhóm bữa, giờ và bấm xác nhận với N dòng được chọn
- **THEN** N mục được ghi vào ngày đang xem với cùng nhóm bữa và giờ đã chọn, tổng kcal/macro của ngày cập nhật ngay

#### Scenario: Sửa khẩu phần trong màn xem lại

- **WHEN** người dùng đổi một dòng từ 1 thành 2 khẩu phần
- **THEN** kcal của dòng đó và tổng kcal dự kiến của cả loạt cập nhật ngay, và mục được ghi với 2 khẩu phần

### Requirement: Danh sách nháp giữ nguyên snapshot dinh dưỡng

Ứng dụng SHALL tính kcal và macro của từng dòng theo giá trị dinh dưỡng của món tại thời điểm ghi, giống luồng ghi bữa ăn hiện có, để dữ liệu đã ghi không đổi khi thư viện món được sửa về sau.

#### Scenario: Ghi từ bill rồi sửa món trong thư viện

- **WHEN** người dùng ghi 2 khẩu phần một món từ bill, sau đó sửa kcal của món đó trong thư viện
- **THEN** mục đã ghi từ bill vẫn giữ nguyên kcal/macro ban đầu

### Requirement: Tài nguyên nhận diện tải theo nhu cầu và dùng lại được offline

Ứng dụng SHALL tải bộ máy nhận diện cùng dữ liệu tiếng Việt **chỉ khi** người dùng dùng tính năng lần đầu, SHALL lưu chúng trên thiết bị để các lần sau chạy được khi không có mạng, và khi chưa có tài nguyên mà cũng không có mạng thì SHALL thông báo rõ ràng, cho phép thử lại, và **không** ảnh hưởng tới các chức năng khác của ứng dụng.

#### Scenario: Lần đầu dùng khi có mạng

- **WHEN** người dùng chụp bill lần đầu và thiết bị có mạng
- **THEN** ứng dụng tải tài nguyên nhận diện kèm tiến trình tải, rồi chạy nhận diện bình thường

#### Scenario: Dùng lại khi không có mạng

- **WHEN** người dùng đã dùng tính năng ít nhất một lần và sau đó mở lại ứng dụng khi mất mạng
- **THEN** nhận diện vẫn chạy được bằng tài nguyên đã lưu trên thiết bị

#### Scenario: Chưa có tài nguyên và không có mạng

- **WHEN** người dùng bấm "Chụp bill" lần đầu khi thiết bị không có mạng
- **THEN** ứng dụng hiển thị thông báo cần mạng cho lần đầu và vẫn cho ghi món thủ công bình thường

### Requirement: Tiền xử lý ảnh và phản hồi trong khi đọc

Ứng dụng SHALL thu nhỏ ảnh về cạnh dài tối đa **1600px** và chuyển sang ảnh xám trước khi nhận diện, SHALL tôn trọng hướng xoay của ảnh, SHALL hiển thị tiến trình trong khi đọc chữ mà không chặn giao diện, và SHALL báo lỗi rõ ràng khi tệp chọn không phải ảnh hoặc ảnh không xử lý được.

#### Scenario: Ảnh độ phân giải lớn từ camera

- **WHEN** người dùng chụp ảnh 4000×3000
- **THEN** ứng dụng xử lý ảnh ở cạnh dài không quá 1600px và vẫn cho kết quả nhận diện dùng được

#### Scenario: Tệp không phải ảnh

- **WHEN** người dùng chọn một tệp không phải ảnh
- **THEN** ứng dụng hiển thị thông báo lỗi và không làm treo ứng dụng

### Requirement: Ảnh hoá đơn không rời khỏi thiết bị

Ứng dụng SHALL không gửi ảnh hoá đơn hay nội dung chữ nhận diện tới bất kỳ máy chủ nào; các yêu cầu mạng duy nhất được phép trong luồng này là tài nguyên nhận diện.

#### Scenario: Kiểm tra yêu cầu mạng khi nhận diện

- **WHEN** người dùng chạy luồng chụp bill và theo dõi các yêu cầu mạng của ứng dụng
- **THEN** chỉ thấy yêu cầu tài nguyên nhận diện (bộ máy, dữ liệu tiếng Việt), không có yêu cầu nào chứa ảnh hoặc chữ đã nhận diện
