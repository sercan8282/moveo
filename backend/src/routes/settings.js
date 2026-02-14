const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');

const router = express.Router();
const prisma = new PrismaClient();

// Get all settings
router.get('/', authenticate, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Fout bij ophalen instellingen' });
  }
});

// Update setting
router.put('/:key', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { value } = req.body;

    const setting = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value: JSON.parse(JSON.stringify(value)) },
      create: { key: req.params.key, value: JSON.parse(JSON.stringify(value)) }
    });

    res.json(setting);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken instelling' });
  }
});

// Bulk update settings
router.put('/', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const updates = Object.entries(req.body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: JSON.parse(JSON.stringify(value)) },
        create: { key, value: JSON.parse(JSON.stringify(value)) }
      })
    );

    await prisma.$transaction(updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken instellingen' });
  }
});

// Get all themes
router.get('/themes', authenticate, async (req, res) => {
  try {
    const themes = await prisma.theme.findMany({ orderBy: { name: 'asc' } });
    res.json(themes);
  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ error: 'Fout bij ophalen thema\'s' });
  }
});

// Get active theme
router.get('/themes/active', async (req, res) => {
  try {
    const theme = await prisma.theme.findFirst({ where: { isActive: true } });
    res.json(theme);
  } catch (error) {
    console.error('Get active theme error:', error);
    res.status(500).json({ error: 'Fout bij ophalen actief thema' });
  }
});

// Create theme
router.post('/themes', authenticate, canAccess('themes'), async (req, res) => {
  try {
    const { name, colors, fonts } = req.body;

    if (!name || !colors) {
      return res.status(400).json({ error: 'Naam en kleuren zijn verplicht' });
    }

    const theme = await prisma.theme.create({
      data: { name, colors, fonts: fonts || null }
    });

    res.status(201).json(theme);
  } catch (error) {
    console.error('Create theme error:', error);
    res.status(500).json({ error: 'Fout bij aanmaken thema' });
  }
});

// Update theme
router.put('/themes/:id', authenticate, canAccess('themes'), async (req, res) => {
  try {
    const { name, colors, fonts } = req.body;

    const theme = await prisma.theme.update({
      where: { id: parseInt(req.params.id) },
      data: { name, colors, fonts }
    });

    res.json(theme);
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken thema' });
  }
});

// Activate theme
router.post('/themes/:id/activate', authenticate, canAccess('themes'), async (req, res) => {
  try {
    // Deactivate all
    await prisma.theme.updateMany({ data: { isActive: false } });

    // Activate selected
    const theme = await prisma.theme.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: true }
    });

    res.json(theme);
  } catch (error) {
    console.error('Activate theme error:', error);
    res.status(500).json({ error: 'Fout bij activeren thema' });
  }
});

// Delete theme
router.delete('/themes/:id', authenticate, canAccess('themes'), async (req, res) => {
  try {
    const theme = await prisma.theme.findUnique({ where: { id: parseInt(req.params.id) } });
    if (theme.isActive) {
      return res.status(400).json({ error: 'Kan actief thema niet verwijderen' });
    }

    await prisma.theme.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Thema verwijderd' });
  } catch (error) {
    console.error('Delete theme error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen thema' });
  }
});

module.exports = router;
