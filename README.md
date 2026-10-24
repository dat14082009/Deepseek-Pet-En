# 🐋 DeepSeek-Pet-En (DeepSeek Chibi Overlay)

![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)

A true desktop overlay port of the English `dsh-whale-widget`, bringing the adorable **DeepSeek anime girl chibi (DSniang)** right to your desktop! 

This standalone application renders as a borderless, transparent, always-on-top desktop companion. It fully supports click-through for transparent screen areas, ensuring she stays by your side without interrupting your workflow.

---

## ✨ Features

- **🖥️ True Desktop Overlay**: Transparent background with no window borders or browser frames — only the chibi character, speech bubbles, and menus appear floating elegantly on your desktop.
- **🖱️ Click-Through Support**: Clicking outside the chibi or menu clicks straight through to your desktop or background applications.
- **📌 Always on Top**: Stays above all open windows so your chibi companion is always visible.
- **🖐️ Draggable & Dockable**: Click and drag the chibi anywhere across your monitors; it automatically snaps and mirrors at screen edges and remembers its position.
- **⚙️ System Tray Integration**: Right-click the chibi icon in your Windows notification area (system tray) to quickly Show/Hide, Reset Position, or Exit.
- **🎮 Complete Interactive Experience**: Features speech bubbles, pet-pet interactions (`rua.gif`), audio effects, menu settings, API balance tracking, and role management.

## 📥 Installation

1. Go to the [Releases](../../releases) page of this repository.
2. Download the latest `.zip` file from the newest release.
3. Extract the downloaded archive to a folder of your choice on your computer.
4. You're all set! No additional installation steps are required.

## 🚀 How to Run

Getting started is simple! After extracting the files, you can launch the overlay using any of the following methods:

- **Option 1:** Double-click `DeepSeekWhaleWidget.exe` *(Recommended)*
- **Option 2:** Double-click `run-overlay.bat`
- **Option 3:** Run `npm start` in your PowerShell or terminal (requires Node.js)

## 🛠️ Build from Source

If you wish to modify the code or rebuild the C# launcher executable, you can do so by running the provided PowerShell build script:

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1