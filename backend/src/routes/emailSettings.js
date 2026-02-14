const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');
const { resetTransporter } = require('../services/emailService');

const router = express.Router();
const prisma = new PrismaClient();

const EMAIL_SETTING_KEYS = [
  'email_smtp_host',
  'email_smtp_port',
  'email_smtp_user',
  'email_smtp_pass',
  'email_smtp_secure',
  'email_from_name',
  'email_from_address',
  'email_contact_recipient',
  'email_quote_recipient'
];

// Admin: Get email settings
router.get('/', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: EMAIL_SETTING_KEYS } }
    });

    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });

    // Mask password
    if (result.email_smtp_pass) {
      result.email_smtp_pass_set = true;
      result.email_smtp_pass = '********';
    }

    res.json(result);
  } catch (error) {
    console.error('Get email settings error:', error);
    res.status(500).json({ error: 'Fout bij ophalen e-mailinstellingen' });
  }
});

// Admin: Update email settings
router.put('/', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const updates = req.body;
    
    for (const key of EMAIL_SETTING_KEYS) {
      if (updates[key] !== undefined) {
        // Skip if password field is masked
        if (key === 'email_smtp_pass' && updates[key] === '********') continue;

        await prisma.setting.upsert({
          where: { key },
          update: { value: updates[key] },
          create: { key, value: updates[key] }
        });
      }
    }

    // Reset transporter so it picks up new settings
    resetTransporter();

    res.json({ success: true, message: 'E-mailinstellingen opgeslagen' });
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({ error: 'Fout bij opslaan e-mailinstellingen' });
  }
});

// Admin: Test email connection
router.post('/test', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    
    // Get current settings from DB
    const settings = await prisma.setting.findMany({
      where: { key: { in: EMAIL_SETTING_KEYS } }
    });

    const config = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    const host = config.email_smtp_host;
    const port = config.email_smtp_port;
    const user = config.email_smtp_user;
    const pass = config.email_smtp_pass;

    if (!host || !port || !user || !pass) {
      return res.status(400).json({ error: 'Vul eerst alle SMTP-instellingen in' });
    }

    const secure = config.email_smtp_secure === true || config.email_smtp_secure === 'true';

    const testTransporter = nodemailer.createTransport({
      host: String(host),
      port: parseInt(String(port), 10),
      secure,
      auth: { user: String(user), pass: String(pass) },
      tls: { rejectUnauthorized: false }
    });

    await testTransporter.verify();

    // Send test email to contact recipient or from address
    const testRecipient = config.email_contact_recipient || config.email_from_address || user;
    const fromName = config.email_from_name || 'Moveo CMS';
    const fromAddress = config.email_from_address || user;

    await testTransporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: String(testRecipient),
      subject: 'Moveo CMS — E-mail test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
          <h3 style="color: #059669; margin-top: 0;">✅ E-mail test geslaagd!</h3>
          <p>Dit is een testbericht van uw Moveo CMS.</p>
          <p style="color: #64748b; font-size: 12px;">${new Date().toLocaleString('nl-NL')}</p>
        </div>
      `
    });

    res.json({ success: true, message: `Test e-mail verzonden naar ${testRecipient}` });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(400).json({ 
      error: `E-mail test mislukt: ${error.message}`,
      details: error.code || error.responseCode || 'unknown'
    });
  }
});

module.exports = router;
