const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

const processImage = async (filePath, originalFilename) => {
  const ext = path.extname(originalFilename).toLowerCase();
  const baseName = path.basename(originalFilename, ext);
  const dir = path.dirname(filePath);
  const variants = {};

  // Skip processing for SVG and video files
  if (ext === '.svg') {
    return { variants: {}, originalWidth: null, originalHeight: null };
  }

  const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  if (videoExts.includes(ext)) {
    return { variants: {}, originalWidth: null, originalHeight: null };
  }

  try {
    const metadata = await sharp(filePath).metadata();

    for (const [sizeName, sizeConfig] of Object.entries(config.imageSizes)) {
      if (metadata.width && metadata.width > sizeConfig.width) {
        const variantFilename = `${baseName}_${sizeName}${ext}`;
        const variantPath = path.join(dir, variantFilename);

        await sharp(filePath)
          .resize(sizeConfig.width, null, { withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toFile(variantPath);

        const variantMeta = await sharp(variantPath).metadata();
        variants[sizeName] = {
          filename: variantFilename,
          path: variantPath.replace(config.uploadDir, '/uploads'),
          width: variantMeta.width,
          height: variantMeta.height
        };
      }
    }

    return { variants, originalWidth: metadata.width, originalHeight: metadata.height };
  } catch (err) {
    console.error('Image processing error:', err.message);
    return { variants: {}, originalWidth: null, originalHeight: null };
  }
};

const resizeCustom = async (filePath, width, height, originalFilename) => {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  const dir = path.dirname(filePath);
  const customFilename = `${baseName}_${width}x${height}${ext}`;
  const customPath = path.join(dir, customFilename);

  const resizeOptions = {};
  if (width) resizeOptions.width = parseInt(width);
  if (height) resizeOptions.height = parseInt(height);

  await sharp(filePath)
    .resize(resizeOptions.width, resizeOptions.height, { fit: 'inside', withoutEnlargement: false })
    .jpeg({ quality: 85, progressive: true })
    .toFile(customPath);

  const metadata = await sharp(customPath).metadata();

  return {
    filename: customFilename,
    path: customPath.replace(config.uploadDir, '/uploads'),
    width: metadata.width,
    height: metadata.height
  };
};

module.exports = { processImage, resizeCustom };
