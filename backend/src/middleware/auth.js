const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authenticatie vereist / Authentication required' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, active: true, mfaEnabled: true }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Gebruiker niet gevonden of inactief / User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessie verlopen / Session expired' });
    }
    return res.status(401).json({ error: 'Ongeldige token / Invalid token' });
  }
};

module.exports = { authenticate };
