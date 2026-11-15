<div align="right">
  🌐 <a href="README.md">English</a> | <strong>Tiếng Việt</strong>
</div>

# 🐋 DeepSeek-Pet (Tiện ích Desktop Overlay với Rust / Tauri v2)

![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)
![Tech Stack](https://img.shields.io/badge/backend-Rust%20%7C%20Tauri%20v2-orange.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

<img src="Banner.png" alt="DeepSeek Chibi Banner" width="100%">

Ứng dụng desktop overlay siêu nhẹ, nền trong suốt và không viền màn hình, mang cô bé linh vật **DeepSeek anime chibi** đồng hành cùng bạn ngay trên máy tính—nay đã được **viết lại hoàn toàn bằng Rust và Tauri v2**!

Ứng dụng chạy luôn nổi trên các cửa sổ (always-on-top), hỗ trợ click xuyên thấu ở các vùng trong suốt, theo dõi số dư token DeepSeek và trò chuyện AI thông minh thời gian thực qua mô hình Google Gemini.

---

## ⚡ Điểm mới vượt trội trên phiên bản Rust / Tauri v2

- **🚀 Tiết kiệm 75% RAM**: Dung lượng RAM khi chạy nền giảm mạnh từ ~120MB+ (Electron) xuống chỉ còn **~35MB**!
- **⚡ Khởi động tức thì, không giật lag**: Thay thế hoàn toàn Chromium cồng kềnh bằng engine **WebView2** tích hợp sẵn của Windows và mã máy Rust. CPU ở trạng thái nghỉ xấp xỉ 0%.
- **🦀 Xử lý Click xuyên thấu (Hit-Testing) Win32 gốc**: Tiến trình Rust chạy ngầm đọc tọa độ con trỏ (`GetCursorPos`) theo thời gian thực để chuyển đổi mượt mà giữa chế độ click xuyên thấu và tương tác, không còn hiện tượng kẹt click chuột.
- **🔒 Khóa đơn tiến trình (Single-Instance Lock)**: Ngăn mở trùng lặp ứng dụng nhiều lần. Khi mở lại `.exe`, cửa sổ hiện tại sẽ tự động nổi lên và lấy tiêu điểm.
- **📦 Gọn gàng (~130 MB)**: Thư mục độc lập, không cần cài đặt thêm gói phụ thuộc bên ngoài.

---

## ✨ Các tính năng nổi bật

- **🖥️ Tiện ích Overlay thực thụ**: Nền hoàn toàn trong suốt, không viền cửa sổ hay thanh tác vụ rườm rà. Chỉ có nhân vật chibi, bong bóng thoại và menu cài đặt hiển thị nổi bật trên màn hình.
- **💬 Trò chuyện AI trực tiếp qua Google Gemini**: Bấm trực tiếp vào bong bóng thoại để mở khung nhập tin nhắn. DeepSeek sẽ trả lời ngắn gọn, thông minh, ngọt ngào (gọi bạn là **"Chủ nhân"**) kèm emoji biểu cảm dễ thương.
- **🌐 Chuyển đổi song ngữ một chạm (Tiếng Việt 🇻🇳 ↔ Tiếng Anh 🇺🇸)**: Nút đổi ngôn ngữ nằm ngay trong menu cài đặt. Bấm là toàn bộ giao diện (menu, các nút bấm, lời thoại ngẫu nhiên, khung chat, và cả bảng Lịch sử sử dụng) lập tức chuyển đổi tức thì.
- **📊 Bảng Lịch sử sử dụng & Kiểm tra số dư DeepSeek**: Theo dõi chi phí mô hình cục bộ, lịch sử dùng 7 ngày qua và toàn bộ các lần tiêu thụ. Hỗ trợ nhập mã API DeepSeek để xem số dư thực tế ngay trong bong bóng thoại.
- **🖱️ Hỗ trợ Click xuyên thấu (Click-Through)**: Bấm chuột vào vùng trong suốt xung quanh chibi sẽ tác động trực tiếp vào các cửa sổ/ứng dụng làm việc bên dưới (trình duyệt, game, code editor) mà không gây gián đoạn.
- **🖐️ Kéo thả & Tự động bám viền**: Kéo thả chibi đến bất kỳ vị trí nào trên các màn hình; cô bé sẽ tự động hút vào mép màn hình, lật gương thông minh và nhớ vị trí sau khi tắt app.
- **📐 Chế độ Toàn màn hình & Khung nhỏ gọn (Hitbox)**: Dễ dàng bật/tắt giữa khung overlay toàn màn hình và chế độ khung nhỏ gọn (520x480) ngay trong menu hoặc khay hệ thống.
- **⚙️ Tích hợp Khay hệ thống (System Tray)**: Nhấp chuột trái để Ẩn/Hiện nhanh, nhấp chuột phải để mở menu tùy chọn (Toàn màn hình, Đặt lại vị trí về góc dưới bên phải, Tải lại, hoặc Thoát ứng dụng).
- **🎵 Âm thanh & Hoạt ảnh tương tác**: Hoạt ảnh xoa đầu (`rua.gif`), hiệu ứng âm thanh click vui nhộn và danh sách lời thoại suy nghĩ dễ thương.

---

## 🎮 Hướng dẫn Tương tác

| Thao tác | Tác vụ |
| :--- | :--- |
| **Click 1 vào Chibi** | Hiện suy nghĩ ngẫu nhiên của DeepSeek (theo ngôn ngữ đang chọn). |
| **Click 2 vào Chibi** | Kiểm tra số dư & token DeepSeek. |
| **Click 3 vào Chibi** | Tắt / đóng bong bóng thoại. |
| **Click vào Bong bóng thoại** | Mở ô nhập tin nhắn để chat trực tiếp với DeepSeek. |
| **Nhấn Enter / Click vào câu trả lời** | Gửi tin nhắn đến AI. DeepSeek trả lời tối đa 1–2 câu ngắn. |
| **Click chuột phải vào Chibi / Nút Menu** | Mở bảng Cài đặt menu. |
| **Bấm nút Ngôn ngữ** | Chuyển đổi qua lại giữa `🇻🇳 Tiếng Việt` và `🇺🇸 English`. |
| **Click chuột trái vào Icon Khay hệ thống** | Ẩn / Hiện nhân vật chibi ngay lập tức. |
| **Click chuột phải vào Icon Khay hệ thống** | Menu khay hệ thống (Ẩn/Hiện, Toàn màn hình, Đặt lại vị trí, Tải lại, Thoát). |

---

## 📥 Hướng dẫn Chạy ứng dụng

1. Mở thư mục:
   ```
   dsh-whale-tauri\
   ```
2. Nhấn đúp chuột vào file **`DeepSeekWhaleWidget.exe`**.
3. Nhân vật chibi sẽ lập tức xuất hiện ở góc dưới bên phải màn hình desktop của bạn!

---

## 🔑 Hướng dẫn Cấu hình Khóa API

### 1. Khóa Google Gemini API (Dùng để Chat AI)
1. Mở Menu cài đặt của chibi (click chuột phải vào chibi hoặc nút menu).
2. Tại thẻ **Google Gemini API Key (Chat AI)** ở trên cùng, dán mã khóa lấy từ [Google AI Studio](https://aistudio.google.com/) (`AIza...`).
3. Bấm **Lưu**. Trạng thái sẽ hiện `✓ Đã kết nối`.
4. Bấm vào bong bóng thoại của DeepSeek và bắt đầu trò chuyện!

### 2. Khóa DeepSeek API (Dùng để kiểm tra số dư Token thực tế)
1. Mở Menu và bấm vào **- = Lịch sử sử dụng = -**.
2. Tại khung **Khóa API DeepSeek (Kiểm tra Token)**, dán mã khóa DeepSeek của bạn (`sk-...`).
3. Bấm **Lưu**. DeepSeek sẽ kiểm tra và hiển thị số dư thực tế trong bong bóng thoại ở lượt Click thứ 2.

---

## 🛠️ Build từ Mã nguồn (Rust & Tauri v2)

Nếu bạn muốn tự chỉnh sửa mã nguồn hoặc biên dịch lại file thực thi Rust:

### Yêu cầu cài đặt
- [Rust](https://www.rust-lang.org/tools/install) (toolchain GNU hoặc MSVC)
- MinGW-w64 (nếu sử dụng target `x86_64-pc-windows-gnu`)
- Node.js (dùng để chạy các tiến trình phụ trợ đi kèm)

### Lệnh biên dịch
```powershell
cd src-tauri
cargo build --release
```
File thực thi sau khi biên dịch sẽ nằm tại `src-tauri/target/release/dsh-whale-tauri.exe`. Sao chép file này ra thư mục gốc và đổi tên thành `DeepSeekWhaleWidget.exe`.

> 💡 **Mẹo:** Sau khi biên dịch xong, hãy chạy lệnh `cargo clean` trong thư mục `src-tauri` để dọn dẹp ~4.9 GB file đệm tạm thời của trình biên dịch.

---

## 📁 Cấu trúc Thư mục

```
dsh-whale-tauri/
├── DeepSeekWhaleWidget.exe   # File chạy chính thức (Rust native)
├── WebView2Loader.dll        # Loader thư viện WebView2 của Windows
├── server.mjs                # Server backend Node.js (chạy ngầm tự động)
├── overlay.html              # Giao diện desktop overlay trong suốt
├── runtime/                  # Runtime Node.js thu gọn (node.exe)
├── assets/                   # Hoạt ảnh, sprite nhân vật, âm thanh
├── lib/                      # Thư viện phụ trợ & kết nối Gemini
├── frontend/                 # Tài nguyên webview tĩnh
└── src-tauri/                # Toàn bộ mã nguồn Rust / Tauri v2
```

---

## 📄 Bản quyền & Lời cảm ơn

- Phát hành theo giấy phép MIT.
- Được phát triển và nâng cấp dựa trên dự án gốc `dsh-whale-widget`.
