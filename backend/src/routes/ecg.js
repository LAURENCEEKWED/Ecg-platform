const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireRole, authenticateHospital } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { analyzeECG } = require('../services/aiAnalysis');
const { broadcast, sendToRole, sendToUser } = require('../services/websocket');
const { sendPatientAlertNotifications } = require('../services/notifications');

// POST /api/v1/ecg/upload - Hospital ECG submission
router.post('/upload', authenticateHospital, asyncHandler(async (req, res) => {
  const { patient_identifier, ecg_data, format = 'JSON', checksum } = req.body;
  if (!patient_identifier || !ecg_data) {
    return res.status(400).json({ error: 'patient_identifier and ecg_data are required' });
  }

  // Find or create patient
  let patient = db.findOne('patients', { phone: patient_identifier }) ||
                db.findOne('users', { email: patient_identifier });
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found. Register patient before submitting ECG.' });
  }
  if (patient.role) patient = db.findOne('patients', { user_id: patient.id });

  // Create ECG record
  const ecgRecord = db.insert('ecg_records', {
    patient_id: patient.id,
    hospital_id: req.hospital.id,
    doctor_id: patient.doctor_id,
    file_name: `ecg_${patient.id}_${Date.now()}.json`,
    file_format: format,
    sample_rate: ecg_data.sample_rate || 500,
    leads: ecg_data.leads || 12,
    duration_seconds: ecg_data.duration_seconds || 30,
    processing_status: 'PROCESSING',
    received_at: new Date().toISOString()
  });

  // Update hospital stats
  db.update('hospitals', req.hospital.id, {
    total_ecg_transmitted: (req.hospital.total_ecg_transmitted || 0) + 1,
    last_transmission: new Date().toISOString()
  });

  // Broadcast reception event
  broadcast({ type: 'ECG_RECEIVED', data: { patient_id: patient.id, ecg_record_id: ecgRecord.id, hospital: req.hospital.name, status: 'PROCESSING' } });

  // Run AI analysis
  const analysisResult = await analyzeECG(ecg_data.features || {});

  // Save analysis
  const analysis = db.insert('ai_analyses', {
    ecg_record_id: ecgRecord.id,
    patient_id: patient.id,
    rhythm_class: analysisResult.rhythm_class,
    rhythm_confidence: analysisResult.confidence,
    cvd_risk_score: analysisResult.cvd_risk_score,
    risk_category: analysisResult.risk_category,
    heart_rate_bpm: analysisResult.heart_rate_bpm,
    qt_interval_ms: analysisResult.qt_interval_ms,
    qrs_duration_ms: analysisResult.qrs_duration_ms,
    pr_interval_ms: analysisResult.pr_interval_ms,
    st_deviation_mm: analysisResult.st_deviation_mm,
    hrv_rmssd_ms: analysisResult.hrv_rmssd_ms,
    p_wave_axis: analysisResult.p_wave_axis,
    recommendations: JSON.stringify(analysisResult.recommendations),
    model_version: analysisResult.model_version,
    inference_latency_ms: analysisResult.inference_latency_ms,
    analyzed_at: new Date().toISOString()
  });

  // Update ECG record status
  db.update('ecg_records', ecgRecord.id, {
    processing_status: 'COMPLETE',
    processing_time_ms: analysisResult.inference_latency_ms
  });

  // Alert if HIGH risk
  if (analysisResult.risk_category === 'HIGH') {
    const alertData = {
      patient_id: patient.id,
      doctor_id: patient.doctor_id,
      ecg_record_id: ecgRecord.id,
      risk_level: analysisResult.risk_category,
      rhythm_class: analysisResult.rhythm_class,
      cvd_risk_score: analysisResult.cvd_risk_score,
      sms_status: 'PENDING',
      email_status: 'PENDING',
      push_status: 'DELIVERED',
      resolution_status: 'PENDING',
      created_at: new Date().toISOString()
    };
    
    const alert = db.insert('alerts', alertData);
    
    // Send notifications
    const notificationResults = await sendPatientAlertNotifications(patient.id, alertData);
    
    // Update alert status based on notification results
    db.update('alerts', alert.id, {
      sms_status: notificationResults.results.sms?.success ? 'DELIVERED' : 'FAILED',
      email_status: notificationResults.results.email?.success ? 'DELIVERED' : 'FAILED',
      sms_delivered_at: notificationResults.results.sms?.success ? new Date().toISOString() : null
    });

    // WebSocket alert to doctor
    if (patient.doctor_id) {
      const doctor = db.findById('doctors', patient.doctor_id);
      if (doctor) sendToUser(String(doctor.user_id), {
        type: 'HIGH_RISK_ALERT',
        data: { alert, patient_id: patient.id, rhythm: analysisResult.rhythm_class, score: analysisResult.cvd_risk_score }
      });
    }
  }

  // WebSocket result to doctor and patient
  const patientUser = db.findById('users', patient.user_id);
  broadcast({
    type: 'ECG_ANALYSIS_COMPLETE',
    data: {
      patient_id: patient.id,
      patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown',
      ecg_record_id: ecgRecord.id,
      rhythm_class: analysisResult.rhythm_class,
      cvd_risk_score: analysisResult.cvd_risk_score,
      risk_category: analysisResult.risk_category,
      confidence: analysisResult.confidence,
      processing_time_ms: analysisResult.inference_latency_ms,
      hospital: req.hospital.name
    }
  });

  // Push notification to patient
  if (patientUser) {
    sendToUser(String(patientUser.id), {
      type: 'NEW_ANALYSIS_RESULT',
      data: {
        rhythm_class: analysisResult.rhythm_class,
        cvd_risk_score: analysisResult.cvd_risk_score,
        risk_category: analysisResult.risk_category,
        message: analysisResult.risk_category === 'HIGH'
          ? '⚠️ High cardiovascular risk detected. Your doctor has been notified.'
          : `Your ECG analysis is complete. Risk: ${analysisResult.risk_category}`
      }
    });
  }

  res.status(201).json({
    status: 'COMPLETE',
    ecg_record_id: ecgRecord.id,
    analysis_id: analysis.id,
    rhythm_class: analysisResult.rhythm_class,
    rhythm_confidence: analysisResult.confidence,
    cvd_risk_score: analysisResult.cvd_risk_score,
    risk_category: analysisResult.risk_category,
    alert_dispatched: analysisResult.risk_category === 'HIGH',
    processing_time_ms: analysisResult.inference_latency_ms,
    recommendations: analysisResult.recommendations
  });
}));

// POST /api/v1/ecg/simulate - Simulate ECG upload (testing/demo)
router.post('/simulate', authenticate, requireRole('DOCTOR', 'ADMIN'), asyncHandler(async (req, res) => {
  const { patient_id, rhythm_class } = req.body;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  const patient = db.findById('patients', parseInt(patient_id));
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Simulate ECG data based on requested rhythm
  const simulatedFeatures = {
    NORMAL: { heart_rate_bpm: 72, qt_interval_ms: 420, qrs_duration_ms: 88, pr_interval_ms: 160, st_deviation_mm: 0.1, hrv_rmssd_ms: 45, p_wave_present: true, rr_irregular: false },
    TACHYCARDIA: { heart_rate_bpm: 145, qt_interval_ms: 380, qrs_duration_ms: 82, pr_interval_ms: 148, st_deviation_mm: 0.3, hrv_rmssd_ms: 18, p_wave_present: true, rr_irregular: false },
    BRADYCARDIA: { heart_rate_bpm: 42, qt_interval_ms: 460, qrs_duration_ms: 95, pr_interval_ms: 178, st_deviation_mm: 0.2, hrv_rmssd_ms: 52, p_wave_present: true, rr_irregular: false },
    AFIB: { heart_rate_bpm: 88, qt_interval_ms: 465, qrs_duration_ms: 90, pr_interval_ms: null, st_deviation_mm: 0.5, hrv_rmssd_ms: 8, p_wave_present: false, rr_irregular: true },
    PVC: { heart_rate_bpm: 76, qt_interval_ms: 440, qrs_duration_ms: 148, pr_interval_ms: 162, st_deviation_mm: 0.2, hrv_rmssd_ms: 22, p_wave_present: true, rr_irregular: false }
  };

  const features = simulatedFeatures[rhythm_class] || simulatedFeatures.NORMAL;
  const hospital = db.findById('hospitals', patient.hospital_id) || db.findAll('hospitals')[0];

  const ecgRecord = db.insert('ecg_records', {
    patient_id: patient.id,
    hospital_id: hospital?.id || 1,
    doctor_id: patient.doctor_id,
    file_name: `sim_ecg_${patient.id}_${Date.now()}.json`,
    file_format: 'JSON-SIMULATED',
    sample_rate: 500,
    leads: 12,
    duration_seconds: 30,
    processing_status: 'COMPLETE',
    received_at: new Date().toISOString(),
  });

  const analysisResult = await analyzeECG(features);

  const analysis = db.insert('ai_analyses', {
    ecg_record_id: ecgRecord.id,
    patient_id: patient.id,
    rhythm_class: analysisResult.rhythm_class,
    rhythm_confidence: analysisResult.confidence,
    cvd_risk_score: analysisResult.cvd_risk_score,
    risk_category: analysisResult.risk_category,
    heart_rate_bpm: analysisResult.heart_rate_bpm,
    qt_interval_ms: analysisResult.qt_interval_ms,
    qrs_duration_ms: analysisResult.qrs_duration_ms,
    pr_interval_ms: analysisResult.pr_interval_ms,
    st_deviation_mm: analysisResult.st_deviation_mm,
    hrv_rmssd_ms: analysisResult.hrv_rmssd_ms,
    p_wave_axis: analysisResult.p_wave_axis,
    recommendations: JSON.stringify(analysisResult.recommendations),
    model_version: analysisResult.model_version,
    inference_latency_ms: analysisResult.inference_latency_ms,
    analyzed_at: new Date().toISOString()
  });

  db.update('ecg_records', ecgRecord.id, { processing_time_ms: analysisResult.inference_latency_ms });

  if (analysisResult.risk_category === 'HIGH') {
    const alertData = {
      patient_id: patient.id,
      doctor_id: patient.doctor_id,
      ecg_record_id: ecgRecord.id,
      risk_level: analysisResult.risk_category,
      rhythm_class: analysisResult.rhythm_class,
      cvd_risk_score: analysisResult.cvd_risk_score,
      sms_status: 'PENDING',
      email_status: 'PENDING',
      push_status: 'DELIVERED',
      resolution_status: 'PENDING',
      created_at: new Date().toISOString()
    };
    
    const alert = db.insert('alerts', alertData);
    
    // Send notifications
    const notificationResults = await sendPatientAlertNotifications(patient.id, alertData);
    
    // Update alert status
    db.update('alerts', alert.id, {
      sms_status: notificationResults.results.sms?.success ? 'DELIVERED' : 'FAILED',
      email_status: notificationResults.results.email?.success ? 'DELIVERED' : 'FAILED',
      sms_delivered_at: notificationResults.results.sms?.success ? new Date().toISOString() : null
    });
  }

  broadcast({
    type: 'ECG_ANALYSIS_COMPLETE',
    data: {
      patient_id: patient.id,
      ecg_record_id: ecgRecord.id,
      rhythm_class: analysisResult.rhythm_class,
      cvd_risk_score: analysisResult.cvd_risk_score,
      risk_category: analysisResult.risk_category,
      simulated: true
    }
  });

  res.json({
    message: 'ECG simulation complete',
    analysis: { ...analysis, recommendations: JSON.parse(analysis.recommendations) }
  });
}));

module.exports = router;
