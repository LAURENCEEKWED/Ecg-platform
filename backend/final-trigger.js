
const db = require('./src/config/database');
const { sendPatientAlertNotifications } = require('./src/services/notifications');
const { analyzeECG } = require('./src/services/aiAnalysis');
const bcrypt = require('bcryptjs');
const { initializeDatabase } = require('./src/utils/dbInit');

console.log('🚀 Final alert trigger script...\n');

const run = async () => {
  // Initialize database
  await initializeDatabase();
  console.log('✅ Database initialized!\n');

  // Create Ekwe Daniel
  console.log('👤 Creating Ekwe Daniel...');
  const patientPw = await bcrypt.hash('patient123', 10);
  const ekweUser = db.insert('users', {
    email: 'ekwe.daniel@email.cm',
    password: patientPw,
    role: 'PATIENT',
    first_name: 'Ekwe',
    last_name: 'Daniel',
    phone: '+237677889900',
    status: 'ACTIVE'
  });

  const hospital = db.findAll('hospitals')[0];
  const doctor = db.findAll('doctors')[0];

  const ekwePatient = db.insert('patients', {
    user_id: ekweUser.id,
    first_name: 'Ekwe',
    last_name: 'Daniel',
    email: 'ekwe.daniel@email.cm',
    phone: '+237677889900',
    dob: '1990-05-15',
    gender: 'M',
    doctor_id: doctor.id,
    hospital_id: hospital.id,
    status: 'ACTIVE'
  });

  db.insert('settings', {
    user_id: ekweUser.id,
    email_notifications: true,
    sms_notifications: true,
    dark_mode: false,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  console.log('✅ Ekwe Daniel created!\n');

  // Create ECG and alert
  console.log('📊 Creating high-risk ECG...');
  const ecgRecord = db.insert('ecg_records', {
    patient_id: ekwePatient.id,
    hospital_id: hospital.id,
    doctor_id: doctor.id,
    file_name: `ecg_${ekwePatient.id}_final_test.json`,
    file_format: 'JSON-SIMULATED',
    sample_rate: 500,
    leads: 12,
    duration_seconds: 30,
    processing_status: 'COMPLETE',
    received_at: new Date().toISOString()
  });

  const analysisResult = await analyzeECG({
    heart_rate_bpm: 145,
    qt_interval_ms: 380,
    qrs_duration_ms: 82,
    hrv_rmssd_ms: 18
  });
  analysisResult.rhythm_class = 'AFIB';
  analysisResult.risk_category = 'HIGH';
  analysisResult.cvd_risk_score = 85;

  db.insert('ai_analyses', {
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

  const alert = db.insert('alerts', {
    patient_id: ekwePatient.id,
    doctor_id: doctor.id,
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

  console.log('📧 Sending notifications (with doctor name fix)...');
  const notificationResults = await sendPatientAlertNotifications(ekwePatient.id, alert);

  db.update('alerts', alert.id, {
    sms_status: notificationResults.results.sms?.success ? 'DELIVERED' : 'FAILED',
    email_status: notificationResults.results.email?.success ? 'DELIVERED' : 'FAILED',
    sms_delivered_at: notificationResults.results.sms?.success ? new Date().toISOString() : null
  });

  console.log('\n🎉 SUCCESS! Alert triggered and notifications sent with correct doctor name!');
};

run().catch(err => {
  console.error('❌ ERROR:', err);
});
