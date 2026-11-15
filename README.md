<div align="right">
  🌐 <strong>English</strong> | <a href="README_vi.md">Tiếng Việt</a>
</div>

# 🐋 DeepSeek-Pet (Rust / Tauri v2 Desktop Overlay)

![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)
![Tech Stack](https://img.shields.io/badge/backend-Rust%20%7C%20Tauri%20v2-orange.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

<img src="Banner.png" alt="DeepSeek Chibi Banner" width="100%">

A high-performance, lightweight, borderless transparent desktop companion featuring the adorable **DeepSeek anime chibi mascot**—now fully rewritten with **Rust and Tauri v2**!

She stays floating on your desktop with zero obstructive window borders, provides click-through for transparent screen areas, tracks your DeepSeek API token balance, and lets you chat in real-time with an intelligent AI personality powered by Google Gemini.

---

## ⚡ What's New in the Rust / Tauri v2 Version

- **🚀 75% Less RAM Usage**: Idle memory footprint dropped from ~120MB+ (Electron) down to **~35MB**!
- **⚡ Zero Startup Lag**: Replaced bulky Chromium with native Windows **WebView2** and compiled Rust binaries. Instant startup with ~0% idle CPU consumption.
- **🦀 Native Windows Win32 Hit-Testing**: Rust background thread monitors cursor coordinates (`GetCursorPos`) to dynamically switch between click-through and interaction, eliminating sticky clicks.
- **🔒 Native Single-Instance Lock**: Prevents duplicate running instances natively. Launching the `.exe` again brings the existing mascot to focus immediately.
- **📦 Clean & Compact (~130 MB)**: Standalone portable directory without requiring external package installations.

---

## ✨ Core Features

- **🖥️ True Desktop Overlay**: Rendered on a transparent canvas with no window frames, title bars, or taskbar clutter. Only the mascot, speech bubbles, and menus float over your desktop.
- **💬 Live AI Chat via Google Gemini**: Click the speech bubble at any time to chat. DeepSeek replies concisely, warmly, and cleverly with cute expressions and emojis.
- **🌐 One-Click Bilingual Switcher**: Seamlessly toggle between **English 🇺🇸** and **Tiếng Việt 🇻🇳** directly in the settings menu. All UI elements, random thoughts, and accounting records update instantly.
- **📊 Usage Records & Real Balance Tracking**: Monitor token consumption, 7-day expense history, and local model estimates. Enter your DeepSeek API key to observe live token balance.
- **🖱️ Smart Mouse Click-Through**: Transparent regions pass mouse clicks straight through to underlying applications (browsers, games, code editors) without interruption.
- **🖐️ Draggable & Snapping**: Drag the chibi anywhere across your monitors; she automatically docks to screen edges and saves her position across restarts.
- **📐 Full Screen Mode vs Compact Hitbox**: Switch between a full-screen canvas and a small 520x480 hitbox directly from the settings or system tray.
- **⚙️ Windows System Tray Integration**: Left-click the tray icon to quickly show/hide, or right-click to access settings, toggle fullscreen, reset position to the bottom-right, or exit.
- **🎵 Sound Effects & Animations**: Head-patting interaction (`rua.gif`), audio feedback, and customizable thoughts.

---

## 🎮 Interactive Controls

| Action | Result |
| :--- | :--- |
| **Click 1 on Chibi** | Random thought bubble from DeepSeek (in current language). |
| **Click 2 on Chibi** | Check DeepSeek token & balance status. |
| **Click 3 on Chibi** | Dismiss bubble. |
| **Click Speech Bubble** | Open text input box to chat live with DeepSeek. |
| **Press Enter / Click Reply** | Send message to AI; DeepSeek replies within 1–2 short sentences. |
| **Right-Click Chibi / Hamburger Icon** | Open widget settings menu. |
| **Click Language Button** | Toggle between `🇻🇳 Tiếng Việt` and `🇺🇸 English`. |
| **Left-Click Tray Icon** | Show / Hide chibi instantly. |
| **Right-Click Tray Icon** | Context menu (Toggle Visibility, Full Screen, Reset Position, Reload, Exit). |

---

## 📥 Download & How to Run

1. Go to the [**Releases**](https://github.com/dat14082009/Deepseek-Pet-En/releases) page.
2. Download the latest release (`0.0.7.zip`).
3. Extract the `.zip` archive anywhere on your PC.
4. Double-click **`DeepSeekWhaleWidget.exe`** to launch immediately.
5. The chibi mascot will float into the bottom-right corner of your desktop!

---

## 🔑 API Keys Configuration

### 1. Google Gemini API Key (for Live AI Chat)
1. Right-click the chibi or click the menu button to open Settings.
2. In the **Google Gemini API Key** card at the top, paste your key from [Google AI Studio](https://aistudio.google.com/) (`AIza...`).
3. Click **Save**. The badge will show `✓ Connected`.
4. Click on DeepSeek's speech bubble and start chatting!

### 2. DeepSeek API Key (for Token Balance Check)
1. Open the menu and click **- = Usage Records = -**.
2. Under **DeepSeek API Key (Token Check)**, paste your DeepSeek API key (`sk-...`).
3. Click **Save**. DeepSeek will verify the key and display your balance and remaining tokens in the bubble on Click 2.

---

## 🛠️ Build from Source (Rust & Tauri v2)

If you want to modify or compile the Rust binary yourself:

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install) (GNU or MSVC toolchain)
- MinGW-w64 (if using `x86_64-pc-windows-gnu`)
- Node.js (for running bundled backend dependencies)

### Compile
```powershell
cd src-tauri
cargo build --release
```
The resulting executable will be generated at `src-tauri/target/release/dsh-whale-tauri.exe`. Copy it to the root directory as `DeepSeekWhaleWidget.exe`.

> 💡 **Tip:** After compiling, run `cargo clean` inside `src-tauri` to delete the ~4.9 GB temporary compiler cache.

---

## 📁 Directory Structure

```
dsh-whale-tauri/
├── DeepSeekWhaleWidget.exe   # Compiled native Rust application
├── WebView2Loader.dll        # Windows WebView2 runtime loader
├── server.mjs                # Local backend API server (runs hidden)
├── overlay.html              # Desktop transparent overlay UI
├── runtime/                  # Embedded Node.js runtime (node.exe)
├── assets/                   # Character sprites, audio, animations
├── lib/                      # Helper libraries & Gemini connector
├── frontend/                 # Static webview assets
└── src-tauri/                # Complete Rust / Tauri v2 source code
```

---

## 📄 License & Credits

- MIT License.
- Ported and enhanced from `dsh-whale-widget`.
