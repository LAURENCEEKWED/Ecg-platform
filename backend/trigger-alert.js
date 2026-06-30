
const db = require('./src/config/database');
const { sendPatientAlertNotifications } = require('./src/services/notifications');
const { analyzeECG } = require('./src/services/aiAnalysis');
const bcrypt = require('bcryptjs');

console.log('🚀 Starting alert trigger script...\n');

// First, let's initialize the database
const initializeDB = async () => {
  // First, check if Ekwe Daniel exists in the database
  let ekweUser = db.findOne('users', { first_name: 'Ekwe', last_name: 'Daniel' });
  let ekwePatient = null;
  let ekweId = null;

  if (!ekweUser) {
    console.log('👤 Creating Ekwe Daniel as a new patient...');
    // Create a new user for Ekwe Daniel
    const patientPw = await bcrypt.hash('patient123', 10);
    ekweUser = db.insert('users', {
      email: 'ekwe.daniel@email.cm',
      password: patientPw,
      role: 'PATIENT',
      first_name: 'Ekwe',
      last_name: 'Daniel',
      phone: '+237677889900',
      status: 'ACTIVE'
    });
    console.log('✅ User created:', ekweUser.email);

    // Get the first hospital and doctor
    const hospital = db.findAll('hospitals')[0];
    const doctor = db.findAll('doctors')[0];

    ekwePatient = db.insert('patients', {
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
    ekweId = ekwePatient.id;
    console.log('✅ Patient record created for Ekwe Daniel (ID:', ekweId, ')');

    // Create default settings for Ekwe Daniel
    db.insert('settings', {
      user_id: ekweUser.id,
      email_notifications: true,
      sms_notifications: true,
      dark_mode: false,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('✅ Default notification settings created');
  } else {
    ekwePatient = db.findOne('patients', { user_id: ekweUser.id });
    ekweId = ekwePatient.id;
    console.log('👤 Found Ekwe Daniel in database (ID:', ekweId, ')');
  }

  // Now create a high-risk ECG
  console.log('\n📊 Creating a high-risk ECG record for Ekwe Daniel...');
  const ecgRecord = db.insert('ecg_records', {
    patient_id: ekweId,
    hospital_id: ekwePatient.hospital_id,
    doctor_id: ekwePatient.doctor_id,
    file_name: `ecg_${ekweId}_alert_test.json`,
    file_format: 'JSON-SIMULATED',
    sample_rate: 500,
    leads: 12,
    duration_seconds: 30,
    processing_status: 'COMPLETE',
    received_at: new Date().toISOString()
  });

  // Get a high-risk analysis
  const highRiskFeatures = {
    heart_rate_bpm: 145,
    qt_interval_ms: 380,
    qrs_duration_ms: 82,
    pr_interval_ms: 148,
    st_deviation_mm: 0.3,
    hrv_rmssd_ms: 18,
    p_wave_present: true,
    rr_irregular: false
  };

  console.log('🤖 Running AI analysis...');
  const analysisResult = await analyzeECG(highRiskFeatures);
  analysisResult.rhythm_class = 'AFIB';
  analysisResult.risk_category = 'HIGH';
  analysisResult.cvd_risk_score = 82;

  // Save the analysis
  console.log('💾 Saving AI analysis...');
  const analysis = db.insert('ai_analyses', {
    ecg_record_id: ecgRecord.id,
    patient_id: ekweId,
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
    recommendations: JSON.stringify(analysisResult.recommendations),
    model_version: analysisResult.model_version,
    analyzed_at: new Date().toISOString()
  });

  // Create alert
  console.log('⚠️  Creating high-risk alert...');
  const alert = db.insert('alerts', {
    patient_id: ekweId,
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

  // Send notifications!
  console.log('📧 Sending notifications to Ekwe Daniel...');
  const notificationResults = await sendPatientAlertNotifications(ekweId, alert);
  console.log('\n✅ Notifications sent! Here are the results:');
  console.log('Email result:', notificationResults.results.email);
  console.log('SMS result:', notificationResults.results.sms);

  // Update alert status
  console.log('🔄 Updating alert status in database...');
  db.update('alerts', alert.id, {
    sms_status: notificationResults.results.sms?.success ? 'DELIVERED' : 'FAILED',
    email_status: notificationResults.results.email?.success ? 'DELIVERED' : 'FAILED',
    sms_delivered_at: notificationResults.results.sms?.success ? new Date().toISOString() : null
  });

  console.log('\n🎉 Alert triggered successfully!');
  console.log('\nSummary:');
  console.log('  - Patient: Ekwe Daniel');
  console.log('  - ECG ID:', ecgRecord.id);
  console.log('  - Alert ID:', alert.id);
  console.log('  - Rhythm:', analysisResult.rhythm_class);
  console.log('  - Risk Score:', analysisResult.cvd_risk_score);
  console.log('  - Risk Category:', analysisResult.risk_category);
};

// Now, we need to seed the database first
console.log('📂 Initializing database seed...');
const { initializeDatabase } = require('./src/utils/dbInit');
initializeDatabase().then(() => {
  console.log('✅ Database initialized!');
  initializeDB().catch(err => {
    console.error('❌ Error:', err);
  });
});
