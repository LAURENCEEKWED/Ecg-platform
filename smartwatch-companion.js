const http = require('http');
const readline = require('readline');

const RHYTHM_PROFILES = {
  NORMAL: { heart_rate_bpm: 72, qt_interval_ms: 420, qrs_duration_ms: 88, pr_interval_ms: 160, st_deviation_mm: 0.1, hrv_rmssd_ms: 45, p_wave_present: true, rr_irregular: false },
  TACHYCARDIA: { heart_rate_bpm: 145, qt_interval_ms: 380, qrs_duration_ms: 82, pr_interval_ms: 148, st_deviation_mm: 0.3, hrv_rmssd_ms: 18, p_wave_present: true, rr_irregular: false },
  BRADYCARDIA: { heart_rate_bpm: 42, qt_interval_ms: 460, qrs_duration_ms: 95, pr_interval_ms: 178, st_deviation_mm: 0.2, hrv_rmssd_ms: 52, p_wave_present: true, rr_irregular: false },
  AFIB: { heart_rate_bpm: 88, qt_interval_ms: 465, qrs_duration_ms: 90, pr_interval_ms: null, st_deviation_mm: 0.5, hrv_rmssd_ms: 8, p_wave_present: false, rr_irregular: true },
  PVC: { heart_rate_bpm: 76, qt_interval_ms: 440, qrs_duration_ms: 148, pr_interval_ms: 162, st_deviation_mm: 0.2, hrv_rmssd_ms: 22, p_wave_present: true, rr_irregular: false },
};

const CONFIG = {
  apiBase: 'http://localhost:5000/api/v1',
  authToken: null, // We'll get this via login
  patientId: null,
  deviceId: null,
  selectedRhythm: 'NORMAL'
};

// Setup CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Helper to make API requests
function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData || '')
      }
    };
    if (CONFIG.authToken) {
      options.headers['Authorization'] = `Bearer ${CONFIG.authToken}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject({ status: res.statusCode, data: parsed });
          }
        } catch (e) {
          reject({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Simulate ECG data
function generateECGData(rhythm) {
  const features = RHYTHM_PROFILES[rhythm];
  const sampleRate = 100; // Smartwatch sampling rate
  const duration = 30; // 30 seconds
  const samples = [];

  for (let i = 0; i < sampleRate * duration; i++) {
    samples.push(parseFloat((Math.sin(i * 0.03 + (rhythm === 'AFIB' ? Math.random() : 0)) * 0.2 + (Math.random() - 0.5) * 0.05).toFixed(4)));
  }

  return {
    ecg_data: {
      sample_rate: sampleRate,
      duration_seconds: duration,
      samples_lead_ii: samples
    },
    features: features
  };
}

// Main app
async function main() {
  console.log('============================================');
  console.log('   ECG AI Platform - Smartwatch Companion');
  console.log('============================================\n');

  // Step 1: Login as patient
  console.log('First, let\'s log in as a patient...');
  const email = await prompt('Patient email (default: emmanuel.b@email.cm): ') || 'emmanuel.b@email.cm';
  const password = await prompt('Password (default: patient123): ') || 'patient123';

  try {
    const loginResponse = await apiRequest('POST', '/auth/login', { email, password });
    CONFIG.authToken = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Logged in as ${user.first_name} ${user.last_name}`);

    // Get patient profile
    const patientRes = await apiRequest('GET', '/patients/dashboard');
    CONFIG.patientId = patientRes.data.patient.id;

    // Step 2: List or create smartwatch
    console.log('\n--- Smartwatch Devices ---');
    const devicesResponse = await apiRequest('GET', '/smartwatch/devices');
    let devices = devicesResponse.data.devices.filter(d => d.status === 'LINKED');
    
    if (devices.length === 0) {
      console.log('No linked smartwatches found, let\'s create one!');
      const deviceName = await prompt('Device name (default: My Apple Watch): ') || 'My Apple Watch';
      const deviceType = await prompt('Device type (APPLE/WATCHOS/ANDROID/WEAROS/GENERIC, default: APPLE): ') || 'APPLE';
      const createRes = await apiRequest('POST', '/smartwatch/devices', {
        device_name: deviceName,
        device_type: deviceType,
        device_model: deviceType === 'APPLE' ? 'Apple Watch Series 8' : 'Galaxy Watch 5',
        device_serial: `SMART-${Date.now()}`
      });
      CONFIG.deviceId = createRes.data.device.id;
      console.log('✅ Smartwatch linked successfully!');
    } else {
      console.log('Linked devices:');
      devices.forEach((d, i) => console.log(`  ${i + 1}. ${d.device_name} (${d.device_model})`));
      const selected = parseInt(await prompt('Select device number (default 1): ')) || 1;
      CONFIG.deviceId = devices[selected - 1].id;
    }

    // Step3: Interactive ECG simulation
    console.log('\n--- Ready to simulate ECG recordings! ---\n');
    let running = true;
    while (running) {
      console.log(`Current selected rhythm: ${CONFIG.selectedRhythm}`);
      console.log('Options:');
      console.log('  1. Simulate normal ECG');
      console.log('  2. Simulate tachycardia');
      console.log('  3. Simulate bradycardia');
      console.log('  4. Simulate atrial fibrillation');
      console.log('  5. Simulate PVC');
      console.log('  6. Change selected rhythm');
      console.log('  7. Upload current rhythm');
      console.log('  q. Quit');
      
      const choice = await prompt('\nSelect an option: ');
      
      switch (choice) {
        case '1':
          CONFIG.selectedRhythm = 'NORMAL';
          console.log('Selected rhythm: NORMAL');
          break;
        case '2':
          CONFIG.selectedRhythm = 'TACHYCARDIA';
          console.log('Selected rhythm: TACHYCARDIA');
          break;
        case '3':
          CONFIG.selectedRhythm = 'BRADYCARDIA';
          console.log('Selected rhythm: BRADYCARDIA');
          break;
        case '4':
          CONFIG.selectedRhythm = 'AFIB';
          console.log('Selected rhythm: AFIB');
          break;
        case '5':
          CONFIG.selectedRhythm = 'PVC';
          console.log('Selected rhythm: PVC');
          break;
        case '6':
          const rhythmChoice = await prompt('Enter rhythm (NORMAL/TACHYCARDIA/BRADYCARDIA/AFIB/PVC): ');
          if (RHYTHM_PROFILES[rhythmChoice]) {
            CONFIG.selectedRhythm = rhythmChoice;
          } else {
            console.log('⚠️  Invalid rhythm, using NORMAL');
            CONFIG.selectedRhythm = 'NORMAL';
          }
          break;
        case '7': {
          console.log('\nUploading ECG to platform...');
          const ecgPayload = generateECGData(CONFIG.selectedRhythm);
          try {
            const result = await apiRequest('POST', '/smartwatch/ecg', {
              device_id: CONFIG.deviceId,
              ...ecgPayload
            });
            console.log('✅ ECG uploaded and analyzed!');
            console.log(`   Rhythm: ${result.data.rhythm_class} (${result.data.rhythm_confidence}%)`);
            console.log(`   CVD Risk Score: ${result.data.cvd_risk_score} - ${result.data.risk_category}`);
            if (result.data.alert_dispatched) {
              console.log('   ⚠️  HIGH RISK ALERT: Notifications sent to doctor!');
            }
            console.log('');
          } catch (err) {
            console.log('❌ Error uploading ECG:', err.data?.error || err);
          }
          break;
        }
        case 'q':
        case 'Q':
          running = false;
          break;
        default:
          console.log('Invalid option, try again.');
      }
    }

    console.log('\n👋 Goodbye!');
  } catch (err) {
    console.error('❌ Error:', err.data?.error || err);
  } finally {
    rl.close();
  }
}

main();
