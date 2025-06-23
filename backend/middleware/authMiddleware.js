const jwt = require('jsonwebtoken');

// TODO: Store JWT_SECRET in environment variables for production
const JWT_SECRET = 'YOUR_JWT_SECRET_REPLACE_ME'; // Must be the same as in authRoutes.js

const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');

  // Check if not token
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Check if token is in Bearer format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ msg: 'Token is not in Bearer format' });
  }

  const token = parts[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user from payload
    req.user = decoded.user; // Payload was { user: { id: ... } }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Token is expired' });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Token is not valid' });
    }
    // For other errors, it might be a server issue
    console.error('Something wrong with auth middleware:', err);
    res.status(500).json({ msg: 'Server Error during token verification' });
  }
};

module.exports = authMiddleware;
