const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

/**
 * Check if ffmpeg is available
 */
const checkFfmpeg = () => {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
};

/**
 * Get video metadata using ffprobe
 */
const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]);

    let output = '';
    proc.stdout.on('data', (data) => { output += data; });
    proc.on('error', () => resolve(null));
    proc.on('close', (code) => {
      if (code !== 0) return resolve(null);
      try {
        const metadata = JSON.parse(output);
        const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
        resolve({
          duration: parseFloat(metadata.format?.duration || 0),
          width: videoStream?.width || null,
          height: videoStream?.height || null,
          bitrate: parseInt(metadata.format?.bit_rate || 0),
          codec: videoStream?.codec_name || null
        });
      } catch {
        resolve(null);
      }
    });
  });
};

/**
 * Compress video for web use
 * Creates a lightweight version optimized for background videos
 */
const processVideo = async (filePath, originalFilename) => {
  const ext = path.extname(originalFilename).toLowerCase();
  const baseName = path.basename(originalFilename, ext);
  const dir = path.dirname(filePath);
  const variants = {};

  // Check if ffmpeg is available
  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    console.log('FFmpeg not available, skipping video processing');
    return { variants: {}, metadata: null };
  }

  // Get original metadata
  const metadata = await getVideoMetadata(filePath);
  if (!metadata) {
    console.log('Could not read video metadata');
    return { variants: {}, metadata: null };
  }

  console.log(`Processing video: ${originalFilename}, original bitrate: ${metadata.bitrate}`);

  // Create compressed web version (720p, lower bitrate)
  try {
    const webFilename = `${baseName}_web.mp4`;
    const webPath = path.join(dir, webFilename);

    // Target: 720p max, 1.5 Mbps video, 128k audio, fast encoding
    await runFfmpeg([
      '-i', filePath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '28',
      '-vf', 'scale=-2:720',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      webPath
    ]);

    const webMeta = await getVideoMetadata(webPath);
    const stats = await fs.stat(webPath);
    
    variants.web = {
      filename: webFilename,
      path: `/uploads/${webFilename}`,
      width: webMeta?.width,
      height: webMeta?.height,
      size: stats.size
    };

    console.log(`Created web variant: ${webFilename}, size: ${Math.round(stats.size / 1024)}KB`);
  } catch (err) {
    console.error('Error creating web variant:', err.message);
  }

  // Create ultra-light background version (480p, very low bitrate, no audio)
  try {
    const bgFilename = `${baseName}_bg.mp4`;
    const bgPath = path.join(dir, bgFilename);

    await runFfmpeg([
      '-i', filePath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '32',
      '-vf', 'scale=-2:480',
      '-an',  // No audio
      '-movflags', '+faststart',
      '-y',
      bgPath
    ]);

    const bgMeta = await getVideoMetadata(bgPath);
    const stats = await fs.stat(bgPath);
    
    variants.background = {
      filename: bgFilename,
      path: `/uploads/${bgFilename}`,
      width: bgMeta?.width,
      height: bgMeta?.height,
      size: stats.size
    };

    console.log(`Created background variant: ${bgFilename}, size: ${Math.round(stats.size / 1024)}KB`);
  } catch (err) {
    console.error('Error creating background variant:', err.message);
  }

  return { variants, metadata };
};

/**
 * Run ffmpeg command
 */
const runFfmpeg = (args) => {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    
    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data; });
    
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });
  });
};

module.exports = { processVideo, getVideoMetadata, checkFfmpeg };
