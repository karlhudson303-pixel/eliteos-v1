#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::fs::File;
use std::io::{Write, Read};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_log;

// ======================================================
// DATA STORAGE COMMANDS
// ======================================================

#[tauri::command]
fn ensure_data_folder(app: AppHandle) -> Result<String, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e: tauri::Error| e.to_string())?;

    if !dir.exists() {
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }

    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
fn save_data(app: AppHandle, path: String, data: String) -> Result<(), String> {
    let mut file_path = app
        .path()
        .app_data_dir()
        .map_err(|e: tauri::Error| e.to_string())?;

    file_path.push(path);

    fs::write(file_path, data).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_data(app: AppHandle, path: String) -> Result<String, String> {
    let mut file_path = app
        .path()
        .app_data_dir()
        .map_err(|e: tauri::Error| e.to_string())?;

    file_path.push(path);

    if !file_path.exists() {
        return Ok("".to_string());
    }

    let contents = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
    Ok(contents)
}

// ======================================================
// SCREENSHOT STORAGE
// ======================================================

fn screenshot_folder(app: &AppHandle) -> PathBuf {
    let mut base = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");

    base.push("screenshots");

    if !base.exists() {
        fs::create_dir_all(&base).expect("Failed to create screenshot folder");
    }

    base
}

#[tauri::command]
fn save_screenshot(app: AppHandle, trade_id: String, filename: String, bytes: Vec<u8>) -> Result<String, String> {
    let mut folder = screenshot_folder(&app);

    let final_name = format!("{}_{}", trade_id, filename);
    folder.push(&final_name);

    let mut file = File::create(&folder).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;

    Ok(final_name)
}

#[tauri::command]
fn load_screenshot(app: AppHandle, filename: String) -> Result<String, String> {
    let mut folder = screenshot_folder(&app);
    folder.push(&filename);

    let mut file = File::open(&folder).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

    let encoded = base64::encode(buffer);
    Ok(format!("data:image/*;base64,{}", encoded))
}

#[tauri::command]
fn delete_screenshot(app: AppHandle, filename: String) -> Result<(), String> {
    let mut folder = screenshot_folder(&app);
    folder.push(&filename);

    fs::remove_file(&folder).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn list_screenshots(app: AppHandle) -> Result<Vec<String>, String> {
    let folder = screenshot_folder(&app);

    let mut files = Vec::new();
    for entry in fs::read_dir(folder).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                files.push(name.to_string());
            }
        }
    }

    Ok(files)
}

#[tauri::command]
fn screenshot_stats(app: AppHandle) -> Result<(usize, u64), String> {
    let folder = screenshot_folder(&app);

    let mut count = 0;
    let mut total_size = 0;

    for entry in fs::read_dir(folder).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;

        if metadata.is_file() {
            count += 1;
            total_size += metadata.len();
        }
    }

    Ok((count, total_size))
}

// ======================================================
// TAURI APP BOOTSTRAP
// ======================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ensure_data_folder,
            save_data,
            load_data,
            save_screenshot,
            load_screenshot,
            delete_screenshot,
            list_screenshots,
            screenshot_stats
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}