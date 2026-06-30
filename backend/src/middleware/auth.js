const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ecg-secret-2024');
    const user = db.findById('users', decoded.id);
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required roles: ${roles.join(', ')}` });
  }
  next();
};

const authenticateHospital = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace('ApiKey ', '');
  if (!apiKey) return res.status(401).json({ error: 'Hospital API key required' });
  const hospital = db.findOne('hospitals', { api_key: apiKey, status: 'ACTIVE' });
  if (!hospital) return res.status(401).json({ error: 'Invalid or inactive hospital API key' });
  req.hospital = hospital;
  next();
};

module.exports = { authenticate, requireRole, authenticateHospital };
