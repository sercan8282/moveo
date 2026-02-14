const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');
const { sendContactEmail } = require('../services/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// Public: Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Naam, e-mail en bericht zijn verplicht' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ongeldig e-mailadres' });
    }

    const submission = await prisma.contactSubmission.create({
      data: { name, email, phone: phone || null, subject: subject || null, message }
    });

    // Send email notification (async, don't block response)
    sendContactEmail(submission).catch(err => 
      console.error('Contact email failed:', err)
    );

    res.status(201).json({ success: true, message: 'Bedankt voor uw bericht! Wij nemen zo snel mogelijk contact met u op.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Er is een fout opgetreden bij het versturen van uw bericht' });
  }
});

// Admin: Get all submissions
router.get('/', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const where = unread === 'true' ? { read: false } : {};

    const [submissions, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.contactSubmission.count({ where })
    ]);

    res.json({
      data: submissions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Fout bij ophalen berichten' });
  }
});

// Admin: Mark as read
router.put('/:id/read', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const submission = await prisma.contactSubmission.update({
      where: { id: parseInt(req.params.id) },
      data: { read: true }
    });
    res.json(submission);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Fout bij markeren als gelezen' });
  }
});

// Admin: Delete submission
router.delete('/:id', authenticate, canAccess('settings'), async (req, res) => {
  try {
    await prisma.contactSubmission.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen bericht' });
  }
});

// Admin: Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await prisma.contactSubmission.count({ where: { read: false } });
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Fout' });
  }
});

module.exports = router;
