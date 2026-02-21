const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');
const { processImage, resizeCustom } = require('../utils/imageProcessor');
const { processVideo } = require('../utils/videoProcessor');
const config = require('../config');

const router = express.Router();
const prisma = new PrismaClient();

// Multer storage config
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = config.uploadDir;
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (e) {}
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Ongeldig bestandstype. Toegestaan: JPEG, PNG, GIF, WebP, SVG, MP4, WebM, OGG, MOV'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Get all media
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 30, search, type } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by media type (image or video)
    if (type === 'video') {
      where.mimeType = { startsWith: 'video/' };
    } else if (type === 'image') {
      where.mimeType = { not: { startsWith: 'video/' } };
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.media.count({ where })
    ]);

    res.json({
      data: media,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Fout bij ophalen media' });
  }
});

// Upload image or video
router.post('/upload', authenticate, canAccess('media'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Geen bestand geüpload' });
    }

    const filePath = req.file.path;
    const isVideo = req.file.mimetype.startsWith('video/');
    
    let variants = {};
    let originalWidth = null;
    let originalHeight = null;

    if (isVideo) {
      // Process video - create compressed variants
      const result = await processVideo(filePath, req.file.filename);
      variants = result.variants;
      if (result.metadata) {
        originalWidth = result.metadata.width;
        originalHeight = result.metadata.height;
      }
    } else {
      // Process image - create size variants  
      const result = await processImage(filePath, req.file.filename);
      variants = result.variants;
      originalWidth = result.originalWidth;
      originalHeight = result.originalHeight;
    }

    const media = await prisma.media.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
        altText: req.body.altText || '',
        width: originalWidth || null,
        height: originalHeight || null,
        variants: Object.keys(variants).length > 0 ? variants : null
      }
    });

    res.status(201).json(media);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Fout bij uploaden bestand' });
  }
});

// Upload multiple images/videos
router.post('/upload-multiple', authenticate, canAccess('media'), upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Geen bestanden geüpload' });
    }

    const results = [];
    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/');
      let variants = {};
      let originalWidth = null;
      let originalHeight = null;

      if (isVideo) {
        const result = await processVideo(file.path, file.filename);
        variants = result.variants;
        if (result.metadata) {
          originalWidth = result.metadata.width;
          originalHeight = result.metadata.height;
        }
      } else {
        const result = await processImage(file.path, file.filename);
        variants = result.variants;
        originalWidth = result.originalWidth;
        originalHeight = result.originalHeight;
      }

      const media = await prisma.media.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: `/uploads/${file.filename}`,
          altText: '',
          width: originalWidth || null,
          height: originalHeight || null,
          variants: Object.keys(variants).length > 0 ? variants : null
        }
      });
      results.push(media);
    }

    res.status(201).json(results);
  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({ error: 'Fout bij uploaden bestanden' });
  }
});

// Custom resize
router.post('/:id/resize', authenticate, canAccess('media'), async (req, res) => {
  try {
    const { width, height } = req.body;

    if (!width && !height) {
      return res.status(400).json({ error: 'Breedte of hoogte is verplicht' });
    }

    const media = await prisma.media.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!media) {
      return res.status(404).json({ error: 'Media niet gevonden' });
    }

    const filePath = path.join(config.uploadDir, media.filename);
    const result = await resizeCustom(filePath, width, height, media.filename);

    // Update variants
    const currentVariants = media.variants || {};
    const customKey = `custom_${width || 'auto'}x${height || 'auto'}`;
    currentVariants[customKey] = result;

    const updated = await prisma.media.update({
      where: { id: media.id },
      data: { variants: currentVariants }
    });

    res.json(updated);
  } catch (error) {
    console.error('Resize error:', error);
    res.status(500).json({ error: 'Fout bij schalen afbeelding' });
  }
});

// Update media (alt text)
router.put('/:id', authenticate, canAccess('media'), async (req, res) => {
  try {
    const { altText } = req.body;
    const media = await prisma.media.update({
      where: { id: parseInt(req.params.id) },
      data: { altText }
    });
    res.json(media);
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken media' });
  }
});

// Delete media
router.delete('/:id', authenticate, canAccess('media'), async (req, res) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!media) {
      return res.status(404).json({ error: 'Media niet gevonden' });
    }

    // Delete file and variants
    const filePath = path.join(config.uploadDir, media.filename);
    try { await fs.unlink(filePath); } catch (e) {}

    if (media.variants) {
      for (const variant of Object.values(media.variants)) {
        try {
          const variantPath = path.join(config.uploadDir, variant.filename);
          await fs.unlink(variantPath);
        } catch (e) {}
      }
    }

    await prisma.media.delete({ where: { id: media.id } });
    res.json({ success: true, message: 'Media verwijderd' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen media' });
  }
});

module.exports = router;
