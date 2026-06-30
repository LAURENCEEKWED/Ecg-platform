const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateECGWaveform } = require('../services/aiAnalysis');

// GET /api/v1/patients/dashboard - patient's own dashboard
router.get('/dashboard', authenticate, requireRole('PATIENT'), asyncHandler(async (req, res) => {
  const patient = db.findOne('patients', { user_id: req.user.id });
  if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

  const ecgRecords = db.findAll('ecg_records', { patient_id: patient.id })
    .sort((a, b) => new Date(b.received_at) - new Date(a.received_at));

  const analyses = db.findAll('ai_analyses', { patient_id: patient.id })
    .sort((a, b) => new Date(b.analyzed_at) - new Date(a.analyzed_at));

  const latestAnalysis = analyses[0];
  const alerts = db.findAll('alerts', { patient_id: patient.id })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const pendingAlerts = alerts.filter(a => a.resolution_status === 'PENDING');
  const pendingHighAlerts = pendingAlerts.filter(a => a.risk_level === 'HIGH');

  // Doctor info
  const doctor = patient.doctor_id ? db.findById('doctors', patient.doctor_id) : null;
  const doctorUser = doctor ? db.findById('users', doctor.user_id) : null;
  const hospital = patient.hospital_id ? db.findById('hospitals', patient.hospital_id) : null;

  // Risk trend (last 4 analyses)
  const riskTrend = analyses.slice(0, 4).map(a => ({
    date: a.analyzed_at,
    cvd_risk_score: a.cvd_risk_score,
    risk_category: a.risk_category,
    rhythm_class: a.rhythm_class
  })).reverse();

  res.json({
    patient,
    user: { ...req.user, password: undefined },
    latest_analysis: latestAnalysis ? {
      ...latestAnalysis,
      recommendations: JSON.parse(latestAnalysis.recommendations || '[]')
    } : null,
    ecg_history: ecgRecords.slice(0, 10),
    recent_analyses: analyses.slice(0, 5).map(a => ({
      ...a,
      recommendations: JSON.parse(a.recommendations || '[]')
    })),
    alerts: alerts.slice(0, 5),
    pending_alerts: pendingAlerts,
    pending_high_alerts: pendingHighAlerts,
    risk_trend: riskTrend,
    doctor: doctorUser ? {
      name: `Dr. ${doctorUser.first_name} ${doctorUser.last_name}`,
      specialization: doctor?.specialization,
      phone: doctorUser.phone,
      email: doctorUser.email
    } : null,
    hospital,
    stats: {
      total_ecgs: ecgRecords.length,
      total_alerts: alerts.length,
      pending_alerts: pendingAlerts.length,
      latest_risk: latestAnalysis?.risk_category || 'N/A',
      latest_score: latestAnalysis?.cvd_risk_score || null
    }
  });
}));

// GET /api/v1/patients/:id/analysis
router.get('/:id/analysis', authenticate, asyncHandler(async (req, res) => {
  const patientId = parseInt(req.params.id);
  const patient = db.findById('patients', patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Authorization check
  if (req.user.role === 'PATIENT' && patient.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const analyses = db.findAll('ai_analyses', { patient_id: patientId })
    .sort((a, b) => new Date(b.analyzed_at) - new Date(a.analyzed_at));

  const latest = analyses[0];
  if (!latest) return res.json({ analysis: null });

  res.json({
    analysis: {
      ...latest,
      recommendations: JSON.parse(latest.recommendations || '[]')
    }
  });
}));

// GET /api/v1/patients/:id/ecg-history
router.get('/:id/ecg-history', authenticate, asyncHandler(async (req, res) => {
  const patientId = parseInt(req.params.id);
  const patient = db.findById('patients', patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  if (req.user.role === 'PATIENT' && patient.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const ecgRecords = db.findAll('ecg_records', { patient_id: patientId })
    .sort((a, b) => new Date(b.received_at) - new Date(a.received_at));

  const enrichedRecords = ecgRecords.map(ecg => {
    const analysis = db.findOne('ai_analyses', { ecg_record_id: ecg.id });
    const hospital = db.findById('hospitals', ecg.hospital_id);
    return {
      ...ecg,
      analysis: analysis ? { ...analysis, recommendations: JSON.parse(analysis.recommendations || '[]') } : null,
      hospital_name: hospital?.name
    };
  });

  res.json({ ecg_history: enrichedRecords });
}));

// GET /api/v1/patients/:id/waveform/:recordId
router.get('/:id/waveform/:recordId', authenticate, asyncHandler(async (req, res) => {
  const patientId = parseInt(req.params.id);
  const ecgId = parseInt(req.params.recordId);

  const analysis = db.findOne('ai_analyses', { ecg_record_id: ecgId });
  const rhythmClass = analysis?.rhythm_class || 'NORMAL';

  // Generate realistic ECG waveform
  const waveformData = generateECGWaveform(rhythmClass, 5, 500);

  res.json({
    ecg_record_id: ecgId,
    rhythm_class: rhythmClass,
    sample_rate: 500,
    duration_seconds: 5,
    leads: ['II'],
    data: waveformData,
    r_peaks: detectRPeaks(waveformData),
    labels: { title: 'Lead II ECG', units: 'mV' }
  });
}));

// GET /api/v1/patients/:id/report
router.get('/:id/report', authenticate, asyncHandler(async (req, res) => {
  const patientId = parseInt(req.params.id);
  const patient = db.findById('patients', patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const patientUser = db.findById('users', patient.user_id);
  const analyses = db.findAll('ai_analyses', { patient_id: patientId })
    .sort((a, b) => new Date(b.analyzed_at) - new Date(a.analyzed_at));
  const latestAnalysis = analyses[0];
  const doctor = patient.doctor_id ? db.findById('doctors', patient.doctor_id) : null;
  const doctorUser = doctor ? db.findById('users', doctor.user_id) : null;
  const hospital = patient.hospital_id ? db.findById('hospitals', patient.hospital_id) : null;

  res.json({
    report: {
      generated_at: new Date().toISOString(),
      patient: { ...patient, ...patientUser, password: undefined },
      latest_analysis: latestAnalysis ? { ...latestAnalysis, recommendations: JSON.parse(latestAnalysis.recommendations || '[]') } : null,
      analyses_history: analyses.slice(0, 5).map(a => ({ ...a, recommendations: JSON.parse(a.recommendations || '[]') })),
      doctor: doctorUser ? { name: `Dr. ${doctorUser.first_name} ${doctorUser.last_name}`, specialization: doctor?.specialization } : null,
      hospital
    }
  });
}));

function detectRPeaks(data) {
  const peaks = [];
  const threshold = 0.8;
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] > 50) peaks.push(i);
    }
  }
  return peaks;
}

// POST /api/v1/patients (admin creates patient)
router.post('/', authenticate, requireRole('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { first_name, last_name, email, phone, dob, gender, blood_type, doctor_id, hospital_id, weight_kg, height_cm } = req.body;

  if (!first_name || !last_name || !email) return res.status(400).json({ error: 'Name and email required' });

  const existingUser = db.findOne('users', { email });
  if (existingUser) return res.status(409).json({ error: 'Email already registered' });

  const tempPassword = 'patient123';
  const hashed = await bcrypt.hash(tempPassword, 10);
  const user = db.insert('users', { email, password: hashed, role: 'PATIENT', first_name, last_name, phone, status: 'ACTIVE' });
  const patient = db.insert('patients', { user_id: user.id, first_name, last_name, email, phone, dob, gender, blood_type, doctor_id, hospital_id, weight_kg, height_cm, status: 'ACTIVE' });
  
  // Create default ECG profile for patient
  const ecgProfile = db.insert('patient_ecg_profiles', {
    patient_id: patient.id,
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
  
  // Create default settings for new user
  db.insert('settings', {
    user_id: user.id,
    email_notifications: true,
    sms_notifications: true,
    dark_mode: false,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  res.status(201).json({ patient, ecg_profile: ecgProfile, message: `Patient created. Temp password: ${tempPassword}` });
}));

// PUT /api/v1/patients/profile - update patient's own profile
router.put('/profile', authenticate, requireRole('PATIENT'), asyncHandler(async (req, res) => {
  const { first_name, last_name, phone, profile_picture, dob, gender } = req.body;
  // Update user table
  db.update('users', req.user.id, { first_name, last_name, phone, profile_picture });
  // Update patient table
  const patientProfile = db.findOne('patients', { user_id: req.user.id });
  if (patientProfile) {
    db.update('patients', patientProfile.id, { dob, gender });
  }
  res.json({ message: 'Profile updated successfully' });
}));

module.exports = router;
