const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');

const router = express.Router();
const prisma = new PrismaClient();

// Get footer columns
router.get('/', authenticate, async (req, res) => {
  try {
    const columns = await prisma.footerColumn.findMany({
      orderBy: { columnNum: 'asc' }
    });
    res.json(columns);
  } catch (error) {
    console.error('Get footer error:', error);
    res.status(500).json({ error: 'Fout bij ophalen footer' });
  }
});

// Update footer column
router.put('/:id', authenticate, canAccess('footer'), async (req, res) => {
  try {
    const { title, content, menuId } = req.body;

    const column = await prisma.footerColumn.update({
      where: { id: parseInt(req.params.id) },
      data: { title, content, menuId: menuId ? parseInt(menuId) : null }
    });

    res.json(column);
  } catch (error) {
    console.error('Update footer error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken footer' });
  }
});

// Bulk update footer
router.put('/', authenticate, canAccess('footer'), async (req, res) => {
  try {
    const { columns } = req.body;

    const updates = columns.map(col =>
      prisma.footerColumn.upsert({
        where: { id: col.id || 0 },
        update: {
          title: col.title,
          content: col.content,
          menuId: col.menuId ? parseInt(col.menuId) : null,
          sortOrder: col.sortOrder || 0
        },
        create: {
          columnNum: col.columnNum,
          title: col.title,
          content: col.content,
          menuId: col.menuId ? parseInt(col.menuId) : null,
          sortOrder: col.sortOrder || 0
        }
      })
    );

    await prisma.$transaction(updates);

    const result = await prisma.footerColumn.findMany({ orderBy: { columnNum: 'asc' } });
    res.json(result);
  } catch (error) {
    console.error('Bulk update footer error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken footer' });
  }
});

module.exports = router;
