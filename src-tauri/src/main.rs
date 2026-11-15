#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::channel;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WebviewWindow,
};
use url::Url;

#[cfg(windows)]
#[repr(C)]
struct POINT {
    x: i32,
    y: i32,
}

#[cfg(windows)]
#[link(name = "user32")]
extern "system" {
    fn GetCursorPos(lpPoint: *mut POINT) -> i32;
}

static FULLSCREEN_MODE: AtomicBool = AtomicBool::new(false);
static CHIBI_VISIBLE: AtomicBool = AtomicBool::new(true);
static IS_IGNORING_MOUSE: AtomicBool = AtomicBool::new(true);
static DRAG_OFFSET: Mutex<Option<(i32, i32)>> = Mutex::new(None);

struct ServerState {
    child: Arc<Mutex<Option<Child>>>,
}

#[tauri::command]
fn set_ignore_mouse(window: WebviewWindow, ignore: bool) -> Result<(), String> {
    IS_IGNORING_MOUSE.store(ignore, Ordering::SeqCst);
    window.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_fullscreen_mode() -> bool {
    FULLSCREEN_MODE.load(Ordering::SeqCst)
}

#[tauri::command]
fn set_fullscreen_mode(window: WebviewWindow, enabled: bool) -> Result<(), String> {
    FULLSCREEN_MODE.store(enabled, Ordering::SeqCst);
    if enabled {
        if let Ok(Some(monitor)) = window.current_monitor() {
            let size = monitor.size();
            let _ = window.set_size(tauri::Size::Physical(*size));
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: 0, y: 0 }));
        }
    } else {
        if let Ok(Some(monitor)) = window.current_monitor() {
            let screen_size = monitor.size();
            let scale = monitor.scale_factor();
            let win_w = (520.0 * scale) as i32;
            let win_h = (480.0 * scale) as i32;
            let x = (screen_size.width as i32) - win_w;
            let y = (screen_size.height as i32) - win_h - 40;
            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: win_w as u32, height: win_h as u32 }));
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
        }
    }

    // Persist fullScreen mode to overlay-config.json
    let local_app_data = env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\Users\\admin\\AppData\\Local".into());
    let config_path = PathBuf::from(local_app_data).join("DeepSeekWhaleStandalone").join("overlay-config.json");
    if let Ok(content) = std::fs::read_to_string(&config_path) {
        if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(&content) {
            json["fullScreen"] = serde_json::json!(enabled);
            let _ = std::fs::write(&config_path, json.to_string());
        }
    }

    let _ = window.emit("fullscreen-mode-changed", serde_json::json!({ "fullScreen": enabled }));
    Ok(())
}

#[tauri::command]
fn start_compact_drag(window: WebviewWindow) -> Result<(), String> {
    let mut pt = POINT { x: 0, y: 0 };
    #[cfg(windows)]
    unsafe { GetCursorPos(&mut pt); }
    if let Ok(pos) = window.outer_position() {
        let mut lock = DRAG_OFFSET.lock().unwrap();
        *lock = Some((pt.x - pos.x, pt.y - pos.y));
    }
    Ok(())
}

#[tauri::command]
fn compact_drag(window: WebviewWindow) -> Result<(), String> {
    let mut pt = POINT { x: 0, y: 0 };
    #[cfg(windows)]
    unsafe { GetCursorPos(&mut pt); }
    let lock = DRAG_OFFSET.lock().unwrap();
    if let Some((off_x, off_y)) = *lock {
        let new_x = pt.x - off_x;
        let new_y = pt.y - off_y;
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: new_x, y: new_y }));
    }
    Ok(())
}

#[tauri::command]
fn stop_compact_drag(window: WebviewWindow) -> Result<(), String> {
    let mut lock = DRAG_OFFSET.lock().unwrap();
    *lock = None;
    if let Ok(pos) = window.outer_position() {
        let local_app_data = env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\Users\\admin\\AppData\\Local".into());
        let config_path = PathBuf::from(local_app_data).join("DeepSeekWhaleStandalone").join("overlay-config.json");
        if let Ok(content) = std::fs::read_to_string(&config_path) {
            if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(&content) {
                json["compactX"] = serde_json::json!(pos.x);
                json["compactY"] = serde_json::json!(pos.y);
                let _ = std::fs::write(&config_path, json.to_string());
            }
        }
    }
    Ok(())
}

fn find_app_dir() -> PathBuf {
    if let Ok(exe) = env::current_exe() {
        if let Some(dir) = exe.parent() {
            if dir.join("server.mjs").exists() {
                return dir.to_path_buf();
            }
            if let Some(p) = dir.parent() {
                if let Some(p2) = p.parent() {
                    if p2.join("server.mjs").exists() {
                        return p2.to_path_buf();
                    }
                }
            }
        }
    }
    env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

fn start_backend_server(app_dir: &Path) -> (Option<Child>, std::sync::mpsc::Receiver<u16>) {
    let (tx, rx) = channel();

    let bundled_node = app_dir.join("runtime").join("node.exe");
    let node_bin = if bundled_node.exists() {
        bundled_node
    } else {
        PathBuf::from("node")
    };

    let server_script = app_dir.join("server.mjs");
    if !server_script.exists() {
        eprintln!("server.mjs not found at: {:?}", server_script);
        return (None, rx);
    }

    let local_app_data = env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\Users\\admin\\AppData\\Local".into());
    let data_dir = PathBuf::from(local_app_data).join("DeepSeekWhaleStandalone");
    let _ = std::fs::create_dir_all(&data_dir);

    #[cfg(windows)]
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut cmd = Command::new(&node_bin);
    cmd.arg("server.mjs")
        .current_dir(app_dir)
        .env("DSHW_PORT", "0")
        .env("DSH_HOME", data_dir)
        .env("DSHW_OVERLAY", "1")
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit());

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    match cmd.spawn() {
        Ok(mut child) => {
            let stdout = child.stdout.take();
            std::thread::spawn(move || {
                if let Some(out) = stdout {
                    let reader = BufReader::new(out);
                    for line in reader.lines().flatten() {
                        let trimmed = line.trim();
                        if trimmed.is_empty() {
                            continue;
                        }
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(trimmed) {
                            if val.get("ok").and_then(|v| v.as_bool()) == Some(true) {
                                if let Some(p) = val.get("port").and_then(|v| v.as_u64()) {
                                    let _ = tx.send(p as u16);
                                    break;
                                }
                            }
                        }
                    }
                }
            });
            (Some(child), rx)
        }
        Err(e) => {
            eprintln!("Failed to spawn backend server: {}", e);
            (None, rx)
        }
    }
}

fn main() {
    let server_child = Arc::new(Mutex::new(None));
    let server_child_clone = server_child.clone();

    tauri::Builder::default()
        .manage(ServerState {
            child: server_child,
        })
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("ensure-visible", ());
            }
        }))
        .setup(move |app| {
            let app_dir = find_app_dir();
            let (child_opt, port_rx) = start_backend_server(&app_dir);

            if let Some(child) = child_opt {
                if let Ok(mut lock) = server_child_clone.lock() {
                    *lock = Some(child);
                }
            }

            let window = app.get_webview_window("main").unwrap();

            // Read overlay-config.json
            let local_app_data = env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\Users\\admin\\AppData\\Local".into());
            let config_path = PathBuf::from(local_app_data)
                .join("DeepSeekWhaleStandalone")
                .join("overlay-config.json");

            let is_fullscreen = if let Ok(data) = std::fs::read_to_string(&config_path) {
                serde_json::from_str::<serde_json::Value>(&data)
                    .ok()
                    .and_then(|v| v.get("fullScreen").and_then(|f| f.as_bool()))
                    .unwrap_or(false)
            } else {
                false
            };

            FULLSCREEN_MODE.store(is_fullscreen, Ordering::SeqCst);

            if is_fullscreen {
                if let Ok(Some(monitor)) = window.current_monitor() {
                    let size = monitor.size();
                    let _ = window.set_size(tauri::Size::Physical(*size));
                    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: 0, y: 0 }));
                }
            } else {
                if let Ok(Some(monitor)) = window.current_monitor() {
                    let screen_size = monitor.size();
                    let scale = monitor.scale_factor();
                    let win_w = (520.0 * scale) as i32;
                    let win_h = (480.0 * scale) as i32;
                    let x = (screen_size.width as i32) - win_w;
                    let y = (screen_size.height as i32) - win_h - 40;
                    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: win_w as u32, height: win_h as u32 }));
                    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
                }
            }

            // Start with ignore cursor events true so transparent areas don't block desktop
            let _ = window.set_ignore_cursor_events(true);
            IS_IGNORING_MOUSE.store(true, Ordering::SeqCst);

            // Asynchronously navigate when backend server port is received
            let win_clone = window.clone();
            std::thread::spawn(move || {
                if let Ok(port) = port_rx.recv_timeout(Duration::from_secs(10)) {
                    if let Ok(url) = Url::parse(&format!("http://127.0.0.1:{}/", port)) {
                        let _ = win_clone.navigate(url);
                    }
                }
            });

            // Global cursor ping thread to allow hover detection even when window is ignoring cursor events
            let win_cursor = window.clone();
            std::thread::spawn(move || {
                let mut last_x = -1;
                let mut last_y = -1;
                loop {
                    std::thread::sleep(Duration::from_millis(25));
                    let mut pt = POINT { x: 0, y: 0 };
                    #[cfg(windows)]
                    unsafe {
                        if GetCursorPos(&mut pt) != 0 {
                            if pt.x != last_x || pt.y != last_y {
                                last_x = pt.x;
                                last_y = pt.y;
                                let is_fs = FULLSCREEN_MODE.load(Ordering::SeqCst);
                                let (cx, cy) = if is_fs {
                                    (pt.x, pt.y)
                                } else {
                                    if let Ok(pos) = win_cursor.outer_position() {
                                        (pt.x - pos.x, pt.y - pos.y)
                                    } else {
                                        (pt.x, pt.y)
                                    }
                                };
                                let _ = win_cursor.emit("global-cursor", serde_json::json!({
                                    "x": cx,
                                    "y": cy,
                                    "screenX": pt.x,
                                    "screenY": pt.y
                                }));
                            }
                        }
                    }
                }
            });

            // Setup System Tray
            let toggle_item = MenuItem::with_id(app, "toggle", "Hide Chibi to Background", true, None::<&str>)?;
            let fs_item = MenuItem::with_id(app, "fullscreen", "Toggle Full Screen Mode", true, None::<&str>)?;
            let reset_item = MenuItem::with_id(app, "reset", "Reset Position (Bottom-Right)", true, None::<&str>)?;
            let reload_item = MenuItem::with_id(app, "reload", "Reload Overlay", true, None::<&str>)?;
            let exit_item = MenuItem::with_id(app, "exit", "Exit Application", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[&toggle_item, &fs_item, &reset_item, &reload_item, &exit_item],
            )?;

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "toggle" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let cur = CHIBI_VISIBLE.load(Ordering::SeqCst);
                            if cur {
                                let _ = win.hide();
                                CHIBI_VISIBLE.store(false, Ordering::SeqCst);
                            } else {
                                let _ = win.show();
                                CHIBI_VISIBLE.store(true, Ordering::SeqCst);
                            }
                        }
                    }
                    "fullscreen" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let cur_fs = FULLSCREEN_MODE.load(Ordering::SeqCst);
                            let _ = set_fullscreen_mode(win, !cur_fs);
                        }
                    }
                    "reset" => {
                        if let Some(win) = app.get_webview_window("main") {
                            if let Ok(Some(monitor)) = win.current_monitor() {
                                let screen_size = monitor.size();
                                let scale = monitor.scale_factor();
                                let win_w = (520.0 * scale) as i32;
                                let win_h = (480.0 * scale) as i32;
                                let x = (screen_size.width as i32) - win_w;
                                let y = (screen_size.height as i32) - win_h - 40;
                                let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
                                let _ = win.eval("localStorage.removeItem('dshw-pos'); localStorage.removeItem('dshw-size'); location.reload();");
                            }
                        }
                    }
                    "reload" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.eval("window.location.reload()");
                        }
                    }
                    "exit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let cur = CHIBI_VISIBLE.load(Ordering::SeqCst);
                            if cur {
                                let _ = win.hide();
                                CHIBI_VISIBLE.store(false, Ordering::SeqCst);
                            } else {
                                let _ = win.show();
                                CHIBI_VISIBLE.store(true, Ordering::SeqCst);
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let state = window.state::<ServerState>();
                let mut lock = state.child.lock().unwrap();
                if let Some(mut child) = lock.take() {
                    let _ = child.kill();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            set_ignore_mouse,
            get_fullscreen_mode,
            set_fullscreen_mode,
            start_compact_drag,
            compact_drag,
            stop_compact_drag
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
