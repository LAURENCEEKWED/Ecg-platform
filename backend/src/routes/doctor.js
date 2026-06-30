const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendPatientAlertNotifications } = require('../services/notifications');
const { analyzeECG } = require('../services/aiAnalysis');

// GET /api/v1/doctors/dashboard
router.get('/dashboard', authenticate, requireRole('DOCTOR'), asyncHandler(async (req, res) => {
  const doctorProfile = db.findOne('doctors', { user_id: req.user.id });
  if (!doctorProfile) return res.status(404).json({ error: 'Doctor profile not found' });

  const patients = db.findAll('patients', { doctor_id: doctorProfile.id });
  const pendingPatients = db.findAll('patients', { status: 'PENDING' });

  // Enrich active patients with latest analysis
  const enrichedPatients = patients.map(patient => {
    const analyses = db.query('ai_analyses', a => a.patient_id === patient.id);
    const latest = analyses.sort((a, b) => new Date(b.analyzed_at) - new Date(a.analyzed_at))[0];
    const ecgCount = db.findAll('ecg_records', { patient_id: patient.id }).length;
    const activeAlerts = db.query('alerts', a => a.patient_id === patient.id && a.resolution_status === 'PENDING');
    return {
      ...patient,
      latest_analysis: latest ? {
        ...latest,
        recommendations: JSON.parse(latest.recommendations || '[]')
      } : null,
      ecg_count: ecgCount,
      active_alerts: activeAlerts.length
    };
  });

  // Enrich pending patients with basic info
  const enrichedPendingPatients = pendingPatients.map(patient => {
    const analyses = db.query('ai_analyses', a => a.patient_id === patient.id);
    const latest = analyses.sort((a, b) => new Date(b.analyzed_at) - new Date(a.analyzed_at))[0];
    return {
      ...patient,
      latest_analysis: latest ? {
        ...latest,
        recommendations: JSON.parse(latest.recommendations || '[]')
      } : null
    };
  });

  // Sort: HIGH risk first, then MODERATE, then LOW
  const sortOrder = { HIGH: 0, MODERATE: 1, LOW: 2, undefined: 3 };
  enrichedPatients.sort((a, b) => {
    const aRisk = a.latest_analysis?.risk_category;
    const bRisk = b.latest_analysis?.risk_category;
    return (sortOrder[aRisk] ?? 3) - (sortOrder[bRisk] ?? 3);
  });

  // Stats
  const allAlerts = db.query('alerts', a => {
    return patients.some(p => p.id === a.patient_id);
  });
  const pendingAlerts = allAlerts.filter(a => a.resolution_status === 'PENDING');
  const highRiskPatients = enrichedPatients.filter(p => p.latest_analysis?.risk_category === 'HIGH');
  const todayECGs = db.query('ecg_records', r => {
    const today = new Date().toDateString();
    return patients.some(p => p.id === r.patient_id) && new Date(r.received_at).toDateString() === today;
  });

  const hospital = db.findById('hospitals', doctorProfile.hospital_id);

  res.json({
    doctor: { ...doctorProfile, ...req.user, password: undefined },
    hospital,
    patients: enrichedPatients,
    pending_patients: enrichedPendingPatients,
    stats: {
      total_patients: patients.length,
      pending_patients_count: pendingPatients.length,
      high_risk_count: highRiskPatients.length,
      pending_alerts: pendingAlerts.length,
      today_ecgs: todayECGs.length,
      total_analyses: db.query('ai_analyses', a => patients.some(p => p.id === a.patient_id)).length
    }
  });
}));

// GET /api/v1/doctors/patients/pending
router.get('/patients/pending', authenticate, requireRole('DOCTOR'), asyncHandler(async (req, res) => {
  const pendingPatients = db.findAll('patients', { status: 'PENDING' });
  
  const enrichedPending = pendingPatients.map(patient => {
    const analyses = db.query('ai_analyses', a => a.patient_id === patient.id);
    const latest = analyses.sort((a, b) => new Date(b.analyzed_at) - new Date(a.analyzed_at))[0];
    return {
      ...patient,
      latest_analysis: latest ? {
        ...latest,
        recommendations: JSON.parse(latest.recommendations || '[]')
      } : null
    };
  });

  res.json({ pending_patients: enrichedPending });
}));

// POST /api/v1/doctors/patients/:patientId/accept
router.post('/patients/:patientId/accept', authenticate, requireRole('DOCTOR'), asyncHandler(async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  const doctorProfile = db.findOne('doctors', { user_id: req.user.id });

  if (!doctorProfile) {
    return res.status(404).json({ error: 'Doctor profile not found' });
  }

  const patient = db.findById('patients', patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  if (patient.status !== 'PENDING') {
    return res.status(400).json({ error: 'Patient is no longer pending' });
  }

  // Accept the patient
  const updatedPatient = db.update('patients', patientId, {
    doctor_id: doctorProfile.id,
    status: 'ACTIVE'
  });

  // Update doctor's patient count
  db.update('doctors', doctorProfile.id, {
    total_patients: db.count('patients', { doctor_id: doctorProfile.id })
  });

  res.json({
    message: 'Patient accepted successfully',
    patient: updatedPatient
  });
}));

// GET /api/v1/doctors/:id/patients
router.get('/:id/patients', authenticate, requireRole('DOCTOR', 'ADMIN'), asyncHandler(async (req, res) => {
  const doctorId = parseInt(req.params.id);
  const patients = db.findAll('patients', { doctor_id: doctorId });
  res.json({ patients });
}));

// GET /api/v1/doctors/alerts
router.get('/alerts/all', authenticate, requireRole('DOCTOR'), asyncHandler(async (req, res) => {
  const doctorProfile = db.findOne('doctors', { user_id: req.user.id });
  const patients = db.findAll('patients', { doctor_id: doctorProfile.id });
  const alerts = db.query('alerts', a => patients.some(p => p.id === a.patient_id));

  const enrichedAlerts = alerts.map(alert => {
    const patient = db.findById('patients', alert.patient_id);
    const patientUser = patient ? db.findById('users', patient.user_id) : null;
    return {
      ...alert,
      patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown',
      patient: patient
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ alerts: enrichedAlerts });
}));

// PATCH /api/v1/doctors/alerts/:alertId/acknowledge
router.patch('/alerts/:alertId/acknowledge', authenticate, requireRole('DOCTOR'), asyncHandler(async (req, res) => {
  const alertId = parseInt(req.params.alertId);
  const alert = db.findById('alerts', alertId);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  const updated = db.update('alerts', alertId, {
    resolution_status: 'RESOLVED',
    resolved_at: new Date().toISOString(),
    resolved_by: req.user.id
  });
  res.json({ alert: updated, message: 'Alert acknowledged successfully' });
}));

// GET /api/v1/doctors/profile
router.get('/profile', authenticate, requireRole('DOCTOR'), asyncHandler(async (req, res) => {
  const doctorProfile = db.findOne('doctors', { user_id: req.user.id });
  const hospital = doctorProfile ? db.findById('hospitals', doctorProfile.hospital_id) : null;
  const { password: _, ...safeUser } = req.user;
  res.json({ user: safeUser, doctor: doctorProfile, hospital });
}));

// PUT /api/v1/doctors/profile
router.put('/profile', authenticate, requireRole('DOCTOR'), asyncHandler(async (req, res) => {
  const { first_name, last_name, phone, specialization, department, profile_picture } = req.body;
  db.update('users', req.user.id, { first_name, last_name, phone, profile_picture });
  const doctorProfile = db.findOne('doctors', { user_id: req.user.id });
  if (doctorProfile) {
    db.update('doctors', doctorProfile.id, { specialization, department });
  }
  res.json({ message: 'Profile updated successfully' });
}));

// POST /api/v1/doctors/patients/:patientId/trigger-alert
router.post('/patients/:patientId/trigger-alert', authenticate, requireRole('DOCTOR'), asyncHandler(async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  const doctorProfile = db.findOne('doctors', { user_id: req.user.id });

  // Verify patient exists and is under this doctor's care
  const patient = db.findById('patients', patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  if (patient.doctor_id !== doctorProfile.id) return res.status(403).json({ error: 'This patient is not under your care' });

  // Generate a high-risk ECG analysis
  const analysisResult = await analyzeECG({
    heart_rate_bpm: 145,
    qt_interval_ms: 380,
    qrs_duration_ms: 82,
    hrv_rmssd_ms: 18
  });

  // Override to ensure high risk alert
  const finalAnalysis = {
    ...analysisResult,
    rhythm_class: 'AFIB',
    risk_category: 'HIGH',
    cvd_risk_score: 85
  };

  // Create an ECG record
  const ecgRecord = db.insert('ecg_records', {
    patient_id: patientId,
    hospital_id: doctorProfile.hospital_id,
    doctor_id: doctorProfile.id,
    file_name: `triggered_ecg_${Date.now()}.json`,
    file_format: 'JSON-SIMULATED',
    sample_rate: 500,
    leads: 12,
    duration_seconds: 30,
    processing_status: 'COMPLETE',
    received_at: new Date().toISOString()
  });

  // Save AI analysis
  db.insert('ai_analyses', {
    ecg_record_id: ecgRecord.id,
    patient_id: patientId,
    rhythm_class: finalAnalysis.rhythm_class,
    rhythm_confidence: finalAnalysis.confidence,
    cvd_risk_score: finalAnalysis.cvd_risk_score,
    risk_category: finalAnalysis.risk_category,
    heart_rate_bpm: finalAnalysis.heart_rate_bpm,
    qt_interval_ms: finalAnalysis.qt_interval_ms,
    qrs_duration_ms: finalAnalysis.qrs_duration_ms,
    recommendations: JSON.stringify(finalAnalysis.recommendations),
    model_version: finalAnalysis.model_version,
    analyzed_at: new Date().toISOString()
  });

  // Create alert
  const alert = db.insert('alerts', {
    patient_id: patientId,
    doctor_id: doctorProfile.id,
    ecg_record_id: ecgRecord.id,
    risk_level: finalAnalysis.risk_category,
    rhythm_class: finalAnalysis.rhythm_class,
    cvd_risk_score: finalAnalysis.cvd_risk_score,
    sms_status: 'PENDING',
    email_status: 'PENDING',
    push_status: 'DELIVERED',
    resolution_status: 'PENDING',
    created_at: new Date().toISOString()
  });

  // Send notifications
  const notificationResults = await sendPatientAlertNotifications(patientId, alert);

  // Update alert status
  db.update('alerts', alert.id, {
    sms_status: notificationResults.results.sms?.success ? 'DELIVERED' : 'FAILED',
    email_status: notificationResults.results.email?.success ? 'DELIVERED' : 'FAILED',
    sms_delivered_at: notificationResults.results.sms?.success ? new Date().toISOString() : null
  });

  res.json({
    message: 'Alert triggered and notifications sent successfully!',
    alert,
    analysis: finalAnalysis,
    notifications: notificationResults
  });
}));

module.exports = router;
