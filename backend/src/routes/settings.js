const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/v1/settings - get current user's settings
router.get('/', authenticate, asyncHandler(async (req, res) => {
  let settings = db.findOne('settings', { user_id: req.user.id });
  
  // If no settings found, create default
  if (!settings) {
    settings = db.insert('settings', {
      user_id: req.user.id,
      email_notifications: true,
      sms_notifications: true,
      dark_mode: false,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  res.json({ settings });
}));

// PUT /api/v1/settings - update current user's settings
router.put('/', authenticate, asyncHandler(async (req, res) => {
  let settings = db.findOne('settings', { user_id: req.user.id });
  
  const allowedUpdates = [
    'email_notifications', 
    'sms_notifications', 
    'dark_mode', 
    'language'
  ];
  
  // Admin can also update thresholds
  if (req.user.role === 'ADMIN') {
    allowedUpdates.push('high_risk_threshold', 'moderate_risk_threshold');
  }

  const updates = {};
  allowedUpdates.forEach(key => {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  });

  if (!settings) {
    settings = db.insert('settings', {
      user_id: req.user.id,
      email_notifications: true,
      sms_notifications: true,
      dark_mode: false,
      language: 'en',
      ...updates,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } else {
    settings = db.update('settings', settings.id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  res.json({ settings });
}));

module.exports = router;
