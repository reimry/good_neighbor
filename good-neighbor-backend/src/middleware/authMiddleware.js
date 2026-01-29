const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Не авторизовано' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, apartment_id, full_name }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Невалідний токен' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостатньо прав' });
    }
    next();
  };
}

/**
 * Middleware to require super_admin role
 * Super admins have osbb_id = NULL and can bypass tenant isolation
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ error: 'User not authenticated' });
  }
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Super admin privileges required' });
  }
  // Verify super_admin has no OSBB association
  // Check for null or undefined (allowing null explicitly)
  if (req.user.osbb_id !== null && req.user.osbb_id !== undefined) {
    return res.status(403).json({ error: 'Invalid configuration: super admin should not have OSBB association' });
  }
  next();
}

module.exports = { authenticate, requireRole, requireSuperAdmin };
