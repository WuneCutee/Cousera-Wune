# 🚀 Coursera Wune - Professional Automation Tool

![Version](https://img.shields.io/badge/Version-6.4_Professional-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Chromium-orange?style=for-the-badge)

**Coursera Wune** (Extension) mạnh mẽ dành cho trình duyệt Chrome/Edge, giúp tự động hóa quá trình học tập trên Coursera. Công cụ hỗ trợ xem video, đọc tài liệu, và đặc biệt là **giải Quiz tự động bằng AI (Llama-3.3-70b)**.

---

## ✨ Tính Năng Chính

*   ✅ **Auto Watch Videos:** Tự động đánh dấu hoàn thành video (bỏ qua thời gian xem thực).
*   ✅ **Auto Solve Quizzes:** Sử dụng AI để tự động trả lời trắc nghiệm, điền từ, checkbox...
*   ✅ **Auto Reading:** Tự động đánh dấu đã đọc các bài Readings, Supplements.
*   ✅ **Auto Widget/LTI:** Tự động hoàn thành các bài Lab ảo, Widget ungraded.
*   ✅ **Giao diện SidePanel:** Hiện đại, dễ sử dụng, không che khuất nội dung bài học.
*   ✅ **Cơ chế Smart Submit:** Tự động thử lại và lưu bài thông minh để tránh lỗi hệ thống.

---


## 🛠️ Hướng Dẫn Cài Đặt (Developer Mode)

Do tool này không có trên Chrome Web Store, bạn cần cài đặt thủ công theo các bước sau:

### Bước 1: Tải mã nguồn
1.  Tải file `.zip` của dự án này về máy hoặc `git clone` repository này.
2.  Giải nén ra một thư mục (Ví dụ: `Coursera-Wune`).

### Bước 2: Cài vào trình duyệt
1.  Mở trình duyệt (Chrome, Edge, Brave...).
2.  Truy cập đường dẫn quản lý tiện ích:
    *   **Chrome:** `chrome://extensions/`
    *   **Edge:** `edge://extensions/`
3.  Bật chế độ **Developer mode (Chế độ dành cho nhà phát triển)** ở góc trên bên phải.
4.  Nhấn vào nút **Load unpacked (Tải tiện ích đã giải nén)**.
5.  Chọn thư mục `Coursera-Wune` bạn vừa giải nén ở Bước 1.

✅ **Cài đặt thành công!** Icon của Wune sẽ xuất hiện trên thanh công cụ.

---

## ⚙️ Hướng Dẫn Sử Dụng

### 1. Cấu hình API Key (Quan trọng cho Quiz)
Để tính năng giải Quiz hoạt động, tool sử dụng **Groq API** (Mô hình Llama-3). Tool có sẵn key dự phòng, nhưng để ổn định nhất, bạn nên dùng key riêng (Miễn phí).

1.  Truy cập: [https://console.groq.com/keys](https://console.groq.com/keys)
2.  Đăng nhập và tạo một **API Key** mới.
3.  Copy Key đó (bắt đầu bằng `gsk_...`).

### 2. Chạy Tool
1.  Đăng nhập vào Coursera và mở khóa học bạn muốn học.
2.  Click vào icon **Extension** trên thanh công cụ -> Chọn **Open Side Panel** (hoặc click icon Wune nếu bạn đã pin).
3.  Giao diện Wune sẽ hiện ra bên phải màn hình.
4.  Dán **API Key** của bạn vào ô "Enter your API keys".
5.  Chọn các nhiệm vụ muốn làm (Video, Quiz, Reading...).
6.  Nhấn nút **⚡ START AUTOMATION**.

---

## 📸 Hình Ảnh Demo



---

## ❓ Các Lỗi Thường Gặp (FAQ)

**Q: Tool báo "Course ID not found"?**
> A: Hãy đảm bảo bạn đang ở trang nội dung bài học (có dạng `coursera.org/learn/...`). Hãy thử F5 lại trang web và mở lại Sidepanel.

**Q: Quiz không tự nộp được?**
> A: Một số bài Quiz yêu cầu Submit thủ công hoặc có thời gian chờ. Tool sẽ cố gắng lưu đáp án (Save Draft). Bạn có thể kiểm tra và nộp tay nếu tool dừng lại.

---

## ☕ Ủng Hộ Tác Giả (Support)

Nếu thấy công cụ hữu ích, bạn có thể mời mình một ly cà phê để duy trì server và update tính năng mới:

---

Made with ❤️ by Wune 