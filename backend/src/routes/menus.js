const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');

const router = express.Router();
const prisma = new PrismaClient();

// Get all menus
router.get('/', authenticate, async (req, res) => {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            children: { orderBy: { sortOrder: 'asc' } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(menus);
  } catch (error) {
    console.error('Get menus error:', error);
    res.status(500).json({ error: 'Fout bij ophalen menu\'s' });
  }
});

// Get single menu
router.get('/:id', authenticate, async (req, res) => {
  try {
    const menu = await prisma.menu.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: { orderBy: { sortOrder: 'asc' } }
          }
        }
      }
    });

    if (!menu) {
      return res.status(404).json({ error: 'Menu niet gevonden' });
    }

    res.json(menu);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: 'Fout bij ophalen menu' });
  }
});

// Create menu
router.post('/', authenticate, canAccess('menus'), async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Naam is verplicht' });
    }

    const menu = await prisma.menu.create({
      data: { name, location: location || null },
      include: { items: true }
    });

    res.status(201).json(menu);
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({ error: 'Fout bij aanmaken menu' });
  }
});

// Update menu
router.put('/:id', authenticate, canAccess('menus'), async (req, res) => {
  try {
    const { name, location } = req.body;

    const menu = await prisma.menu.update({
      where: { id: parseInt(req.params.id) },
      data: { name, location },
      include: { items: { orderBy: { sortOrder: 'asc' } } }
    });

    res.json(menu);
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken menu' });
  }
});

// Delete menu
router.delete('/:id', authenticate, canAccess('menus'), async (req, res) => {
  try {
    await prisma.menu.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Menu verwijderd' });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen menu' });
  }
});

// Add menu item
router.post('/:id/items', authenticate, canAccess('menus'), async (req, res) => {
  try {
    const { label, url, pageId, parentId, target, cssClass, icon, styles } = req.body;

    if (!label) {
      return res.status(400).json({ error: 'Label is verplicht' });
    }

    const maxOrder = await prisma.menuItem.aggregate({
      where: { menuId: parseInt(req.params.id), parentId: parentId || null },
      _max: { sortOrder: true }
    });

    const item = await prisma.menuItem.create({
      data: {
        label,
        url: url || null,
        pageId: pageId ? parseInt(pageId) : null,
        menuId: parseInt(req.params.id),
        parentId: parentId ? parseInt(parentId) : null,
        target: target || '_self',
        cssClass: cssClass || null,
        icon: icon || null,
        styles: styles || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ error: 'Fout bij toevoegen menu-item' });
  }
});

// Update menu item (both route patterns supported)
router.put('/items/:itemId', authenticate, canAccess('menus'), async (req, res) => {
  try {
    const { label, url, pageId, parentId, target, sortOrder, cssClass, icon, styles } = req.body;

    const item = await prisma.menuItem.update({
      where: { id: parseInt(req.params.itemId) },
      data: {
        label,
        url: url || null,
        pageId: pageId ? parseInt(pageId) : null,
        parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : undefined,
        target: target || '_self',
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        cssClass: cssClass || null,
        icon: icon || null,
        styles: styles || null
      }
    });

    res.json(item);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken menu-item' });
  }
});

// Update menu item (alternative route pattern)
router.put('/:id/items/:itemId', authenticate, canAccess('menus'), async (req, res) => {
  try {
    const { label, url, pageId, parentId, target, sortOrder, cssClass, icon, styles } = req.body;

    const item = await prisma.menuItem.update({
      where: { id: parseInt(req.params.itemId) },
      data: {
        label,
        url: url || null,
        pageId: pageId ? parseInt(pageId) : null,
        parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : undefined,
        target: target || '_self',
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        cssClass: cssClass || null,
        icon: icon || null,
        styles: styles || null
      }
    });

    res.json(item);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken menu-item' });
  }
});

// Delete menu item (alternative route pattern)
router.delete('/:id/items/:itemId', authenticate, canAccess('menus'), async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: parseInt(req.params.itemId) } });
    res.json({ success: true, message: 'Menu-item verwijderd' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen menu-item' });
  }
});

// Reorder menu items
router.put('/:id/reorder', authenticate, canAccess('menus'), async (req, res) => {
  try {
    const { items } = req.body; // [{ id, sortOrder, parentId }]

    const updates = items.map(item =>
      prisma.menuItem.update({
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
    console.error('Reorder menu items error:', error);
    res.status(500).json({ error: 'Fout bij herordenen menu-items' });
  }
});

// Delete menu item
router.delete('/items/:itemId', authenticate, canAccess('menus'), async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: parseInt(req.params.itemId) } });
    res.json({ success: true, message: 'Menu-item verwijderd' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen menu-item' });
  }
});

module.exports = router;
