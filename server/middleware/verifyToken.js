const jwt = require('jsonwebtoken');

/**
 * Express middleware that requires a valid Bearer JWT token.
 * Apply to any route that mutates data (POST, PUT, DELETE).
 * GET routes for public data do not need this.
 */
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), secret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}

module.exports = { verifyToken };
