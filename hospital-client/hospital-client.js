#!/usr/bin/env node
/**
 * ECG Platform — Hospital Client Script
 * Simulates a hospital ECG machine transmitting data to the platform API.
 * Usage: node hospital-client.js [--rhythm NORMAL|TACHYCARDIA|BRADYCARDIA|AFIB|PVC]
 *
 * This represents the integration running on-premises at the hospital,
 * converting ECG machine output (HL7/PDF/CSV) into API calls.
 */

const https = require('https');
const http = require('http');

const CONFIG = {
  apiBase: 'http://localhost:5000/api/v1',
  apiKey: 'HOSPITAL_TEST_KEY_2024',
  patientIdentifier: '+237677112233', // Emmanuel Biya's phone
  hospital: 'Hôpital Général de Douala',
};

// Parse CLI args
const args = process.argv.slice(2);
const rhythmIdx = args.indexOf('--rhythm');
const requestedRhythm = rhythmIdx !== -1 ? args[rhythmIdx + 1] : null;

const RHYTHM_PROFILES = {
  NORMAL:       { heart_rate_bpm: 72,  qt_interval_ms: 420, qrs_duration_ms: 88,  pr_interval_ms: 160, st_deviation_mm: 0.0,  hrv_rmssd_ms: 45, p_wave_present: true,  rr_irregular: false },
  TACHYCARDIA:  { heart_rate_bpm: 145, qt_interval_ms: 380, qrs_duration_ms: 82,  pr_interval_ms: 148, st_deviation_mm: 0.3,  hrv_rmssd_ms: 18, p_wave_present: true,  rr_irregular: false },
  BRADYCARDIA:  { heart_rate_bpm: 42,  qt_interval_ms: 460, qrs_duration_ms: 95,  pr_interval_ms: 178, st_deviation_mm: 0.2,  hrv_rmssd_ms: 52, p_wave_present: true,  rr_irregular: false },
  AFIB:         { heart_rate_bpm: 88,  qt_interval_ms: 465, qrs_duration_ms: 90,  pr_interval_ms: null, st_deviation_mm: 0.5,  hrv_rmssd_ms: 8,  p_wave_present: false, rr_irregular: true  },
  PVC:          { heart_rate_bpm: 76,  qt_interval_ms: 440, qrs_duration_ms: 148, pr_interval_ms: 162, st_deviation_mm: 0.2,  hrv_rmssd_ms: 22, p_wave_present: true,  rr_irregular: false },
};

function pickRhythm() {
  if (requestedRhythm && RHYTHM_PROFILES[requestedRhythm.toUpperCase()]) {
    return requestedRhythm.toUpperCase();
  }
  const keys = Object.keys(RHYTHM_PROFILES);
  return keys[Math.floor(Math.random() * keys.length)];
}

function generateECGPayload(rhythm) {
  const features = RHYTHM_PROFILES[rhythm];
  const samples = [];
  const sampleRate = 500;
  const duration = 10; // seconds
  const rr = (60 / features.heart_rate_bpm) * sampleRate;

  for (let i = 0; i < sampleRate * duration; i++) {
    const t = (i % rr) / rr;
    let v = 0;
    if (rhythm === 'AFIB') {
      v = Math.sin(i * 0.05) * 0.06 + (Math.random() - 0.5) * 0.12;
      v += gauss(t, 0.4 + (Math.random() - 0.5) * 0.15, 0.01) * 1.2;
      v += gauss(t, 0.5, 0.03) * 0.3;
    } else {
      v += gauss(t, 0.15, 0.025) * 0.18;
      v += gauss(t, 0.38, 0.008) * -0.22;
      v += gauss(t, 0.40, 0.01) * 1.4;
      v += gauss(t, 0.42, 0.008) * -0.3;
      v += gauss(t, 0.55, 0.04) * 0.35;
    }
    v += (Math.random() - 0.5) * 0.02;
    samples.push(parseFloat(v.toFixed(4)));
  }

  return {
    format: 'HL7-FHIR-R4',
    patient_identifier: CONFIG.patientIdentifier,
    ecg_data: {
      sample_rate: sampleRate,
      leads: 12,
      duration_seconds: duration,
      samples_lead_II: samples,
      features, // Pre-extracted features sent alongside raw signal
    },
    metadata: {
      device_id: 'ECG-MACHINE-HGD-001',
      device_model: 'Nihon Kohden ECardiMax FCP-8100',
      operator_id: 'TECHNICIAN_042',
      acquisition_timestamp: new Date().toISOString(),
      hospital_name: CONFIG.hospital,
    }
  };
}

function gauss(x, mu, s) {
  return Math.exp(-Math.pow(x - mu, 2) / (2 * s * s));
}

function postJSON(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    };
    const req = (isHttps ? https : http).request(options, res => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(responseData) }); }
        catch { resolve({ status: res.statusCode, body: responseData }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('\n========================================');
  console.log('  ECG AI Platform — Hospital Client v1.0');
  console.log(`  Hospital: ${CONFIG.hospital}`);
  console.log('========================================\n');

  const rhythm = pickRhythm();
  console.log(`[1/3] Preparing ECG payload...`);
  console.log(`      Rhythm: ${rhythm}`);
  console.log(`      Patient: ${CONFIG.patientIdentifier}`);

  const payload = generateECGPayload(rhythm);
  console.log(`      Signal: ${payload.ecg_data.samples_lead_II.length} samples @ ${payload.ecg_data.sample_rate} Hz`);

  console.log(`\n[2/3] Transmitting to ECG AI Platform API...`);
  const startTime = Date.now();

  try {
    const response = await postJSON(
      `${CONFIG.apiBase}/ecg/upload`,
      payload,
      { 'X-API-Key': CONFIG.apiKey }
    );

    const elapsed = Date.now() - startTime;

    if (response.status === 201) {
      const r = response.body;
      console.log(`      ✅ Transmission successful (${elapsed}ms total)`);
      console.log(`\n[3/3] AI Analysis Results:`);
      console.log(`      ECG Record ID  : ${r.ecg_record_id}`);
      console.log(`      Rhythm Class   : ${r.rhythm_class} (${r.rhythm_confidence}% confidence)`);
      console.log(`      CVD Risk Score : ${r.cvd_risk_score}/100`);
      console.log(`      Risk Category  : ${r.risk_category}`);
      console.log(`      Alert Sent     : ${r.alert_dispatched ? '⚠️  YES — SMS & Email dispatched' : '✅ No (risk within normal range)'}`);
      console.log(`      Process Time   : ${r.processing_time_ms}ms`);
      console.log(`\n      Recommendations:`);
      (r.recommendations || []).forEach((rec, i) => {
        console.log(`      ${i + 1}. ${rec}`);
      });
    } else {
      console.error(`      ❌ Error ${response.status}:`, response.body);
    }
  } catch (err) {
    console.error(`\n      ❌ Connection failed: ${err.message}`);
    console.error(`      Make sure the backend is running on ${CONFIG.apiBase}`);
  }

  console.log('\n========================================\n');
}

main();
