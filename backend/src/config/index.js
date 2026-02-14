module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  siteName: process.env.SITE_NAME || 'moveo-bv.nl',
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'nl',
  imageSizes: {
    small: { width: 150 },
    normal: { width: 400 },
    medium: { width: 800 },
    large: { width: 1200 }
  }
};
