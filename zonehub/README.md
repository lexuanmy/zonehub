# Hướng dẫn cài đặt và chạy ZoneHub

## Yêu cầu hệ thống
- Node.js (v16+)
- Python (v3.11, v3.12 hoặc v3.13)
- XAMPP (MySQL)
- VS Code hoặc IDE tương tự

## Cài đặt và chạy Backend

1. Tạo database MySQL trong XAMPP:
   - Mở XAMPP Control Panel và khởi động MySQL
   - Mở phpMyAdmin (http://localhost/phpmyadmin)
   - Tạo database mới có tên `zonehub`

2. Cài đặt và chạy backend:
   ```bash
   cd zonehub_restructured/backend
   
   # Tạo và kích hoạt môi trường ảo Python
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   
   # Cài đặt các thư viện
   pip install -r requirements.txt
   
   # Chạy ứng dụng
   python src/main.py
   ```

3. Backend sẽ chạy tại: http://localhost:5000

## Cài đặt và chạy Frontend

1. Cài đặt các thư viện:
   ```bash
   cd zonehub_restructured/frontend
   npm install
   ```

2. Chạy ứng dụng:
   ```bash
   npm run dev
   ```

3. Frontend sẽ chạy tại: http://localhost:5173

## Các thay đổi đã thực hiện

1. **Cấu trúc thư mục Backend**:
   - Đã chuẩn hóa cấu trúc thư mục backend theo tiêu chuẩn Python hiện đại
   - Đã di chuyển tất cả mã nguồn vào thư mục `src`
   - Đã cập nhật tất cả đường dẫn import để phù hợp với cấu trúc mới

2. **Cấu hình Database**:
   - Đã thêm file cấu hình database trong `src/config/database.py`
   - Đã thêm file kết nối MySQL trong `src/config/mysql_connector.py`
   - Đã cập nhật file `.env` với các biến kết nối MySQL

3. **Tương thích Python 3.13**:
   - Đã cấu hình SocketIO với `async_mode='threading'` thay vì eventlet
   - Đã loại bỏ eventlet khỏi requirements.txt
   - Đã kiểm thử và xác nhận hoạt động ổn định trên Python 3.13

4. **Frontend**:
   - Đã tạo đầy đủ các file cấu hình (package.json, tsconfig.json, vite.config.ts, v.v.)
   - Đã cấu hình proxy API để kết nối với backend

## Lưu ý

- Đảm bảo XAMPP MySQL đang chạy trước khi khởi động backend
- Nếu gặp lỗi kết nối database, kiểm tra lại thông tin trong file `.env`
- Mặc định, backend sẽ tự động tạo các bảng trong database khi khởi động lần đầu
- Nếu sử dụng Python 3.13, đảm bảo không cài đặt thêm eventlet vì không tương thích
