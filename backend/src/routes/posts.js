const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');
const { generateSlug, paginate, formatPaginatedResponse } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Get all posts
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { header: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit)
      }),
      prisma.post.count({ where })
    ]);

    res.json(formatPaginatedResponse(posts, total, page, limit));
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Fout bij ophalen berichten' });
  }
});

// Get single post
router.get('/:id', authenticate, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Bericht niet gevonden' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Fout bij ophalen bericht' });
  }
});

// Create post
router.post('/', authenticate, canAccess('posts'), async (req, res) => {
  try {
    const { title, content, header, status, headerImageId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Titel is verplicht' });
    }

    let slug = generateSlug(title);
    const existingSlug = await prisma.post.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content: content || null,
        header: header || null,
        headerImageId: headerImageId ? parseInt(headerImageId) : null,
        status: status || 'DRAFT'
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Fout bij aanmaken bericht' });
  }
});

// Update post
router.put('/:id', authenticate, canAccess('posts'), async (req, res) => {
  try {
    const { title, slug, content, header, status, headerImageId } = req.body;

    const existing = await prisma.post.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) {
      return res.status(404).json({ error: 'Bericht niet gevonden' });
    }

    let newSlug = slug || existing.slug;
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.post.findFirst({
        where: { slug, id: { not: parseInt(req.params.id) } }
      });
      if (slugExists) {
        newSlug = `${slug}-${Date.now()}`;
      }
    }

    const post = await prisma.post.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title: title !== undefined ? title : existing.title,
        slug: newSlug,
        content: content !== undefined ? content : existing.content,
        header: header !== undefined ? header : existing.header,
        headerImageId: headerImageId !== undefined ? (headerImageId ? parseInt(headerImageId) : null) : existing.headerImageId,
        status: status || existing.status
      }
    });

    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken bericht' });
  }
});

// Delete post
router.delete('/:id', authenticate, canAccess('posts'), async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Bericht verwijderd' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen bericht' });
  }
});

module.exports = router;
