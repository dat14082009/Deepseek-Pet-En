<div align="right">
  🌐 <a href="README.md">English</a> | <strong>Tiếng Việt</strong>
</div>

# 🐋 DeepSeek-Pet-En (Tiện ích DeepSeek Chibi trên Desktop)

![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)

Đây là phiên bản ứng dụng overlay trên màn hình máy tính được làm lại từ dự án `dsh-whale-widget` bản tiếng Anh, mang cô bé **DeepSeek anime chibi (DSniang)** vô cùng đáng yêu lên ngay màn hình của bạn! 

Ứng dụng độc lập này chạy dưới dạng không viền, nền trong suốt và luôn hiển thị trên cùng (always-on-top). Nó hỗ trợ tính năng click xuyên thấu (click-through) đối với các vùng nền trong suốt, đảm bảo cô bé luôn ở bên bạn mà không làm gián đoạn công việc.

---

## ✨ Tính năng nổi bật

- **🖥️ Tiện ích Overlay thực thụ**: Nền hoàn toàn trong suốt, không có viền cửa sổ hay khung trình duyệt — chỉ có nhân vật chibi, bong bóng thoại và menu trôi lơ lửng một cách tinh tế trên màn hình của bạn.
- **🖱️ Hỗ trợ Click xuyên thấu**: Bấm vào bất kỳ đâu bên ngoài nhân vật hoặc menu sẽ tác động thẳng vào màn hình Desktop hoặc các ứng dụng đang mở bên dưới.
- **📌 Luôn hiển thị trên cùng**: Ghim luôn hiển thị phía trên tất cả các cửa sổ đang mở để "người bạn đồng hành" của bạn luôn hiện diện.
- **🖐️ Kéo thả & Gắn cạnh màn hình**: Nhấn và kéo chibi đi bất cứ đâu trên màn hình; cô bé sẽ tự động bám dính, đổi chiều khi chạm viền màn hình và luôn ghi nhớ vị trí cuối cùng.
- **⚙️ Tích hợp System Tray**: Click chuột phải vào biểu tượng chibi ở khay hệ thống (góc dưới bên phải màn hình Windows) để nhanh chóng Hiện/Ẩn, Đặt lại vị trí, hoặc Thoát.
- **🎮 Trải nghiệm tương tác đầy đủ**: Bao gồm các bong bóng hội thoại, hiệu ứng vuốt ve (`rua.gif`), hiệu ứng âm thanh, menu cài đặt, theo dõi số dư API và quản lý vai trò.

## 📥 Hướng dẫn Cài đặt

1. Truy cập trang [Releases](../../releases) của kho lưu trữ này.
2. Tải xuống file `.zip` mới nhất từ bản phát hành (release) gần nhất.
3. Giải nén file vừa tải vào một thư mục bất kỳ trên máy tính của bạn.
4. Vậy là xong! Không cần cài đặt thêm phần mềm nào khác.

## 🚀 Cách chạy ứng dụng

Rất đơn giản! Sau khi giải nén, bạn có thể mở ứng dụng bằng một trong các cách sau:

- **Cách 1:** Nhấn đúp chuột vào file `DeepSeekWhaleWidget.exe` *(Khuyên dùng)*
- **Cách 2:** Nhấn đúp chuột vào file `run-overlay.bat`
- **Cách 3:** Chạy lệnh `npm start` trong PowerShell hoặc terminal (yêu cầu máy đã cài Node.js)

## 🛠️ Build từ Mã nguồn

Nếu bạn muốn chỉnh sửa mã nguồn hoặc tự build lại file chạy (launcher) C#, bạn có thể thực hiện bằng script PowerShell có sẵn:

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

## 🤝 Lời cảm ơn

- Dựa trên mã nguồn gốc của dự án `dsh-whale-widget`.

