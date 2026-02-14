const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');
const { generateSlug, paginate, formatPaginatedResponse } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Get all pages (with hierarchy)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: { children: { orderBy: { sortOrder: 'asc' } } },
        ...paginate(page, limit)
      }),
      prisma.page.count({ where })
    ]);

    res.json(formatPaginatedResponse(pages, total, page, limit));
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ error: 'Fout bij ophalen pagina\'s' });
  }
});

// Get all pages flat (for dropdowns)
router.get('/list', authenticate, async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      select: { id: true, title: true, slug: true, parentId: true, status: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }]
    });
    res.json(pages);
  } catch (error) {
    console.error('Get pages list error:', error);
    res.status(500).json({ error: 'Fout bij ophalen pagina\'s' });
  }
});

// Get single page
router.get('/:id', authenticate, async (req, res) => {
  try {
    const page = await prisma.page.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { children: { orderBy: { sortOrder: 'asc' } }, parent: true }
    });

    if (!page) {
      return res.status(404).json({ error: 'Pagina niet gevonden' });
    }

    res.json(page);
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ error: 'Fout bij ophalen pagina' });
  }
});

// Create page
router.post('/', authenticate, canAccess('pages'), async (req, res) => {
  try {
    const { title, slug: customSlug, content, excerpt, status, parentId, metaTitle, metaDescription, featuredImageId, template } = req.body;

    let slug = customSlug ? generateSlug(customSlug) : (title ? generateSlug(title) : `page-${Date.now()}`);

    // Ensure unique slug
    const existingSlug = await prisma.page.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const maxOrder = await prisma.page.aggregate({ _max: { sortOrder: true } });

    const page = await prisma.page.create({
      data: {
        title: title || '',
        slug,
        content: content || null,
        excerpt,
        status: status || 'DRAFT',
        parentId: parentId ? parseInt(parentId) : null,
        metaTitle: metaTitle || title || '',
        metaDescription,
        featuredImageId: featuredImageId ? parseInt(featuredImageId) : null,
        template: template || 'default',
        sortOrder: (maxOrder._max.sortOrder || 0) + 1
      },
      include: { parent: true }
    });

    res.status(201).json(page);
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ error: 'Fout bij aanmaken pagina' });
  }
});

// Update page
router.put('/:id', authenticate, canAccess('pages'), async (req, res) => {
  try {
    const { title, slug, content, excerpt, status, parentId, metaTitle, metaDescription, featuredImageId, template, sortOrder } = req.body;

    const existing = await prisma.page.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) {
      return res.status(404).json({ error: 'Pagina niet gevonden' });
    }

    // If slug changed, verify uniqueness
    let newSlug = slug || existing.slug;
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.page.findFirst({
        where: { slug, id: { not: parseInt(req.params.id) } }
      });
      if (slugExists) {
        newSlug = `${slug}-${Date.now()}`;
      }
    }

    const page = await prisma.page.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title: title !== undefined ? title : existing.title,
        slug: newSlug,
        content: content !== undefined ? content : existing.content,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        status: status || existing.status,
        parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : existing.parentId,
        metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
        metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
        featuredImageId: featuredImageId !== undefined ? (featuredImageId ? parseInt(featuredImageId) : null) : existing.featuredImageId,
        template: template || existing.template,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existing.sortOrder
      },
      include: { parent: true, children: true }
    });

    res.json(page);
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken pagina' });
  }
});

// Reorder pages
router.put('/reorder/bulk', authenticate, canAccess('pages'), async (req, res) => {
  try {
    const { items } = req.body; // [{ id, sortOrder, parentId }]

    const updates = items.map(item =>
      prisma.page.update({
        where: { id: item.id },
        data: {
          sortOrder: item.sortOrder,
          parentId: item.parentId || null
        }
      })
    );

    await prisma.$transaction(updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Reorder pages error:', error);
    res.status(500).json({ error: 'Fout bij herordenen' });
  }
});

// Delete page
router.delete('/:id', authenticate, canAccess('pages'), async (req, res) => {
  try {
    await prisma.page.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Pagina verwijderd' });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen pagina' });
  }
});

module.exports = router;
