const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { authorize, canAccess } = require('../middleware/roles');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (admin only)
router.get('/', authenticate, canAccess('users'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Fout bij ophalen gebruikers' });
  }
});

// Get single user
router.get('/:id', authenticate, canAccess('users'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Fout bij ophalen gebruiker' });
  }
});

// Create user (admin only)
router.post('/', authenticate, canAccess('users'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, wachtwoord en naam zijn verplicht' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens bevatten' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email is al in gebruik' });
    }

    // Only SUPER_ADMIN can create SUPER_ADMIN or ADMIN
    if ((role === 'SUPER_ADMIN' || role === 'ADMIN') && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Onvoldoende rechten om deze rol toe te wijzen' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'EDITOR'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Fout bij aanmaken gebruiker' });
  }
});

// Update user
router.put('/:id', authenticate, canAccess('users'), async (req, res) => {
  try {
    const { email, name, role, active, password } = req.body;
    const userId = parseInt(req.params.id);

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' });
    }

    // Prevent changing own role
    if (userId === req.user.id && role && role !== existing.role) {
      return res.status(400).json({ error: 'U kunt uw eigen rol niet wijzigen' });
    }

    // Only SUPER_ADMIN can assign SUPER_ADMIN/ADMIN
    if ((role === 'SUPER_ADMIN' || role === 'ADMIN') && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Onvoldoende rechten om deze rol toe te wijzen' });
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens bevatten' });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken gebruiker' });
  }
});

// Delete user
router.delete('/:id', authenticate, canAccess('users'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'U kunt uw eigen account niet verwijderen' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' });
    }

    if (user.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'U kunt een Super Admin niet verwijderen' });
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, message: 'Gebruiker verwijderd' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen gebruiker' });
  }
});

module.exports = router;
