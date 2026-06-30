const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/v1/hospitals
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const hospitals = db.findAll('hospitals');
  res.json({ hospitals });
}));

// GET /api/v1/hospitals/:id/stats
router.get('/:id/stats', authenticate, asyncHandler(async (req, res) => {
  const hospital = db.findById('hospitals', parseInt(req.params.id));
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

  const ecgRecords = db.findAll('ecg_records', { hospital_id: hospital.id });
  const patients = db.findAll('patients', { hospital_id: hospital.id });

  res.json({
    hospital,
    stats: {
      total_ecgs: ecgRecords.length,
      total_patients: patients.length,
      processing_rate: 100
    }
  });
}));

// POST /api/v1/hospitals - Admin creates hospital
router.post('/', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { v4: uuidv4 } = require('uuid');
  const { name, city, country, contact_email } = req.body;
  if (!name || !city) return res.status(400).json({ error: 'Name and city required' });

  const api_key = `HOSPITAL_${name.toUpperCase().replace(/\s/g, '_')}_${uuidv4().split('-')[0].toUpperCase()}`;
  const hospital = db.insert('hospitals', { name, city, country: country || 'Cameroon', contact_email, api_key, status: 'ACTIVE', total_ecg_transmitted: 0 });
  res.status(201).json({ hospital });
}));

module.exports = router;
