<div align="right">
  🌐 <a href="README.md">English</a> | <strong>Tiếng Việt</strong>
</div>

# 🐋 DeepSeek-Pet (Tiện ích DeepSeek Anime Chibi trên Desktop)

![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

<img src="Banner.png" alt="DeepSeek Chibi Banner" width="100%">

Ứng dụng desktop overlay nhẹ nhàng, nền trong suốt và không viền màn hình, mang cô bé linh vật **DeepSeek anime chibi** đáng yêu đồng hành cùng bạn ngay trên màn hình máy tính!

Ứng dụng chạy luôn nổi trên các cửa sổ (always-on-top), hỗ trợ click xuyên thấu ở các vùng trong suốt, theo dõi số dư token DeepSeek và trò chuyện AI thông minh trực tiếp qua bong bóng thoại.

---

## ✨ Tính năng nổi bật

- **🖥️ Tiện ích Overlay thực thụ**: Nền hoàn toàn trong suốt, không viền cửa sổ hay khung trình duyệt — chỉ có nhân vật chibi, bong bóng thoại và menu cài đặt hiển thị tinh tế trên màn hình.
- **💬 Trò chuyện AI trực tiếp qua Google Gemini**: Bấm trực tiếp vào bong bóng thoại để mở khung nhập tin nhắn không viền. DeepSeek sẽ trả lời ngắn gọn, thông minh, ngọt ngào (gọi bạn là **"Chủ nhân"**) kèm emoji biểu cảm dễ thương.
- **🌐 Chuyển đổi song ngữ một chạm (Tiếng Việt 🇻🇳 ↔ Tiếng Anh 🇺🇸)**: Nút đổi ngôn ngữ nằm ngay trong menu cài đặt. Bấm là toàn bộ giao diện (menu, các nút bấm, lời thoại ngẫu nhiên, khung chat, và cả bảng Lịch sử sử dụng) lập tức chuyển đổi tức thì theo thời gian thực.
- **📊 Bảng Lịch sử sử dụng & Kiểm tra số dư DeepSeek**: Theo dõi chi phí mô hình cục bộ, lịch sử dùng 7 ngày qua và toàn bộ các lần tiêu thụ. Hỗ trợ nhập mã API DeepSeek để xem số dư thực tế ngay trong bong bóng thoại.
- **🖱️ Hỗ trợ Click xuyên thấu (Click-Through)**: Bấm chuột vào vùng trong suốt xung quanh chibi sẽ tác động trực tiếp vào các cửa sổ/ứng dụng làm việc bên dưới, không gây cản trở công việc.
- **🖐️ Kéo thả & Tự động bám viền**: Kéo thả chibi đến bất kỳ vị trí nào trên các màn hình; cô bé sẽ tự động hút vào mép màn hình, lật gương thông minh và nhớ vị trí sau khi tắt app.
- **📐 Chế độ Toàn màn hình & Khung nhỏ gọn (Hitbox)**: Dễ dàng bật/tắt giữa khung overlay toàn màn hình và chế độ khung nhỏ gọn (tránh các phần mềm chụp ảnh màn hình/snip tool chụp trúng toàn màn hình).
- **⚙️ Tích hợp Khay hệ thống (System Tray)**: Nhấp chuột phải vào biểu tượng chibi ở khay thông báo Windows để nhanh chóng Ẩn/Hiện, Đặt lại vị trí về góc dưới bên phải, hoặc Thoát ứng dụng.
- **🎵 Âm thanh & Hoạt ảnh tương tác**: Hoạt ảnh xoa đầu (`rua.gif`), hiệu ứng âm thanh click vui nhộn và danh sách lời thoại suy nghĩ dễ thương.

---

## 🎮 Hướng dẫn Tương tác

| Thao tác | Tác vụ |
| :--- | :--- |
| **Click 1 vào Chibi** | Hiện suy nghĩ ngẫu nhiên của DeepSeek (theo ngôn ngữ đang chọn). |
| **Click 2 vào Chibi** | Kiểm tra số dư & token DeepSeek. |
| **Click 3 vào Chibi** | Tắt / đóng bong bóng thoại. |
| **Click vào Bong bóng thoại** | Mở ô nhập tin nhắn để chat trực tiếp với DeepSeek. |
| **Nhấn Enter / Click vào câu trả lời** | Gửi tin nhắn đến AI. DeepSeek trả lời tối đa 1–2 câu ngắn. Câu trả lời tự tắt sau 10 giây hoặc click vào để tắt ngay. |
| **Click chuột phải vào Chibi / Nút Menu** | Mở bảng Cài đặt menu. |
| **Bấm nút Ngôn ngữ** | Chuyển đổi qua lại giữa `🇻🇳 Tiếng Việt` và `🇺🇸 English`. |

---

## 📥 Cài đặt & Cách chạy ứng dụng

1. Tải bản phát hành mới nhất định dạng `.zip` tại mục [Releases](../../releases).
2. Giải nén vào một thư mục bất kỳ trên máy tính.
3. Khởi chạy ứng dụng bằng một trong các cách:
   - **Cách 1 (Khuyên dùng):** Nhấn đúp chuột vào file `DeepSeekWhaleWidget.exe`.
   - **Cách 2:** Nhấn đúp chuột vào file `run-overlay.bat`.
   - **Cách 3:** Mở terminal/PowerShell và chạy `npm start` (yêu cầu máy có cài Node.js).

---

## 🔑 Hướng dẫn Cấu hình Khóa API

### 1. Khóa Google Gemini API (Dùng để Chat AI)
1. Mở Menu cài đặt của chibi.
2. Tại thẻ **Google Gemini API Key (Chat AI)** ở trên cùng, dán mã khóa lấy từ [Google AI Studio](https://aistudio.google.com/) (`AIza...`).
3. Bấm **Lưu**. Trạng thái sẽ hiện `✓ Đã kết nối`.
4. Bấm vào bong bóng thoại của DeepSeek và bắt đầu trò chuyện!

### 2. Khóa DeepSeek API (Dùng để kiểm tra số dư Token thực tế)
1. Mở Menu và bấm vào **- = Lịch sử sử dụng = -**.
2. Tại khung **Khóa API DeepSeek (Kiểm tra Token)**, dán mã khóa DeepSeek của bạn (`sk-...`).
3. Bấm **Lưu**. DeepSeek sẽ kiểm tra và hiển thị số dư thực tế trong bong bóng thoại ở lượt Click thứ 2.

---

## 🛠️ Build từ Mã nguồn

Nếu bạn muốn tự chỉnh sửa mã nguồn hoặc build lại file thực thi launcher C#:

```powershell
# Build file DeepSeekWhaleWidget.exe
powershell -ExecutionPolicy Bypass -File .\build.ps1

# Chạy ứng dụng dưới chế độ phát triển
npm start
```

---

## 📄 Bản quyền & Lời cảm ơn

- Phát hành theo giấy phép MIT.
- Được phát triển và nâng cấp dựa trên dự án gốc `dsh-whale-widget`.
