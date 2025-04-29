const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const isDev = !app.isPackaged;

// Set the path to the static ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

function createWindow() {

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  if (isDev) {
    // Dev: point at Vite’s dev server
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // Prod: load the built index.html
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  win.once('ready-to-show', () => {
    win.show();
  });

}

app.whenReady().then(() => {
  createWindow()
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('convert-files', async (event, { files, template }) => {
  const results = [];
  for (const file of files) {
    const { color, size, audioExt, outputFolder } = template;
    const filename = path.parse(file).name;
    const outputDir = path.join(app.getPath('desktop'), outputFolder);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const outputFile = path.join(outputDir, `${filename}.mp4`);
    try {
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(`color=c=${color}:s=${size}:d=10`)
          .inputFormat('lavfi')
          .input(file)
          .outputOptions([
            '-c:v libx264',
            '-preset veryslow',
            '-tune stillimage',
            '-crf 18',
            '-c:a aac',
            '-b:a 192k',
            '-movflags +faststart',
            '-shortest'
          ])
          .save(outputFile)
          .on('end', resolve)
          .on('error', reject);
      });
      results.push({ file, success: true });
    } catch (err) {
      results.push({ file, success: false, error: err.message });
    }
  }
  return results;
});

// paths to defaults and user‐saved templates
const defaultTemplatesPath = path.join(__dirname, '../templates/templates.json');
const userTemplatesPath = path.join(app.getPath('userData'), 'templates.json');

// helper to merge defaults + user templates
function loadTemplates() {
  let defaults = [];
  try { defaults = JSON.parse(fs.readFileSync(defaultTemplatesPath, 'utf-8')); } catch { }
  let userTpls = [];
  try { userTpls = JSON.parse(fs.readFileSync(userTemplatesPath, 'utf-8')); } catch { }
  return [...defaults, ...userTpls];
}

// return all templates
ipcMain.handle('get-templates', () => {
  return loadTemplates();
});

// append a new template to userTemplatesPath and return updated list
ipcMain.handle('save-template', (event, template) => {
  const userTpls = fs.existsSync(userTemplatesPath)
    ? JSON.parse(fs.readFileSync(userTemplatesPath, 'utf-8'))
    : [];
  userTpls.push(template);
  fs.writeFileSync(userTemplatesPath, JSON.stringify(userTpls, null, 2));
  return loadTemplates();
});