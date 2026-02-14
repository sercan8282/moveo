const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authenticatie vereist / Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Onvoldoende rechten / Insufficient permissions' });
    }

    next();
  };
};

const PERMISSIONS = {
  SUPER_ADMIN: ['users', 'roles', 'settings', 'pages', 'posts', 'media', 'menus', 'themes', 'homepage', 'footer'],
  ADMIN: ['settings', 'pages', 'posts', 'media', 'menus', 'themes', 'homepage', 'footer'],
  EDITOR: ['pages', 'posts', 'media'],
  VIEWER: []
};

const canAccess = (resource) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authenticatie vereist / Authentication required' });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(resource) && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Onvoldoende rechten voor deze actie / Insufficient permissions for this action' });
    }

    next();
  };
};

module.exports = { authorize, canAccess, PERMISSIONS };
