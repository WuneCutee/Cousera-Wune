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

# Hướng Dẫn Sử Dụng Wune Extension

✅ **Cài đặt thành công!** Icon của Wune sẽ xuất hiện trên thanh công cụ.

---

## ⚙ Hướng Dẫn Chi Tiết

### 1. Bật chế độ nhà phát triển của Chrome
- Mở Chrome và truy cập: `chrome://extensions/`
- Gạt công tắc **Developer mode** ở góc phải trên cùng.
- Kiểm tra extension Wune đã xuất hiện trong danh sách.

> ![Ảnh minh họa bước 1](![Uploading image.png…]()
)

---

### 2. Mở Wune ở Side Panel
- Click icon **Extension** (hình mảnh ghép) trên thanh công cụ.
- Chọn **Open Side Panel** để mở bảng bên phải.
- Nếu đã pin Wune, có thể click trực tiếp icon Wune.

> ![Ảnh minh họa bước 2](path/to/image2.png)

---

### 3. Giao diện Wune hiển thị bên phải
- Bảng bên phải xuất hiện với giao diện Wune.
- Kiểm tra các tab như Video, Quiz, Reading… và ô nhập API Key.

> ![Ảnh minh họa bước 3](path/to/image3.png)

---

### 4. Dán API Key vào ô "Enter your API keys"
- Sao chép API Key của bạn từ nguồn cung cấp.
- Dán vào ô nhập **Enter your API keys**.
- Nhấn **Save/Apply** nếu giao diện yêu cầu.

> ![Ảnh minh họa bước 4](path/to/image4.png)

---

### 5. Chọn các nhiệm vụ muốn làm
- **Video:** Tự động xem/điền theo yêu cầu.
- **Quiz:** Hỗ trợ làm bài trắc nghiệm.
- **Reading:** Tự động đọc/đánh dấu hoàn thành.
- Có thể thiết lập thêm tùy chọn nâng cao nếu có.

> ![Ảnh minh họa bước 5](path/to/image5.png)

---

### 6. Bắt đầu tự động hóa
- Nhấn nút **⚡ START AUTOMATION**.
- Theo dõi trạng thái chạy trong panel.
- Dừng hoặc tạm dừng bằng nút **Stop/Pause** nếu cần.

> ![Ảnh minh họa bước 6](path/to/image6.png)

---

## 💡 Mẹo & Xử Lý Sự Cố
- **Không mở được Side Panel:** Kiểm tra Chrome đã cập nhật, bật/tắt lại Developer mode.
- **API Key không nhận:** Kiểm tra không có khoảng trắng thừa, đảm bảo key còn hiệu lực.
- **Nhiệm vụ không chạy:** Đ

---






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
