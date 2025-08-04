# Quantum Gates Backend API

Backend API cho hệ thống mô phỏng tính toán lượng tử với các chức năng quản trị.

## 🚀 Cài đặt và Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
Sao chép file `.env.example` thành `.env` và cập nhật các thông tin:
```bash
cp .env.example .env
```

### 3. Khởi tạo database
```bash
node Backend/database/init.js
```

### 4. Chạy server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📋 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Đăng ký tài khoản mới
- `POST /login` - Đăng nhập
- `GET /profile` - Lấy thông tin profile (cần auth)
- `PUT /profile` - Cập nhật profile (cần auth)
- `PUT /change-password` - Đổi mật khẩu (cần auth)
- `POST /logout` - Đăng xuất (cần auth)
- `GET /verify-token` - Xác thực token (cần auth)
- `GET /interactions` - Lịch sử tương tác (cần auth)

### Posts (`/api/posts`)
- `GET /` - Lấy danh sách bài viết
- `GET /popular` - Bài viết phổ biến
- `GET /recent` - Bài viết mới nhất
- `GET /search?q=keyword` - Tìm kiếm bài viết
- `GET /category/:category` - Bài viết theo danh mục
- `GET /stats` - Thống kê bài viết
- `GET /:id` - Chi tiết bài viết
- `POST /` - Tạo bài viết mới (cần auth)
- `GET /user/my-posts` - Bài viết của user (cần auth)
- `PUT /:id` - Cập nhật bài viết (cần auth)
- `DELETE /:id` - Xóa bài viết (cần auth)
- `POST /:id/like` - Like/Unlike bài viết (cần auth)

### History (`/api/history`)
- `GET /my-history` - Lịch sử tương tác của user (cần auth)
- `GET /my-stats` - Thống kê tương tác của user (cần auth)
- `GET /all` - Tất cả tương tác (cần admin)
- `GET /stats` - Thống kê tổng quan (cần admin)
- `GET /user/:userId` - Lịch sử của user cụ thể (cần admin)

### Admin (`/api/admin`)
- `GET /dashboard/stats` - Thống kê dashboard (cần admin)
- `GET /users` - Danh sách users (cần admin)
- `GET /users/:userId` - Chi tiết user (cần admin)
- `PUT /users/:userId` - Cập nhật user (cần admin)
- `DELETE /users/:userId` - Xóa user (cần admin)

## 🔐 Authentication

API sử dụng JWT tokens. Gửi token trong header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

### Users
- `id` - Primary key
- `username` - Tên đăng nhập (unique)
- `email` - Email (unique)
- `password_hash` - Mật khẩu đã hash
- `full_name` - Họ tên
- `avatar_url` - URL avatar
- `role` - Vai trò (user/admin/moderator)
- `status` - Trạng thái (active/inactive/banned)
- `email_verified` - Xác thực email
- `last_login` - Lần đăng nhập cuối
- `created_at`, `updated_at` - Timestamps

### Posts
- `id` - Primary key
- `title` - Tiêu đề
- `content` - Nội dung
- `excerpt` - Tóm tắt
- `featured_image` - Ảnh đại diện
- `author_id` - ID tác giả
- `category` - Danh mục
- `tags` - Tags (JSON)
- `status` - Trạng thái (draft/published/archived)
- `view_count`, `like_count`, `comment_count` - Số lượt
- `published_at` - Thời gian xuất bản
- `created_at`, `updated_at` - Timestamps

### User Interactions
- `id` - Primary key
- `user_id` - ID user
- `interaction_type` - Loại tương tác
- `target_type` - Loại đối tượng
- `target_id` - ID đối tượng
- `metadata` - Dữ liệu bổ sung (JSON)
- `ip_address` - Địa chỉ IP
- `user_agent` - User agent
- `created_at` - Timestamp

### Admin Logs
- `id` - Primary key
- `admin_id` - ID admin
- `action` - Hành động
- `target_type` - Loại đối tượng
- `target_id` - ID đối tượng
- `old_values`, `new_values` - Giá trị cũ/mới (JSON)
- `description` - Mô tả
- `ip_address` - Địa chỉ IP
- `created_at` - Timestamp

## 🛡️ Security Features

- JWT authentication
- Password hashing với bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- SQL injection protection
- XSS protection

## 📝 Response Format

Tất cả API responses đều có format:
```json
{
  "success": true/false,
  "message": "Thông báo",
  "data": {}, // Dữ liệu (nếu có)
  "errors": [] // Lỗi validation (nếu có)
}
```

## 🔧 Environment Variables

Xem file `.env.example` để biết các biến môi trường cần thiết.

## 📈 Monitoring

- Health check: `GET /health`
- Server info: `GET /`

## 🧪 Testing

```bash
npm test
```

## 📚 Future Features

- Email verification
- Password reset
- File upload
- Real-time notifications
- API documentation với Swagger
- Quantum simulation tracking
- Advanced analytics
