# Hướng dẫn Deploy Website Levi lên Vercel 🚀

Chào bạn! Đây là các bước chi tiết để đưa trang web của bạn lên Internet (Production) thông qua Vercel.

## Bước 1: Đưa Code lên GitHub (Khuyên dùng)
1. Truy cập [github.com](https://github.com/) và tạo một Repository mới (ví dụ: `web-levi`).
2. Đẩy mã nguồn từ máy tính của bạn lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with Backend Proxy"
   git branch -M main
   git remote add origin https://github.com/your-username/web-levi.git
   git push -u origin main
   ```

## Bước 2: Kết nối với Vercel
1. Truy cập [vercel.com](https://vercel.com/) và đăng nhập bằng tài khoản GitHub.
2. Nhấn nút **"Add New"** > **"Project"**.
3. Chọn Repository `web-levi` bạn vừa tải lên.

## Bước 3: Cấu hình biến môi trường (CỰC KỲ QUAN TRỌNG) 🔑
Tại màn hình cấu hình trước khi Deploy, hãy tìm phần **Environment Variables** và thêm các biến từ file `.env` của bạn vào:

| Key | Value (Lấy từ file .env của bạn) |
|---|---|
| `VITE_YOUTUBE_API_KEY` | `AIzaSy...` |
| `VITE_FB_ACCESS_TOKEN` | `your_token_here` |
| `UPSTASH_REDIS_REST_URL` | `https://nearby-snipe...` |
| `UPSTASH_REDIS_REST_TOKEN` | `AbmBAAIn...` |

> [!IMPORTANT]
> Đảm bảo bạn copy chính xác giá trị, không bao gồm dấu ngoặc kép dư thừa.

## Bước 4: Triển khai (Deploy)
1. Sau khi điền xong các biến, nhấn nút **"Deploy"**.
2. Đợi khoảng 1-2 phút để Vercel xây dựng trang web.
3. Chúc mừng! Website của bạn đã online tại địa chỉ `.vercel.app`.

## Bước 5: Cài đặt Domain riêng (Tùy chọn)
1. Vào Dashboard của dự án trên Vercel.
2. Chọn Tab **Settings** > **Domains**.
3. Nhập tên miền bạn đã mua (ví dụ: `levi97.vn`).
4. Vercel sẽ hướng dẫn bạn cấu hình bản ghi DNS (A record hoặc CNAME) tại nhà cung cấp tên miền của bạn.

---
*Mọi thứ đã sẵn sàng để tỏa sáng! 🌟*
