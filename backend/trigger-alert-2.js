
const db = require('./src/config/database');
const { sendPatientAlertNotifications } = require('./src/services/notifications');
const { analyzeECG } = require('./src/services/aiAnalysis');
const bcrypt = require('bcryptjs');

console.log('🚀 Starting alert trigger script (fixed doctor name)...\n');

const initializeDB = async () => {
  // First, seed the database
  console.log('📂 Initializing database seed...');
  const { initializeDatabase } = require('./src/utils/dbInit');
  await initializeDatabase();

  // Find Ekwe Daniel
  let ekweUser = db.findOne('users', { first_name: 'Ekwe', last_name: 'Daniel' });
  if (!ekweUser) {
    console.error('❌ Ekwe Daniel not found!');
    return;
  }
  let ekwePatient = db.findOne('patients', { user_id: ekweUser.id });
  if (!ekwePatient) {
    console.error('❌ Ekwe Daniel patient not found!');
    return;
  }

  console.log('👤 Found Ekwe Daniel');
  console.log('📊 Creating a high-risk ECG record for Ekwe Daniel...');

  const ecgRecord = db.insert('ecg_records', {
    patient_id: ekwePatient.id,
    hospital_id: ekwePatient.hospital_id,
    doctor_id: ekwePatient.doctor_id,
    file_name: `ecg_${ekwePatient.id}_alert_test2.json`,
    file_format: 'JSON-SIMULATED',
    sample_rate: 500,
    leads: 12,
    duration_seconds: 30,
    processing_status: 'COMPLETE',
    received_at: new Date().toISOString()
  });

  console.log('🤖 Running AI analysis...');
  const analysisResult = await analyzeECG({
    heart_rate_bpm: 88,
    qt_interval_ms: 465,
    qrs_duration_ms: 90,
    hrv_rmssd_ms: 8
  });
  analysisResult.rhythm_class = 'TACHYCARDIA';
  analysisResult.risk_category = 'HIGH';
  analysisResult.cvd_risk_score = 75;

  const analysis = db.insert('ai_analyses', {
    ecg_record_id: ecgRecord.id,
    patient_id: ekwePatient.id,
    rhythm_class: analysisResult.rhythm_class,
    rhythm_confidence: analysisResult.confidence,
    cvd_risk_score: analysisResult.cvd_risk_score,
    risk_category: analysisResult.risk_category,
    heart_rate_bpm: analysisResult.heart_rate_bpm,
    qt_interval_ms: analysisResult.qt_interval_ms,
    qrs_duration_ms: analysisResult.qrs_duration_ms,
    recommendations: JSON.stringify(analysisResult.recommendations),
    model_version: analysisResult.model_version,
    analyzed_at: new Date().toISOString()
  });

  console.log('⚠️  Creating high-risk alert...');
  const alert = db.insert('alerts', {
    patient_id: ekwePatient.id,
    doctor_id: ekwePatient.doctor_id,
    ecg_record_id: ecgRecord.id,
    risk_level: analysisResult.risk_category,
    rhythm_class: analysisResult.rhythm_class,
    cvd_risk_score: analysisResult.cvd_risk_score,
    sms_status: 'PENDING',
    email_status: 'PENDING',
    push_status: 'DELIVERED',
    resolution_status: 'PENDING',
    created_at: new Date().toISOString()
  });

  console.log('📧 Sending notifications...');
  const notificationResults = await sendPatientAlertNotifications(ekwePatient.id, alert);

  db.update('alerts', alert.id, {
    sms_status: notificationResults.results.sms?.success ? 'DELIVERED' : 'FAILED',
    email_status: notificationResults.results.email?.success ? 'DELIVERED' : 'FAILED',
    sms_delivered_at: notificationResults.results.sms?.success ? new Date().toISOString() : null
  });

  console.log('\n🎉 Alert triggered successfully! Doctor name fixed!');
  console.log('  - Patient: Ekwe Daniel');
  console.log('  - Rhythm:', analysisResult.rhythm_class);
  console.log('  - Risk Category:', analysisResult.risk_category);
  console.log('  - Risk Score:', analysisResult.cvd_risk_score);
};

initializeDB().catch(err => console.error(err));
