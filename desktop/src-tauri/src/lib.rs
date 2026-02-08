#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  use std::process::{Command, Child};
  use std::sync::Mutex;
  use tauri::State;

  struct BackendState(Mutex<Option<Child>>);

  #[tauri::command]
  async fn start_backend(state: State<'_, BackendState>) -> Result<String, String> {
    // Find free port
    let port = find_free_port().await;

    // Spawn backend
    let child = Command::new("./resources/pyyomi-backend")
        .args(["--port", &port.to_string(), "--data-dir", "./data"])
        .spawn()
        .map_err(|e| e.to_string())?;

    *state.0.lock().unwrap() = Some(child);

    // Poll health endpoint
    wait_for_ready(port).await;

    Ok(format!("http://127.0.0.1:{}", port))
  }

  #[tauri::command]
  async fn backend_url(state: State<'_, BackendState>) -> Result<String, String> {
    // Return stored URL
    Ok("http://127.0.0.1:PORT".to_string())
  }

  #[tauri::command]
  async fn stop_backend(state: State<'_, BackendState>) -> Result<(), String> {
    if let Some(mut child) = state.0.lock().unwrap().take() {
      child.kill().map_err(|e| e.to_string())?;
    }
    Ok(())
  }

  async fn find_free_port() -> u16 {
    use portpicker::pick_unused_port;
    pick_unused_port().expect("Failed to find free port")
  }

  async fn wait_for_ready(port: u16) {
    use reqwest::Client;
    let client = Client::new();
    for _ in 0..30 {
      match client.get(&format!("http://127.0.0.1:{}/health", port)).send().await {
        Ok(response) if response.status().is_success() => return,
        _ => tokio::time::sleep(tokio::time::Duration::from_millis(500)).await,
      }
    }
    panic!("Backend failed to start");
  }

  tauri::Builder::default()
    .manage(BackendState(Mutex::new(None)))
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
