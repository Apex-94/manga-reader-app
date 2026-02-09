#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use std::fs::File;
    use std::path::PathBuf;
    use std::process::{Command, Child, Stdio};
    use std::sync::Mutex;
    use tauri::Manager;
    use tauri::State;

    struct BackendState(Mutex<Option<Child>>, Mutex<Option<u16>>, Mutex<PathBuf>);

    // Get data directory using Tauri API
    fn get_data_dir(app: &tauri::AppHandle) -> PathBuf {
        let path = app.path();
        if let Ok(data_dir) = path.data_dir() {
            data_dir
        } else {
            // Fallback to ./data relative to current exe location
            if let Ok(exe_path) = app.path().resource_dir() {
                exe_path.join("data")
            } else {
                PathBuf::from("./data")
            }
        }
    }

    #[tauri::command]
    async fn start_backend(app: tauri::Window<tauri::Wry>, state: State<'_, BackendState>) -> Result<String, String> {
        let app_handle = app.app_handle();
        let data_dir = get_data_dir(&app_handle);
        
        // Store data directory
        *state.2.lock().unwrap() = data_dir.clone();
        
        // Create data directory if it doesn't exist
        let _ = std::fs::create_dir_all(&data_dir);
        
        let log_file_path = data_dir.join("backend.log");
        
        // Create log file
        let log_file = match File::create(&log_file_path) {
            Ok(f) => f,
            Err(e) => {
                let error_msg = format!("Failed to create log file: {}", e);
                return Err(error_msg);
            }
        };

        // Find free port
        let port = find_free_port().await;

        // Spawn backend with stdout/stderr redirected to log file
        let child = match Command::new("./resources/pyyomi-backend")
            .args(["--port", &port.to_string(), "--data-dir", &data_dir.to_string_lossy()])
            .stdout(Stdio::from(log_file.try_clone().unwrap()))
            .stderr(Stdio::from(log_file))
            .spawn() {
            Ok(child) => {
                child
            }
            Err(e) => {
                let error_msg = format!("Failed to spawn backend: {}", e);
                return Err(error_msg);
            }
        };

        // Store child process and port
        *state.0.lock().unwrap() = Some(child);
        *state.1.lock().unwrap() = Some(port);

        // Poll health endpoint
        match wait_for_ready(port).await {
            Ok(_) => {}
            Err(e) => {
                let error_msg = format!("Backend health check failed: {}", e);
                return Err(error_msg);
            }
        }

        Ok(format!("http://127.0.0.1:{}", port))
    }

    #[tauri::command]
    async fn backend_url(state: State<'_, BackendState>) -> Result<String, String> {
        // Return stored URL
        if let Some(port) = state.1.lock().unwrap().as_ref() {
            Ok(format!("http://127.0.0.1:{}", port))
        } else {
            Err("Backend not started".to_string())
        }
    }

    #[tauri::command]
    async fn get_backend_logs(state: State<'_, BackendState>) -> Result<String, String> {
        // Get log file path from stored data directory
        let data_dir = state.2.lock().unwrap().clone();
        let log_file_path = data_dir.join("backend.log");
        
        match std::fs::read_to_string(&log_file_path) {
            Ok(content) => Ok(content),
            Err(_) => Ok(String::from("No logs available")),
        }
    }

    #[tauri::command]
    async fn stop_backend(state: State<'_, BackendState>) -> Result<(), String> {
        if let Some(mut child) = state.0.lock().unwrap().take() {
            let _ = child.kill();
        }
        Ok(())
    }

    async fn find_free_port() -> u16 {
        use portpicker::pick_unused_port;
        pick_unused_port().expect("Failed to find free port")
    }

    async fn wait_for_ready(port: u16) -> Result<(), String> {
        use reqwest::Client;
        let client = Client::new();
        
        for _ in 0..60 {
            match client.get(&format!("http://127.0.0.1:{}/health", port)).send().await {
                Ok(response) if response.status().is_success() => {
                    return Ok(());
                }
                _ => {}
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }
        
        Err("Backend failed to start after 60 attempts".to_string())
    }

    tauri::Builder::default()
        .manage(BackendState(Mutex::new(None), Mutex::new(None), Mutex::new(PathBuf::from("./data"))))
        .invoke_handler(tauri::generate_handler![
            start_backend,
            backend_url,
            get_backend_logs,
            stop_backend
        ])
        .setup(|app| {
            // Create data directory
            let app_handle = app.handle();
            let data_dir = get_data_dir(&app_handle);
            let _ = std::fs::create_dir_all(&data_dir);
            
            // Initialize devtools plugin
            #[cfg(debug_assertions)]
            {
                app.handle().plugin(tauri_plugin_devtools::init())?;
            }
            
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
