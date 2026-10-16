const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

const getDbFilePath = () => path.join(app.getPath('userData'), 'lglm_database.json');

// File persistence IPC handlers
ipcMain.handle('read-db', () => {
  try {
    const dbPath = getDbFilePath();
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading db from disk:', e);
  }
  return null;
});

ipcMain.handle('write-db', (event, data) => {
  try {
    const dbPath = getDbFilePath();
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing db to disk:', e);
    return false;
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    frame: false, // Disables standard window borders to let our polished React header shine!
    icon: path.join(__dirname, 'src/assets/images/logo_desktop_1782417247790.jpg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const indexPath = path.join(__dirname, 'dist/index.html');
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  if (isDev) {
    // In development mode, load our local Vite server with fallback
    mainWindow.loadURL('http://localhost:3000').catch((err) => {
      console.log('Dev server not running at http://localhost:3000, caught error');
    });
  } else {
    // In production mode or when dist exists, load the bundled static files
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  // Fallback in case localhost fails or stays blank
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL && validatedURL.includes('localhost:3000')) {
      console.log('Failed to load localhost:3000, falling back to dist/index.html...');
      if (fs.existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
      }
    }
  });

  // Open standard HTTPS links in the user's default browser instead of Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });


  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Native window controls event bus
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(() => {
  // Disable native Electron application menu bar
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

