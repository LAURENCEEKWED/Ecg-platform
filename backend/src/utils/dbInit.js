const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function initializeDatabase() {
  // Only seed if database is empty
  if (!db.isEmpty()) {
    console.log('✅ Database already has data, skipping seed');
    console.log('👤 Demo accounts:');
    console.log('   Doctor:  dr.kameni@ecgplatform.cm / doctor123');
    console.log('   Doctor:  dr.nguena@ecgplatform.cm / doctor123');
    console.log('   Admin:   admin@ecgplatform.cm / admin123');
    console.log('   Patient: emmanuel.b@email.cm / patient123\n');
    return;
  }

  console.log('🗄️  Initializing database with seed data...');

  // Seed hospitals
  const hospital1 = db.insert('hospitals', {
    name: 'Hôpital Général de Douala',
    city: 'Douala',
    country: 'Cameroon',
    api_key: 'HOSPITAL_TEST_KEY_2024',
    status: 'ACTIVE',
    contact_email: 'ecg@hgd.cm',
    total_ecg_transmitted: 247,
    last_transmission: new Date(Date.now() - 3600000).toISOString()
  });

  const hospital2 = db.insert('hospitals', {
    name: 'Centre Hospitalier Universitaire de Yaoundé',
    city: 'Yaoundé',
    country: 'Cameroon',
    api_key: 'HOSPITAL_YDE_KEY_2024',
    status: 'ACTIVE',
    contact_email: 'ecg@chuy.cm',
    total_ecg_transmitted: 183,
    last_transmission: new Date(Date.now() - 7200000).toISOString()
  });

  // Seed users (doctors)
  const doctorPw = await bcrypt.hash('doctor123', 10);
  const adminPw = await bcrypt.hash('admin123', 10);
  const patientPw = await bcrypt.hash('patient123', 10);

  const doctorUser1 = db.insert('users', {
    email: 'dr.kameni@ecgplatform.cm',
    password: doctorPw,
    role: 'DOCTOR',
    first_name: 'Marie',
    last_name: 'Kameni',
    phone: '+237677001122',
    status: 'ACTIVE'
  });

  const doctorUser2 = db.insert('users', {
    email: 'dr.nguena@ecgplatform.cm',
    password: doctorPw,
    role: 'DOCTOR',
    first_name: 'Jean-Paul',
    last_name: 'Nguena',
    phone: '+237699334455',
    status: 'ACTIVE'
  });

  const adminUser = db.insert('users', {
    email: 'admin@ecgplatform.cm',
    password: adminPw,
    role: 'ADMIN',
    first_name: 'System',
    last_name: 'Admin',
    phone: '+237655000000',
    status: 'ACTIVE'
  });

  // Seed doctors
  const doctor1 = db.insert('doctors', {
    user_id: doctorUser1.id,
    hospital_id: hospital1.id,
    specialization: 'Cardiologist',
    license_number: 'CM-CARD-2019-0042',
    years_experience: 8,
    department: 'Cardiology',
    avatar_color: '#2E75B6',
    total_patients: 0,
    high_risk_count: 0
  });

  const doctor2 = db.insert('doctors', {
    user_id: doctorUser2.id,
    hospital_id: hospital2.id,
    specialization: 'General Physician',
    license_number: 'CM-GP-2021-0118',
    years_experience: 5,
    department: 'Internal Medicine',
    avatar_color: '#107C41',
    total_patients: 0,
    high_risk_count: 0
  });

  // Seed patients with users
  const patients = [
    { first_name: 'Emmanuel', last_name: 'Biya', dob: '1958-04-12', gender: 'M', phone: '+237677112233', email: 'emmanuel.b@email.cm', doctor_id: doctor1.id, hospital_id: hospital1.id, blood_type: 'A+', weight_kg: 78, height_cm: 175 },
    { first_name: 'Cécile', last_name: 'Mfou', dob: '1972-08-25', gender: 'F', phone: '+237699556677', email: 'cecile.m@email.cm', doctor_id: doctor1.id, hospital_id: hospital1.id, blood_type: 'O+', weight_kg: 62, height_cm: 162 },
    { first_name: 'Paul', last_name: 'Assamba', dob: '1965-03-14', gender: 'M', phone: '+237655778899', email: 'paul.a@email.cm', doctor_id: doctor1.id, hospital_id: hospital1.id, blood_type: 'B+', weight_kg: 85, height_cm: 180 },
    { first_name: 'Isabelle', last_name: 'Ngo Bala', dob: '1980-11-30', gender: 'F', phone: '+237677445566', email: 'isabelle.n@email.cm', doctor_id: doctor2.id, hospital_id: hospital2.id, blood_type: 'AB-', weight_kg: 55, height_cm: 158 },
    { first_name: 'Martin', last_name: 'Eto', dob: '1945-07-19', gender: 'M', phone: '+237699001234', email: 'martin.e@email.cm', doctor_id: doctor2.id, hospital_id: hospital2.id, blood_type: 'O-', weight_kg: 70, height_cm: 168 },
    { first_name: 'Alice', last_name: 'Fouda', dob: '1990-02-08', gender: 'F', phone: '+237655321098', email: 'alice.f@email.cm', doctor_id: doctor1.id, hospital_id: hospital1.id, blood_type: 'A-', weight_kg: 58, height_cm: 164 },
  ];

  const patientRecords = [];
  for (const p of patients) {
    const pUser = db.insert('users', {
      email: p.email,
      password: patientPw,
      role: 'PATIENT',
      first_name: p.first_name,
      last_name: p.last_name,
      phone: p.phone,
      status: 'ACTIVE'
    });
    const patient = db.insert('patients', { ...p, user_id: pUser.id, status: 'ACTIVE' });
    patientRecords.push(patient);
    
    // Create default settings for patient
    db.insert('settings', {
      user_id: pUser.id,
      email_notifications: true,
      sms_notifications: true,
      dark_mode: false,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Create ECG profile for patient
    db.insert('patient_ecg_profiles', {
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
  }
  
  // Create default settings for doctors and admin
  for (const user of [doctorUser1, doctorUser2, adminUser]) {
    db.insert('settings', {
      user_id: user.id,
      email_notifications: true,
      sms_notifications: true,
      dark_mode: false,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // Seed ECG records and AI analyses
  const rhythmClasses = ['NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC'];
  const riskCategories = ['LOW', 'MODERATE', 'HIGH'];

  const ecgScenarios = [
    { rhythm: 'NORMAL', confidence: 98.9, cvd_score: 12, risk: 'LOW', bpm: 72, qt: 420, qrs: 88, pr: 160, st_dev: 0.1, hrv: 45 },
    { rhythm: 'TACHYCARDIA', confidence: 93.8, cvd_score: 71, risk: 'HIGH', bpm: 145, qt: 380, qrs: 82, pr: 148, st_dev: 0.3, hrv: 18 },
    { rhythm: 'BRADYCARDIA', confidence: 92.1, cvd_score: 51, risk: 'MODERATE', bpm: 42, qt: 460, qrs: 95, pr: 178, st_dev: 0.2, hrv: 52 },
    { rhythm: 'AFIB', confidence: 96.2, cvd_score: 82, risk: 'HIGH', bpm: 88, qt: 465, qrs: 90, pr: null, st_dev: 0.5, hrv: 8 },
    { rhythm: 'PVC', confidence: 91.5, cvd_score: 71, risk: 'HIGH', bpm: 76, qt: 440, qrs: 148, pr: 162, st_dev: 0.2, hrv: 22 },
    { rhythm: 'NORMAL', confidence: 99.1, cvd_score: 18, risk: 'LOW', bpm: 68, qt: 415, qrs: 86, pr: 155, st_dev: 0.0, hrv: 48 },
  ];

  for (let i = 0; i < patientRecords.length; i++) {
    const patient = patientRecords[i];
    const scenario = ecgScenarios[i];
    const daysAgo = Math.floor(Math.random() * 30);
    const ecgDate = new Date(Date.now() - daysAgo * 86400000).toISOString();

    const ecgRecord = db.insert('ecg_records', {
      patient_id: patient.id,
      hospital_id: patient.hospital_id,
      doctor_id: patient.doctor_id,
      file_name: `ecg_${patient.id}_${Date.now()}.json`,
      file_format: 'HL7-FHIR-R4',
      sample_rate: 500,
      leads: 12,
      duration_seconds: 30,
      processing_status: 'COMPLETE',
      received_at: ecgDate,
      processing_time_ms: Math.floor(Math.random() * 400) + 400
    });

    const recommendations = getRecommendations(scenario);
    const analysis = db.insert('ai_analyses', {
      ecg_record_id: ecgRecord.id,
      patient_id: patient.id,
      rhythm_class: scenario.rhythm,
      rhythm_confidence: scenario.confidence,
      cvd_risk_score: scenario.cvd_score,
      risk_category: scenario.risk,
      heart_rate_bpm: scenario.bpm,
      qt_interval_ms: scenario.qt,
      qrs_duration_ms: scenario.qrs,
      pr_interval_ms: scenario.pr,
      st_deviation_mm: scenario.st_dev,
      hrv_rmssd_ms: scenario.hrv,
      p_wave_axis: Math.floor(Math.random() * 60) + 30,
      recommendations: JSON.stringify(recommendations),
      model_version: '1D-CNN v2.1 + XGBoost v1.7',
      inference_latency_ms: Math.floor(Math.random() * 200) + 600,
      analyzed_at: ecgDate
    });

    // Add historical ECG records (previous visits)
    for (let j = 1; j <= 3; j++) {
      const prevDays = daysAgo + j * 30;
      const prevDate = new Date(Date.now() - prevDays * 86400000).toISOString();
      const prevScore = Math.max(5, scenario.cvd_score - j * 8 + Math.floor(Math.random() * 10));
      const prevEcg = db.insert('ecg_records', {
        patient_id: patient.id,
        hospital_id: patient.hospital_id,
        doctor_id: patient.doctor_id,
        file_name: `ecg_${patient.id}_hist${j}.json`,
        file_format: 'HL7-FHIR-R4',
        sample_rate: 500,
        leads: 12,
        duration_seconds: 30,
        processing_status: 'COMPLETE',
        received_at: prevDate,
        processing_time_ms: 650
      });

      db.insert('ai_analyses', {
        ecg_record_id: prevEcg.id,
        patient_id: patient.id,
        rhythm_class: j === 1 ? scenario.rhythm : 'NORMAL',
        rhythm_confidence: j === 1 ? scenario.confidence : 97.2,
        cvd_risk_score: prevScore,
        risk_category: prevScore >= 67 ? 'HIGH' : prevScore >= 34 ? 'MODERATE' : 'LOW',
        heart_rate_bpm: scenario.bpm + Math.floor(Math.random() * 20) - 10,
        qt_interval_ms: scenario.qt + Math.floor(Math.random() * 20) - 10,
        qrs_duration_ms: scenario.qrs,
        pr_interval_ms: scenario.pr,
        st_deviation_mm: Math.max(0, scenario.st_dev - 0.1),
        hrv_rmssd_ms: scenario.hrv + Math.floor(Math.random() * 10),
        recommendations: JSON.stringify(['Continue regular monitoring', 'Maintain medication schedule']),
        model_version: '1D-CNN v2.1 + XGBoost v1.7',
        inference_latency_ms: 680,
        analyzed_at: prevDate
      });
    }

    // Create alerts for HIGH risk patients
    if (scenario.risk === 'HIGH') {
      db.insert('alerts', {
        patient_id: patient.id,
        doctor_id: patient.doctor_id,
        ecg_record_id: ecgRecord.id,
        risk_level: scenario.risk,
        rhythm_class: scenario.rhythm,
        cvd_risk_score: scenario.cvd_score,
        sms_status: 'DELIVERED',
        email_status: 'DELIVERED',
        push_status: 'DELIVERED',
        sms_delivered_at: new Date(new Date(ecgDate).getTime() + 4800).toISOString(),
        resolution_status: Math.random() > 0.5 ? 'RESOLVED' : 'PENDING',
        resolved_at: Math.random() > 0.5 ? new Date(new Date(ecgDate).getTime() + 3600000).toISOString() : null,
        created_at: ecgDate
      });
    }
  }

  // Update doctor patient counts
  db.update('doctors', doctor1.id, {
    total_patients: db.findAll('patients', { doctor_id: doctor1.id }).length,
    high_risk_count: db.query('ai_analyses', a => {
      const p = db.findAll('patients', { doctor_id: doctor1.id });
      return p.some(pat => pat.id === a.patient_id) && a.risk_category === 'HIGH';
    }).length
  });

  db.update('doctors', doctor2.id, {
    total_patients: db.findAll('patients', { doctor_id: doctor2.id }).length,
    high_risk_count: 0
  });

  // Seed risk predictions
  for (let i = 0; i < patientRecords.length; i++) {
    const patient = patientRecords[i];
    const analyses = db.findAll('ai_analyses', { patient_id: patient.id });
    for (const analysis of analyses) {
      db.insert('risk_predictions', {
        patient_id: patient.id,
        ecg_record_id: analysis.ecg_record_id,
        ai_analysis_id: analysis.id,
        risk_score: analysis.cvd_risk_score,
        risk_level: analysis.risk_category,
        rhythm_class: analysis.rhythm_class,
        prediction_details: JSON.stringify({
          heart_rate: analysis.heart_rate_bpm,
          qt_interval: analysis.qt_interval_ms,
          hrv: analysis.hrv_rmssd_ms
        }),
        model_version: analysis.model_version,
        created_at: analysis.analyzed_at
      });
    }
  }

  // Seed messages
  db.insert('messages', {
    sender_id: doctorUser1.id,
    receiver_id: patientRecords[0].user_id,
    patient_id: patientRecords[0].id,
    doctor_id: doctor1.id,
    content: 'Hello Mr. Biya, please come in for a checkup regarding your recent ECG results.',
    status: 'READ',
    sent_at: new Date(Date.now() - 86400000).toISOString(),
    read_at: new Date(Date.now() - 82800000).toISOString()
  });

  db.insert('messages', {
    sender_id: patientRecords[0].user_id,
    receiver_id: doctorUser1.id,
    patient_id: patientRecords[0].id,
    doctor_id: doctor1.id,
    content: 'Thank you Dr. Kameni, I will schedule an appointment tomorrow.',
    status: 'DELIVERED',
    sent_at: new Date(Date.now() - 72000000).toISOString()
  });

  // Seed default settings
  db.insert('settings', {
    user_id: adminUser.id,
    email_notifications: true,
    sms_notifications: true,
    dark_mode: false,
    language: 'en',
    high_risk_threshold: 67,
    moderate_risk_threshold: 34,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  db.insert('settings', {
    user_id: doctorUser1.id,
    email_notifications: true,
    sms_notifications: true,
    dark_mode: false,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  for (const patient of patientRecords) {
    db.insert('settings', {
      user_id: patient.user_id,
      email_notifications: true,
      sms_notifications: true,
      dark_mode: false,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  console.log('✅ Database initialized successfully');
  console.log('👤 Demo accounts:');
  console.log('   Doctor:  dr.kameni@ecgplatform.cm / doctor123');
  console.log('   Doctor:  dr.nguena@ecgplatform.cm / doctor123');
  console.log('   Admin:   admin@ecgplatform.cm / admin123');
  console.log('   Patient: emmanuel.b@email.cm / patient123\n');
}

function getRecommendations(scenario) {
  const recs = {
    NORMAL: ['Continue regular cardiac monitoring every 6 months', 'Maintain healthy lifestyle and diet', 'No immediate intervention required'],
    TACHYCARDIA: ['Urgent: Refer to cardiologist for tachycardia evaluation', 'Monitor for underlying causes: thyroid, anemia, fever', 'Consider 24-hour Holter ECG monitoring', 'Avoid stimulants: caffeine, nicotine'],
    BRADYCARDIA: ['Cardiology referral for bradycardia investigation', 'Evaluate for medication side effects causing bradycardia', 'Consider thyroid function tests', 'ECG follow-up in 2 weeks'],
    AFIB: ['URGENT: Atrial fibrillation detected — immediate cardiology referral', 'Assess stroke risk (CHA2DS2-VASc score)', 'Consider anticoagulation therapy assessment', 'Rate control evaluation — target HR 60-80 BPM'],
    PVC: ['Holter monitoring recommended — assess PVC burden over 24h', 'Evaluate frequency and coupling interval of PVCs', 'Avoid triggers: caffeine, alcohol, stress, lack of sleep', 'ECG follow-up in 4 weeks']
  };
  return recs[scenario.rhythm] || recs.NORMAL;
}

module.exports = { initializeDatabase };
