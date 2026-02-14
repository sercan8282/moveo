const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');

const router = express.Router();
const prisma = new PrismaClient();

// Public: Get active vehicle types
router.get('/public', async (req, res) => {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pricePerKmDomestic: true,
        pricePerKmInternational: true,
        expressSurchargePercent: true,
        additionalCosts: true,
        minPrice: true,
        tollMultiplier: true,
        icon: true
      }
    });
    res.json(vehicleTypes);
  } catch (error) {
    console.error('Get public vehicle types error:', error);
    res.status(500).json({ error: 'Fout bij ophalen voertuigtypes' });
  }
});

// Admin: Get all vehicle types
router.get('/', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { quotes: true } } }
    });
    res.json(vehicleTypes);
  } catch (error) {
    console.error('Get vehicle types error:', error);
    res.status(500).json({ error: 'Fout bij ophalen voertuigtypes' });
  }
});

// Admin: Get single vehicle type
router.get('/:id', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const vt = await prisma.vehicleType.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { _count: { select: { quotes: true } } }
    });
    if (!vt) return res.status(404).json({ error: 'Voertuigtype niet gevonden' });
    res.json(vt);
  } catch (error) {
    console.error('Get vehicle type error:', error);
    res.status(500).json({ error: 'Fout bij ophalen voertuigtype' });
  }
});

// Admin: Create vehicle type
router.post('/', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const {
      name, slug, description,
      pricePerKmDomestic, pricePerKmInternational,
      expressSurchargePercent, additionalCosts,
      minPrice, active, sortOrder, icon
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Naam is verplicht' });

    const generatedSlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await prisma.vehicleType.findUnique({ where: { slug: generatedSlug } });
    if (existing) return res.status(400).json({ error: 'Slug bestaat al' });

    const vehicleType = await prisma.vehicleType.create({
      data: {
        name,
        slug: generatedSlug,
        description: description || null,
        pricePerKmDomestic: parseFloat(pricePerKmDomestic) || 0,
        pricePerKmInternational: parseFloat(pricePerKmInternational) || 0,
        expressSurchargePercent: parseFloat(expressSurchargePercent) || 0,
        additionalCosts: additionalCosts || null,
        minPrice: parseFloat(minPrice) || 0,
        active: active !== false,
        sortOrder: parseInt(sortOrder) || 0,
        icon: icon || null
      }
    });

    res.status(201).json(vehicleType);
  } catch (error) {
    console.error('Create vehicle type error:', error);
    res.status(500).json({ error: 'Fout bij aanmaken voertuigtype' });
  }
});

// Admin: Update vehicle type
router.put('/:id', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const {
      name, slug, description,
      pricePerKmDomestic, pricePerKmInternational,
      expressSurchargePercent, additionalCosts,
      minPrice, active, sortOrder, icon
    } = req.body;

    const id = parseInt(req.params.id);
    const existing = await prisma.vehicleType.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Voertuigtype niet gevonden' });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (pricePerKmDomestic !== undefined) updateData.pricePerKmDomestic = parseFloat(pricePerKmDomestic);
    if (pricePerKmInternational !== undefined) updateData.pricePerKmInternational = parseFloat(pricePerKmInternational);
    if (expressSurchargePercent !== undefined) updateData.expressSurchargePercent = parseFloat(expressSurchargePercent);
    if (additionalCosts !== undefined) updateData.additionalCosts = additionalCosts;
    if (minPrice !== undefined) updateData.minPrice = parseFloat(minPrice);
    if (active !== undefined) updateData.active = active;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);
    if (icon !== undefined) updateData.icon = icon;

    const vehicleType = await prisma.vehicleType.update({
      where: { id },
      data: updateData
    });

    res.json(vehicleType);
  } catch (error) {
    console.error('Update vehicle type error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken voertuigtype' });
  }
});

// Admin: Delete vehicle type
router.delete('/:id', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const vt = await prisma.vehicleType.findUnique({
      where: { id },
      include: { _count: { select: { quotes: true } } }
    });
    if (!vt) return res.status(404).json({ error: 'Voertuigtype niet gevonden' });

    if (vt._count.quotes > 0) {
      return res.status(400).json({ 
        error: `Kan niet verwijderen: ${vt._count.quotes} offerte(s) gekoppeld. Deactiveer het voertuigtype in plaats daarvan.` 
      });
    }

    await prisma.vehicleType.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete vehicle type error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen voertuigtype' });
  }
});

// Admin: Reorder vehicle types
router.put('/reorder/batch', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { items } = req.body; // [ { id, sortOrder } ]
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Items array vereist' });

    await prisma.$transaction(
      items.map(item =>
        prisma.vehicleType.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Reorder vehicle types error:', error);
    res.status(500).json({ error: 'Fout bij herordenen' });
  }
});

module.exports = router;
