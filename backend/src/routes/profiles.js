const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/v1/profiles/ecg/:patientId - get patient's ECG profile
router.get('/ecg/:patientId', authenticate, asyncHandler(async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  const patient = db.findById('patients', patientId);
  
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Authorization check
  if (req.user.role === 'PATIENT' && patient.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user.role === 'DOCTOR') {
    const doctor = db.findOne('doctors', { user_id: req.user.id });
    if (patient.doctor_id !== doctor?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  let profile = db.findOne('patient_ecg_profiles', { patient_id: patientId });
  
  // If no profile, create one
  if (!profile) {
    profile = db.insert('patient_ecg_profiles', {
      patient_id: patientId,
      baseline_risk_score: 15,
      last_ecg_date: null,
      total_ecgs: 0,
      last_risk_category: 'LOW',
      medical_history: JSON.stringify([]),
      medications: JSON.stringify([]),
      allergies: JSON.stringify([]),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // Parse JSON fields
  const enrichedProfile = {
    ...profile,
    medical_history: JSON.parse(profile.medical_history || '[]'),
    medications: JSON.parse(profile.medications || '[]'),
    allergies: JSON.parse(profile.allergies || '[]')
  };

  res.json({ ecg_profile: enrichedProfile });
}));

// PUT /api/v1/profiles/ecg/:patientId - update patient's ECG profile
router.put('/ecg/:patientId', authenticate, asyncHandler(async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  const patient = db.findById('patients', patientId);
  
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Authorization check
  if (req.user.role === 'PATIENT' && patient.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user.role === 'DOCTOR') {
    const doctor = db.findOne('doctors', { user_id: req.user.id });
    if (patient.doctor_id !== doctor?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  let profile = db.findOne('patient_ecg_profiles', { patient_id: patientId });
  
  if (!profile) {
    profile = db.insert('patient_ecg_profiles', {
      patient_id: patientId,
      baseline_risk_score: 15,
      last_ecg_date: null,
      total_ecgs: 0,
      last_risk_category: 'LOW',
      medical_history: JSON.stringify(req.body.medical_history || []),
      medications: JSON.stringify(req.body.medications || []),
      allergies: JSON.stringify(req.body.allergies || []),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } else {
    const updates = {};
    if (req.body.medical_history !== undefined) {
      updates.medical_history = JSON.stringify(req.body.medical_history);
    }
    if (req.body.medications !== undefined) {
      updates.medications = JSON.stringify(req.body.medications);
    }
    if (req.body.allergies !== undefined) {
      updates.allergies = JSON.stringify(req.body.allergies);
    }
    if (req.body.baseline_risk_score !== undefined) {
      updates.baseline_risk_score = req.body.baseline_risk_score;
    }
    updates.updated_at = new Date().toISOString();
    
    profile = db.update('patient_ecg_profiles', profile.id, updates);
  }

  // Parse JSON fields
  const enrichedProfile = {
    ...profile,
    medical_history: JSON.parse(profile.medical_history || '[]'),
    medications: JSON.parse(profile.medications || '[]'),
    allergies: JSON.parse(profile.allergies || '[]')
  };

  res.json({ ecg_profile: enrichedProfile });
}));

// GET /api/v1/profiles/risk-predictions/:patientId - get patient's risk predictions history
router.get('/risk-predictions/:patientId', authenticate, asyncHandler(async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  const patient = db.findById('patients', patientId);
  
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Authorization check
  if (req.user.role === 'PATIENT' && patient.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user.role === 'DOCTOR') {
    const doctor = db.findOne('doctors', { user_id: req.user.id });
    if (patient.doctor_id !== doctor?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  const predictions = db.findAll('risk_predictions', { patient_id: patientId })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(pred => ({
      ...pred,
      prediction_details: JSON.parse(pred.prediction_details || '{}')
    }));

  res.json({ risk_predictions: predictions });
}));

module.exports = router;
