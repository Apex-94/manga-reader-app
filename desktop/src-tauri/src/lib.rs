#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use std::fs::{File, OpenOptions};
    use std::io::{Write, BufWriter};
    use std::process::{Command, Child, Stdio};
    use std::sync::Mutex;
    use tauri::State;

    struct BackendState(Mutex<Option<Child>>, Mutex<Option<u16>>);

    // Log file path
    const LOG_FILE: &str = "./data/backend.log";

    // Helper function to log messages
    fn log_message(msg: &str) {
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let log_line = format!("[{}] {}\n", timestamp, msg);
        
        // Print to console
        println!("{}", log_line);
        
        // Write to log file
        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(LOG_FILE) 
        {
            let _ = file.write_all(log_line.as_bytes());
        }
    }

    #[tauri::command]
    async fn start_backend(state: State<'_, BackendState>) -> Result<String, String> {
        log_message("Starting backend...");
        
        // Create data directory if it doesn't exist
        let _ = std::fs::create_dir_all("./data");
        
        // Find free port
        let port = find_free_port().await;
        log_message(&format!("Found free port: {}", port));

        // Prepare log file for backend output
        let log_file = match File::create(LOG_FILE) {
            Ok(f) => f,
            Err(e) => {
                let error_msg = format!("Failed to create log file: {}", e);
                log_message(&format!("ERROR: {}", error_msg));
                return Err(error_msg);
            }
        };

        // Spawn backend with stdout/stderr redirected to log file
        let child = match Command::new("./resources/pyyomi-backend")
            .args(["--port", &port.to_string(), "--data-dir", "./data"])
            .stdout(Stdio::from(log_file.try_clone().unwrap()))
            .stderr(Stdio::from(log_file))
            .spawn() {
            Ok(child) => {
                log_message(&format!("Backend process spawned with PID: {:?}", child.id()));
                child
            }
            Err(e) => {
                let error_msg = format!("Failed to spawn backend: {}", e);
                log_message(&format!("ERROR: {}", error_msg));
                return Err(error_msg);
            }
        };

        // Store child process and port
        *state.0.lock().unwrap() = Some(child);
        *state.1.lock().unwrap() = Some(port);

        // Poll health endpoint with better logging
        log_message("Waiting for backend to be ready...");
        match wait_for_ready(port).await {
            Ok(_) => {
                log_message(&format!("Backend is ready at http://127.0.0.1:{}", port));
            }
            Err(e) => {
                let error_msg = format!("Backend health check failed: {}", e);
                log_message(&format!("ERROR: {}", error_msg));
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
    async fn stop_backend(state: State<'_, BackendState>) -> Result<(), String> {
        if let Some(mut child) = state.0.lock().unwrap().take() {
            log_message("Stopping backend...");
            match child.kill() {
                Ok(_) => log_message("Backend stopped"),
                Err(e) => log_message(&format!("Failed to stop backend: {}", e)),
            }
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
        log_message(&format!("Checking backend health at http://127.0.0.1:{}/health", port));
        
        for attempt in 0..60 {  // Increased to 60 attempts (30 seconds)
            match client.get(&format!("http://127.0.0.1:{}/health", port)).send().await {
                Ok(response) if response.status().is_success() => {
                    log_message(&format!("Health check successful (attempt {}/60)", attempt + 1));
                    return Ok(());
                }
                Ok(response) => {
                    log_message(&format!("Health check returned status: {} (attempt {}/60)", response.status(), attempt + 1));
                }
                Err(e) => {
                    log_message(&format!("Health check failed (attempt {}/60): {}", attempt + 1, e));
                }
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }
        
        let error_msg = format!("Backend failed to start after 60 attempts (30 seconds)");
        log_message(&format!("ERROR: {}", error_msg));
        Err(error_msg)
    }

    tauri::Builder::default()
        .manage(BackendState(Mutex::new(None), Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            start_backend,
            backend_url,
            stop_backend
        ])
        .setup(|app| {
            // Create data directory
            let _ = std::fs::create_dir_all("./data");
            
            // Clear old log file on startup
            let _ = std::fs::remove_file(LOG_FILE);
            
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
