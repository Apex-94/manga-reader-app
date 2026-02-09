const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow;
let backendProcess;
let frontendProcess;

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const BROKEN_PIPE_PATTERN = /(BrokenPipeError|broken pipe|EPIPE)/i;

function isBrokenPipeError(value) {
  return BROKEN_PIPE_PATTERN.test(String(value || ''));
}

function getBackendDir() {
  const candidates = [
    path.join(process.resourcesPath || '', 'backend'),
    path.join(__dirname, '..', 'backend'),
    path.join(__dirname, '..', '..', 'backend'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[1];
}

function getBackendPython(backendDir) {
  const venvPath = path.join(backendDir, 'venv', 'Scripts', 'python.exe');
  const altVenvPath = path.join(backendDir, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPath)) return venvPath;
  if (fs.existsSync(altVenvPath)) return altVenvPath;
  return 'python';
}

function startBackend() {
  return new Promise((resolve) => {
    const backendDir = getBackendDir();
    const pythonPath = getBackendPython(backendDir);

    console.log('Starting backend with Python:', pythonPath);
    backendProcess = spawn(
      pythonPath,
      ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
      {
        cwd: backendDir,
        stdio: 'pipe',
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          PYYOMI_DISABLE_CONSOLE_LOG: '1',
        },
      }
    );

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
      const output = data.toString();
      if (isBrokenPipeError(output)) {
        console.warn('Backend stream warning ignored:', output.trim());
        return;
      }
      console.error('Backend Error:', output);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      resolve(false);
    });

    setTimeout(() => {
      if (!started) {
        console.log('Backend startup timeout, proceeding anyway...');
        resolve(true);
      }
    }, 15000);
  });
}

function findBundledFrontendDist() {
  const candidates = [
    path.join(process.resourcesPath || '', 'frontend', 'dist'),
    path.join(__dirname, 'frontend', 'dist'),
    path.join(path.dirname(app.getAppPath()), 'frontend', 'dist'),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function getDevFrontendDir() {
  const candidates = [
    path.join(__dirname, '..', '..', 'frontend'),
    path.join(__dirname, '..', 'frontend'),
  ];
  return candidates.find((p) => fs.existsSync(path.join(p, 'package.json')));
}

function startFrontend() {
  return new Promise((resolve) => {
    console.log('Starting frontend...');

    const distPath = findBundledFrontendDist();
    if (distPath) {
      console.log('Using bundled frontend dist:', distPath);
      startStaticServer(distPath, 3000).then(resolve);
      return;
    }

    const frontendDir = getDevFrontendDir();
    if (!frontendDir) {
      console.error('Frontend directory not found for development mode.');
      resolve(false);
      return;
    }

    const nodeModulesPath = path.join(frontendDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('Installing frontend dependencies...');
      const installProcess = spawn(npmCommand, ['install'], {
        cwd: frontendDir,
        stdio: 'inherit',
        shell: false,
        windowsHide: true,
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          startFrontendDev(frontendDir, resolve);
        } else {
          resolve(false);
        }
      });
      installProcess.on('error', (err) => {
        console.error('Failed to install frontend dependencies:', err);
        resolve(false);
      });
      return;
    }

    startFrontendDev(frontendDir, resolve);
  });
}

function startFrontendDev(frontendDir, resolve) {
  frontendProcess = spawn(npmCommand, ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '3000'], {
    cwd: frontendDir,
    stdio: 'pipe',
    shell: false,
    windowsHide: true,
    env: { ...process.env, BROWSER: 'none' },
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

  setTimeout(() => {
    if (!started) {
      console.log('Frontend startup timeout, proceeding anyway...');
      resolve(true);
    }
  }, 30000);
}

function startStaticServer(dir, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url || '/';
      if (reqPath === '/') reqPath = '/index.html';
      let filePath = path.join(dir, reqPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(dir, 'index.html');
      }

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
          res.writeHead(500);
          res.end('Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`Static server running at http://127.0.0.1:${port}`);
      resolve(true);
    });

    frontendProcess = {
      kill: () => server.close(),
    };
  });
}

async function createWindow() {
  console.log('Starting services...');
  const backendOk = await startBackend();
  console.log('Backend started:', backendOk);
  process.env.PYYOMI_BACKEND_URL = 'http://127.0.0.1:8000';

  const frontendOk = await startFrontend();
  console.log('Frontend started:', frontendOk);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '..', 'desktop', 'src-tauri', 'icons', 'icon.ico'),
    show: false,
    backgroundColor: '#1a1a2e',
  });

  mainWindow.setMenuBarVisibility(false);

  const frontendUrl = 'http://localhost:3000';
  console.log('Loading:', frontendUrl);
  mainWindow.loadURL(frontendUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

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
  if (backendProcess && typeof backendProcess.kill === 'function') {
    backendProcess.kill();
  }
  if (frontendProcess && typeof frontendProcess.kill === 'function') {
    frontendProcess.kill();
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

ipcMain.on('get-app-path', (event) => {
  event.reply('app-path', app.getAppPath());
});

ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

process.on('uncaughtException', (error) => {
  if (isBrokenPipeError(error?.message)) {
    console.warn('Suppressed uncaught broken-pipe exception:', error.message);
    return;
  }
  console.error('Uncaught exception in Electron main process:', error);
});

process.on('unhandledRejection', (reason) => {
  if (isBrokenPipeError(reason)) {
    console.warn('Suppressed unhandled broken-pipe rejection:', String(reason));
    return;
  }
  console.error('Unhandled rejection in Electron main process:', reason);
});
