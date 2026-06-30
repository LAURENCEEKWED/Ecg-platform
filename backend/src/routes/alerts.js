const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendToUser, broadcast } = require('../services/websocket');

// GET /api/v1/alerts
router.get('/', authenticate, asyncHandler(async (req, res) => {
  let alerts = [];
  if (req.user.role === 'ADMIN') {
    alerts = db.findAll('alerts');
  } else if (req.user.role === 'DOCTOR') {
    const doctor = db.findOne('doctors', { user_id: req.user.id });
    const patients = doctor ? db.findAll('patients', { doctor_id: doctor.id }) : [];
    alerts = db.query('alerts', a => patients.some(p => p.id === a.patient_id));
  } else if (req.user.role === 'PATIENT') {
    const patient = db.findOne('patients', { user_id: req.user.id });
    alerts = patient ? db.findAll('alerts', { patient_id: patient.id }) : [];
  }

  const enriched = alerts.map(alert => {
    const patient = db.findById('patients', alert.patient_id);
    const patientUser = patient ? db.findById('users', patient.user_id) : null;
    return { ...alert, patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown' };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ alerts: enriched });
}));

// PATCH /api/v1/alerts/:id/acknowledge
router.patch('/:id/acknowledge', authenticate, requireRole('DOCTOR', 'ADMIN'), asyncHandler(async (req, res) => {
  const alert = db.findById('alerts', parseInt(req.params.id));
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  const updated = db.update('alerts', alert.id, { resolution_status: 'RESOLVED', resolved_at: new Date().toISOString() });
  
  // Notify patient
  const patient = db.findById('patients', alert.patient_id);
  if (patient) {
    sendToUser(patient.user_id, {
      type: 'ALERT_ACKNOWLEDGED',
      data: { alertId: alert.id, patientId: patient.id }
    });
  }
  
  // Also broadcast to refresh doctor's view
  broadcast({ type: 'HIGH_RISK_ALERT', data: {} });
  
  res.json({ alert: updated });
}));

module.exports = router;
