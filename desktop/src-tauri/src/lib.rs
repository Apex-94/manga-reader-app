  #[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  use std::process::{Command, Child};
  use std::sync::Mutex;
  use tauri::State;

  struct BackendState(Mutex<Option<Child>>, Mutex<Option<u16>>);

  #[tauri::command]
  async fn start_backend(state: State<'_, BackendState>) -> Result<String, String> {
    println!("[Tauri] Starting backend...");
    
    // Find free port
    let port = find_free_port().await;
    println!("[Tauri] Found free port: {}", port);

    // Spawn backend with better error handling
    let child = match Command::new("./resources/pyyomi-backend")
        .args(["--port", &port.to_string(), "--data-dir", "./data"])
        .spawn() {
        Ok(child) => {
            println!("[Tauri] Backend process spawned with PID: {:?}", child.id());
            child
        }
        Err(e) => {
            let error_msg = format!("Failed to spawn backend: {}", e);
            println!("[Tauri] ERROR: {}", error_msg);
            return Err(error_msg);
        }
    };

    // Store child process and port
    *state.0.lock().unwrap() = Some(child);
    *state.1.lock().unwrap() = Some(port);

    // Poll health endpoint with better logging
    println!("[Tauri] Waiting for backend to be ready...");
    match wait_for_ready(port).await {
        Ok(_) => {
            println!("[Tauri] Backend is ready at http://127.0.0.1:{}", port);
        }
        Err(e) => {
            let error_msg = format!("Backend health check failed: {}", e);
            println!("[Tauri] ERROR: {}", error_msg);
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
      println!("[Tauri] Stopping backend...");
      match child.kill() {
        Ok(_) => println!("[Tauri] Backend stopped"),
        Err(e) => println!("[Tauri] Failed to stop backend: {}", e),
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
    println!("[Tauri] Checking backend health at http://127.0.0.1:{}/health", port);
    
    for attempt in 0..30 {
      match client.get(&format!("http://127.0.0.1:{}/health", port)).send().await {
        Ok(response) if response.status().is_success() => {
          println!("[Tauri] Health check successful (attempt {}/30)", attempt + 1);
          return Ok(());
        }
        Ok(response) => {
          println!("[Tauri] Health check returned non-success status: {} (attempt {}/30)", response.status(), attempt + 1);
        }
        Err(e) => {
          println!("[Tauri] Health check failed (attempt {}/30): {}", attempt + 1, e);
        }
      }
      tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }
    
    let error_msg = format!("Backend failed to start after 30 attempts");
    println!("[Tauri] ERROR: {}", error_msg);
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
