const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: require('path').join(__dirname, 'preload.cjs')
    }
  });
  win.webContents.on('console-message', (e, level, msg) => {
    console.log('CONSOLE:', msg);
  });
  win.loadFile('dist/index.html').then(() => {
    setTimeout(() => app.quit(), 2000);
  }).catch(err => {
    console.error('LOAD ERROR:', err);
    app.quit();
  });
});
