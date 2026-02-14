const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');

const router = express.Router();
const prisma = new PrismaClient();

// Get homepage sections
router.get('/', authenticate, async (req, res) => {
  try {
    const sections = await prisma.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.json(sections);
  } catch (error) {
    console.error('Get homepage error:', error);
    res.status(500).json({ error: 'Fout bij ophalen homepage' });
  }
});

// Get single section
router.get('/:id', authenticate, async (req, res) => {
  try {
    const section = await prisma.homepageSection.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!section) {
      return res.status(404).json({ error: 'Sectie niet gevonden' });
    }
    res.json(section);
  } catch (error) {
    console.error('Get homepage section error:', error);
    res.status(500).json({ error: 'Fout bij ophalen sectie' });
  }
});

// Create section
router.post('/', authenticate, canAccess('homepage'), async (req, res) => {
  try {
    const { type, title, subtitle, content, visible, settings } = req.body;

    const maxOrder = await prisma.homepageSection.aggregate({
      _max: { sortOrder: true }
    });

    const section = await prisma.homepageSection.create({
      data: {
        type: type || 'content',
        title,
        subtitle,
        content: content || null,
        visible: visible !== undefined ? visible : true,
        settings: settings || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1
      }
    });

    res.status(201).json(section);
  } catch (error) {
    console.error('Create homepage section error:', error);
    res.status(500).json({ error: 'Fout bij aanmaken sectie' });
  }
});

// Update section
router.put('/:id', authenticate, canAccess('homepage'), async (req, res) => {
  try {
    const { type, title, subtitle, content, visible, settings, sortOrder } = req.body;

    const section = await prisma.homepageSection.update({
      where: { id: parseInt(req.params.id) },
      data: {
        type,
        title,
        subtitle,
        content,
        visible,
        settings,
        sortOrder
      }
    });

    res.json(section);
  } catch (error) {
    console.error('Update homepage section error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken sectie' });
  }
});

// Reorder sections
router.put('/reorder/bulk', authenticate, canAccess('homepage'), async (req, res) => {
  try {
    const { items } = req.body;

    const updates = items.map(item =>
      prisma.homepageSection.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder }
      })
    );

    await prisma.$transaction(updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Reorder homepage error:', error);
    res.status(500).json({ error: 'Fout bij herordenen' });
  }
});

// Delete section
router.delete('/:id', authenticate, canAccess('homepage'), async (req, res) => {
  try {
    await prisma.homepageSection.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Sectie verwijderd' });
  } catch (error) {
    console.error('Delete homepage section error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen sectie' });
  }
});

module.exports = router;
