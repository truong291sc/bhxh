# Website Tính Mức Đóng BHXH Tự Nguyện

## Mô tả
Website tính toán mức đóng bảo hiểm xã hội tự nguyện theo quy định hiện hành của Việt Nam.

## Tính năng chính

### 1. Tính toán mức đóng
- **Mức đóng cá nhân**: 22% mức thu nhập lựa chọn
- **Mức tối thiểu**: Bằng mức chuẩn hộ nghèo khu vực nông thôn (1,500,000 VNĐ)
- **Bước nhảy**: Số tiền phải chia hết cho 50,000 VNĐ

### 2. Hỗ trợ từ ngân sách nhà nước
- **50%**: Hộ nghèo, xã đảo, đặc khu
- **40%**: Hộ cận nghèo  
- **30%**: Dân tộc thiểu số
- **20%**: Đối tượng khác

### 3. Phương thức đóng
- 1 tháng
- 3 tháng
- 6 tháng
- 12 tháng

### 4. Tùy chọn bổ sung
- Hỗ trợ từ ngân sách địa phương
- Lực lượng an ninh cơ sở

## Cách sử dụng

### Bước 1: Mở website
Mở file `index.html` trong trình duyệt web.

### Bước 2: Nhập thông tin
1. **Mức thu nhập lựa chọn**: Nhập số tiền (tối thiểu 1,500,000 VNĐ, chia hết cho 50,000 VNĐ)
2. **Loại đối tượng**: Chọn loại đối tượng để xác định mức hỗ trợ
3. **Phương thức đóng**: Chọn cách đóng phù hợp
4. **Tùy chọn**: Đánh dấu nếu có hỗ trợ địa phương hoặc thuộc lực lượng an ninh cơ sở

### Bước 3: Tính toán
Nhấn nút "Tính Toán" để xem kết quả.

### Bước 4: Xem kết quả
Website sẽ hiển thị:
- Mức thu nhập lựa chọn
- Mức đóng cá nhân (22%)
- Hỗ trợ nhà nước
- Số tiền thực đóng
- Chi tiết theo các phương thức đóng
- Thông tin bổ sung

## Cấu trúc file

```
bhxh/
├── index.html      # Giao diện chính
├── styles.css      # Định dạng CSS
├── script.js       # Logic tính toán
└── README.md       # Hướng dẫn sử dụng
```

## Công thức tính toán

### Mức đóng cá nhân
```
Mức đóng cá nhân = Mức thu nhập lựa chọn × 22%
```

### Hỗ trợ nhà nước
```
Hỗ trợ nhà nước = Mức đóng cá nhân × Tỷ lệ hỗ trợ
```

### Số tiền thực đóng
```
Số tiền thực đóng = Mức đóng cá nhân - Hỗ trợ nhà nước
```

### Theo phương thức đóng
```
Số tiền theo phương thức = Số tiền thực đóng × Số tháng
```

## Quy định quan trọng

1. **Mức tối thiểu**: Không được thấp hơn mức chuẩn hộ nghèo khu vực nông thôn
2. **Bước nhảy**: Số tiền phải chia hết cho 50,000 VNĐ
3. **Hỗ trợ cao nhất**: Nếu thuộc nhiều đối tượng hỗ trợ, được hỗ trợ theo mức cao nhất
4. **Hỗ trợ địa phương**: Tùy thuộc vào chính sách từng tỉnh/thành phố

## Tính năng kỹ thuật

- **Responsive Design**: Tương thích với mọi thiết bị
- **Validation**: Kiểm tra dữ liệu đầu vào
- **Auto-adjustment**: Tự động điều chỉnh số tiền theo bước nhảy
- **Modern UI**: Giao diện hiện đại, dễ sử dụng
- **Real-time calculation**: Tính toán ngay lập tức

## Hỗ trợ

Website được phát triển để hỗ trợ người dân tính toán mức đóng BHXH tự nguyện một cách chính xác và thuận tiện.

---

**Lưu ý**: Thông tin trên website chỉ mang tính chất tham khảo. Để biết thông tin chính xác, vui lòng liên hệ cơ quan BHXH địa phương. 