const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { analyzeECG } = require('../services/aiAnalysis');
const { broadcast, sendToUser } = require('../services/websocket');
const { sendPatientAlertNotifications } = require('../services/notifications');

// GET /api/v1/smartwatch/devices - Get user's linked smartwatch devices
router.get('/devices', authenticate, asyncHandler(async (req, res) => {
  const patient = db.findOne('patients', { user_id: req.user.id });
  if (!patient) {
    return res.status(404).json({ error: 'Patient profile not found' });
  }
  
  const devices = db.findAll('smartwatch_devices', { patient_id: patient.id });
  res.json({ devices });
}));

// POST /api/v1/smartwatch/devices - Link a new smartwatch device
router.post('/devices', authenticate, requireRole('PATIENT'), asyncHandler(async (req, res) => {
  const patient = db.findOne('patients', { user_id: req.user.id });
  if (!patient) {
    return res.status(404).json({ error: 'Patient profile not found' });
  }
  
  const { device_name, device_type, device_model, device_serial } = req.body;
  
  const device = db.insert('smartwatch_devices', {
    patient_id: patient.id,
    device_name: device_name || 'My Smartwatch',
    device_type: device_type || 'GENERIC',
    device_model: device_model || 'Unknown',
    device_serial: device_serial || `SERIAL-${Date.now()}`,
    status: 'LINKED',
    last_sync: new Date().toISOString(),
    battery_level: 85,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  res.status(201).json({ device });
}));

// POST /api/v1/smartwatch/ecg - Upload ECG data from smartwatch
router.post('/ecg', authenticate, requireRole('PATIENT'), asyncHandler(async (req, res) => {
  const patient = db.findOne('patients', { user_id: req.user.id });
  if (!patient) {
    return res.status(404).json({ error: 'Patient profile not found' });
  }

  const { device_id, ecg_data, features } = req.body;

  // Create ECG record marked as smartwatch
  const ecgRecord = db.insert('ecg_records', {
    patient_id: patient.id,
    hospital_id: patient.hospital_id,
    doctor_id: patient.doctor_id,
    device_id: device_id || null,
    file_name: `smartwatch_ecg_${patient.id}_${Date.now()}.json`,
    file_format: 'SMARTWATCH_JSON',
    sample_rate: ecg_data?.sample_rate || 100, // Most smartwatches are 100-200 Hz
    leads: 1, // Typically single lead (Lead I or II)
    duration_seconds: ecg_data?.duration_seconds || 30,
    source_type: 'SMARTWATCH',
    processing_status: 'PROCESSING',
    received_at: new Date().toISOString()
  });

  // Broadcast reception
  broadcast({
    type: 'ECG_RECEIVED',
    data: { patient_id: patient.id, ecg_record_id: ecgRecord.id, source: 'SMARTWATCH', status: 'PROCESSING' }
  });

  // Run AI analysis
  const analysisResult = await analyzeECG(features || {});

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

  // Update smartwatch last sync if device_id provided
  if (device_id) {
    db.update('smartwatch_devices', device_id, {
      last_sync: new Date().toISOString()
    });
  }

  // Update patient ECG profile
  const profile = db.findOne('patient_ecg_profiles', { patient_id: patient.id });
  if (profile) {
    db.update('patient_ecg_profiles', profile.id, {
      last_ecg_date: new Date().toISOString(),
      total_ecgs: (profile.total_ecgs || 0) + 1,
      last_risk_category: analysisResult.risk_category
    });
  }

  let alert = null;
  // Alert if HIGH risk
  if (analysisResult.risk_category === 'HIGH') {
    const alertData = {
      patient_id: patient.id,
      doctor_id: patient.doctor_id,
      ecg_record_id: ecgRecord.id,
      risk_level: analysisResult.risk_category,
      rhythm_class: analysisResult.rhythm_class,
      cvd_risk_score: analysisResult.cvd_risk_score,
      source_type: 'SMARTWATCH',
      sms_status: 'PENDING',
      email_status: 'PENDING',
      push_status: 'DELIVERED',
      resolution_status: 'PENDING',
      created_at: new Date().toISOString()
    };

    alert = db.insert('alerts', alertData);

    // Send notifications
    await sendPatientAlertNotifications(patient.id, alertData);

    // Update alert status with notification results
    db.update('alerts', alert.id, {
      sms_status: 'DELIVERED', // Simplified for demo
      email_status: 'DELIVERED',
      sms_delivered_at: new Date().toISOString()
    });

    // Notify doctor via WebSocket
    if (patient.doctor_id) {
      const doctor = db.findById('doctors', patient.doctor_id);
      if (doctor) {
        sendToUser(String(doctor.user_id), {
          type: 'HIGH_RISK_ALERT',
          data: { alert, patient_id: patient.id, rhythm: analysisResult.rhythm_class, score: analysisResult.cvd_risk_score }
        });
      }
    }
  }

  // Broadcast ECG analysis complete
  const patientUser = db.findById('users', patient.user_id);
  broadcast({
    type: 'ECG_ANALYSIS_COMPLETE',
    data: {
      patient_id: patient.id,
      patient_name: patientUser ? `${patientUser.first_name} ${patientUser.last_name}` : 'Unknown',
      ecg_record_id: ecgRecord.id,
      source: 'SMARTWATCH',
      rhythm_class: analysisResult.rhythm_class,
      cvd_risk_score: analysisResult.cvd_risk_score,
      risk_category: analysisResult.risk_category,
      confidence: analysisResult.confidence
    }
  });

  // Notify patient
  sendToUser(String(req.user.id), {
    type: 'NEW_ANALYSIS_RESULT',
    data: {
      source: 'SMARTWATCH',
      rhythm_class: analysisResult.rhythm_class,
      cvd_risk_score: analysisResult.cvd_risk_score,
      risk_category: analysisResult.risk_category,
      message: analysisResult.risk_category === 'HIGH' 
        ? '⚠️ High cardiovascular risk detected. Your doctor has been notified.' 
        : 'Your smartwatch ECG analysis is complete!'
    }
  });

  res.status(201).json({
    status: 'COMPLETE',
    ecg_record_id: ecgRecord.id,
    analysis_id: analysis.id,
    rhythm_class: analysisResult.rhythm_class,
    rhythm_confidence: analysisResult.confidence,
    cvd_risk_score: analysisResult.cvd_risk_score,
    risk_category: analysisResult.risk_category,
    alert_dispatched: analysisResult.risk_category === 'HIGH',
    alert_id: alert?.id || null,
    processing_time_ms: analysisResult.inference_latency_ms,
    recommendations: analysisResult.recommendations
  });
}));

// PATCH /api/v1/smartwatch/devices/:id - Update smartwatch device
router.patch('/devices/:id', authenticate, requireRole('PATIENT'), asyncHandler(async (req, res) => {
  const patient = db.findOne('patients', { user_id: req.user.id });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const device = db.findById('smartwatch_devices', parseInt(req.params.id));
  if (!device) return res.status(404).json({ error: 'Device not found' });
  if (device.patient_id !== patient.id) {
    return res.status(403).json({ error: 'Access denied to this device' });
  }

  const updated = db.update('smartwatch_devices', device.id, {
    ...req.body,
    updated_at: new Date().toISOString()
  });

  res.json({ device: updated });
}));

// DELETE /api/v1/smartwatch/devices/:id - Unlink smartwatch
router.delete('/devices/:id', authenticate, requireRole('PATIENT'), asyncHandler(async (req, res) => {
  const patient = db.findOne('patients', { user_id: req.user.id });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const device = db.findById('smartwatch_devices', parseInt(req.params.id));
  if (!device) return res.status(404).json({ error: 'Device not found' });
  if (device.patient_id !== patient.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.update('smartwatch_devices', device.id, {
    status: 'UNLINKED',
    updated_at: new Date().toISOString()
  });

  res.status(204).json();
}));

module.exports = router;
