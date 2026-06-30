const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/v1/admin/dashboard
router.get('/dashboard', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const hospitals = db.findAll('hospitals');
  const patients = db.findAll('patients');
  const doctors = db.findAll('doctors');
  const ecgRecords = db.findAll('ecg_records');
  const analyses = db.findAll('ai_analyses');
  const alerts = db.findAll('alerts');

  const highRisk = analyses.filter(a => a.risk_category === 'HIGH').length;
  const today = new Date().toDateString();
  const todayECGs = ecgRecords.filter(e => new Date(e.received_at).toDateString() === today).length;

  res.json({
    stats: {
      total_hospitals: hospitals.length,
      total_patients: patients.length,
      total_doctors: doctors.length,
      total_ecgs: ecgRecords.length,
      total_analyses: analyses.length,
      high_risk_cases: highRisk,
      pending_alerts: alerts.filter(a => a.resolution_status === 'PENDING').length,
      today_ecgs: todayECGs
    },
    hospitals,
    recent_alerts: alerts.slice(-10).reverse()
  });
}));

// GET /api/v1/admin/users
router.get('/users', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const users = db.findAll('users').map(u => ({ ...u, password: undefined }));
  res.json({ users });
}));

module.exports = router;
