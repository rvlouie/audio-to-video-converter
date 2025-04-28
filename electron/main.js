const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');

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

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

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