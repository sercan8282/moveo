const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const postRoutes = require('./routes/posts');
const mediaRoutes = require('./routes/media');
const menuRoutes = require('./routes/menus');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const homepageRoutes = require('./routes/homepage');
const footerRoutes = require('./routes/footer');
const contactRoutes = require('./routes/contact');
const publicRoutes = require('./routes/public');
const vehicleTypeRoutes = require('./routes/vehicleTypes');
const calculatorRoutes = require('./routes/calculator');
const emailSettingsRoutes = require('./routes/emailSettings');

const app = express();

// Trust proxy (behind nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static uploads
app.use('/uploads', express.static(config.uploadDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/pages', apiLimiter, pageRoutes);
app.use('/api/posts', apiLimiter, postRoutes);
app.use('/api/media', apiLimiter, mediaRoutes);
app.use('/api/menus', apiLimiter, menuRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/homepage', apiLimiter, homepageRoutes);
app.use('/api/footer', apiLimiter, footerRoutes);
app.use('/api/contact', apiLimiter, contactRoutes);
app.use('/api/vehicle-types', apiLimiter, vehicleTypeRoutes);
app.use('/api/calculator', apiLimiter, calculatorRoutes);
app.use('/api/email-settings', apiLimiter, emailSettingsRoutes);
app.use('/api/public', publicRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Bestand is te groot (max 50MB)' });
  }

  if (err.message && err.message.includes('Ongeldig bestandstype')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Interne server fout' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint niet gevonden' });
});

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 Moveo CMS Backend running on port ${config.port}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
