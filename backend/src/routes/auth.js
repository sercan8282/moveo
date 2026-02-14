const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }

    // Check MFA
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return res.status(200).json({ requireMfa: true, message: 'MFA code vereist' });
      }

      const isValid = authenticator.verify({ token: mfaCode, secret: user.mfaSecret });
      if (!isValid) {
        return res.status(401).json({ error: 'Ongeldige MFA code' });
      }
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Setup MFA
router.post('/mfa/setup', authenticate, async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email, config.siteName, secret);
    const qrCode = await QRCode.toDataURL(otpauth);

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { mfaSecret: secret }
    });

    res.json({ secret, qrCode });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ error: 'MFA setup mislukt' });
  }
});

// Verify and enable MFA
router.post('/mfa/verify', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.mfaSecret) {
      return res.status(400).json({ error: 'MFA setup niet gestart' });
    }

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) {
      return res.status(400).json({ error: 'Ongeldige code, probeer opnieuw' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { mfaEnabled: true }
    });

    res.json({ success: true, message: 'MFA succesvol ingeschakeld' });
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({ error: 'MFA verificatie mislukt' });
  }
});

// Disable MFA
router.post('/mfa/disable', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ongeldig wachtwoord' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { mfaEnabled: false, mfaSecret: null }
    });

    res.json({ success: true, message: 'MFA uitgeschakeld' });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({ error: 'MFA uitschakelen mislukt' });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Huidig wachtwoord is onjuist' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens bevatten' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Wachtwoord gewijzigd' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Wachtwoord wijzigen mislukt' });
  }
});

module.exports = router;
