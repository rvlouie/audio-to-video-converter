# Audio to Video Converter

An Electron + Svelte application to batch convert audio files into video MP4s with custom templates.

## Setup

   ```bash
   npm install
   brew install ffmpeg


   npm run dev
   npm run build
   npx electron-builder

## Usage

Drag & drop audio files/folders onto the app window.

Select a template or create a custom one.

Click Convert to MP4.

Videos will be saved to your Desktop in the specified folder.