const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;
let backendProcess;
let frontendProcess;
const isDev = process.env.NODE_ENV === 'development';

// Find Python executable
function getPythonPath() {
  // Check common Python locations on Windows
  const pythonPaths = [
    'python',
    'python3',
    'py',
    path.join(os.homedir(), 'AppData/Local/Programs/Python/python314/python.exe'),
    path.join(os.homedir(), 'AppData/Local/Programs/Python/Python314/python.exe'),
  ];
  return pythonPaths[0]; // Return first available
}

// Find backend venv Python
function getBackendPython() {
  // Get base directory - could be unpacked or in asar
  const baseDir = path.join(__dirname, '..', '..');
  const venvPath = path.join(baseDir, 'backend', 'venv', 'Scripts', 'python.exe');
  const altVenvPath = path.join(baseDir, 'backend', '.venv', 'Scripts', 'python.exe');
  const devVenvPath = path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe');
  
  if (fs.existsSync(venvPath)) return venvPath;
  if (fs.existsSync(altVenvPath)) return altVenvPath;
  if (fs.existsSync(devVenvPath)) return devVenvPath;
  return 'python';
}

function startBackend() {
  return new Promise((resolve) => {
    const baseDir = path.join(__dirname, '..', '..');
    const backendDir = path.join(baseDir, 'backend');
    const pythonPath = getBackendPython();
    
    console.log('Starting backend with Python:', pythonPath);
    
    backendProcess = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'], {
      cwd: backendDir,
      stdio: 'pipe',
      shell: true
    });

    let started = false;

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Backend:', output);
      if (output.includes('Started server process') && !started) {
        started = true;
        resolve(true);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('Backend Error:', data.toString());
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      resolve(false);
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!started) {
        console.log('Backend startup timeout, proceeding anyway...');
        resolve(true);
      }
    }, 15000);
  });
}

function startFrontend() {
  return new Promise((resolve) => {
    const baseDir = path.join(__dirname, '..', '..');
    const frontendDir = path.join(baseDir, 'frontend');
    
    console.log('Starting frontend...');
    
    // Check if dist folder exists in bundled resources
    const distPath = path.join(__dirname, 'frontend', 'dist');
    if (fs.existsSync(distPath)) {
      console.log('Using bundled frontend dist...');
      // For bundled mode, serve the dist folder
      startStaticServer(path.join(__dirname, 'frontend', 'dist'), 3000).then(resolve);
      return;
    }
    const nodeModulesPath = path.join(frontendDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('Installing frontend dependencies...');
      const installProcess = spawn('npm', ['install'], {
        cwd: frontendDir,
        stdio: 'inherit',
        shell: true
      });
      
      installProcess.on('close', (code) => {
        if (code === 0) {
          startFrontendDev(resolve);
        } else {
          resolve(false);
        }
      });
    } else {
      startFrontendDev(resolve);
    }
  });
}

function startFrontendDev(resolve) {
  const frontendDir = path.join(__dirname, '..', 'frontend');
  
  frontendProcess = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '3000'], {
    cwd: frontendDir,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, BROWSER: 'none' }
  });

  let started = false;

  frontendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Frontend:', output);
    if (output.includes('Local:') && !started) {
      started = true;
      resolve(true);
    }
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error('Frontend Error:', data.toString());
  });

  frontendProcess.on('error', (err) => {
    console.error('Failed to start frontend:', err);
    resolve(false);
  });

  // Timeout after 30 seconds
  setTimeout(() => {
    if (!started) {
      console.log('Frontend startup timeout, proceeding anyway...');
      resolve(true);
    }
  }, 30000);
}

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Simple static file server
function startStaticServer(dir, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(500);
            res.end('Server Error');
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`Static server running at http://localhost:${port}`);
      resolve(true);
    });
    
    // Store server reference for cleanup
    frontendProcess = { kill: () => server.close() };
  });
}

async function createWindow() {
  // Wait for services to start
  console.log('Starting services...');
  
  await startBackend();
  console.log('Backend started');
  process.env.PYYOMI_BACKEND_URL = 'http://localhost:8000';
  
  await startFrontend();
  console.log('Frontend started');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'desktop', 'src-tauri', 'icons', 'icon.ico'),
    show: false,
    backgroundColor: '#1a1a2e'
  });

  mainWindow.setMenuBarVisibility(false);

  // Load the frontend
  const frontendUrl = 'http://localhost:3000';
  console.log('Loading:', frontendUrl);
  
  mainWindow.loadURL(frontendUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
  // Kill frontend process
  if (frontendProcess) {
    frontendProcess.kill('SIGTERM');
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.on('get-app-path', (event) => {
  event.reply('app-path', app.getAppPath());
});

ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit(0);
});
