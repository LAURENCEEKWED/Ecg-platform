
/**
 * AI Analysis Service
 * Uses FastAPI ML Inference Service
 * Falls back to simulation if ML service is not available
 * Uses PTB-XL dataset for realistic ECG waveforms
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const RHYTHM_CLASSES = ['NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC'];
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

// Load PTB-XL Sample Data
let ptbxlData = [];
try {
  const dataPath = path.join(__dirname, '../../data/ptbxl_sample_data.json');
  ptbxlData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loaded ${ptbxlData.length} PTB-XL ECG samples`);
} catch (err) {
  console.warn('Could not load PTB-XL data file, using simulated waveforms');
}

/**
 * Calls the FastAPI ML service for ECG analysis
 * @param {object} ecgData - ECG data/features
 * @returns {Promise<object>} Analysis results
 */
async function callMLService(ecgData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(ecgData);
    const options = {
      hostname: 'localhost',
      port: 8001,
      path: '/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`ML service returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', () => reject(new Error('ML service connection failed')));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ML service timed out'));
    });
    req.write(postData);
    req.end();
  });
}

/**
 * Falls back to simulation mode if ML service is unavailable
 */
function analyzeECGSimulated(ecgData) {
  console.warn('⚠️  Falling back to simulated ECG analysis');
  
  const features = extractFeatures(ecgData);
  const arrhythmiaResult = classifyArrhythmia(features);
  const cvdResult = predictCVDRisk({ ...features, rhythm_class: arrhythmiaResult.rhythm_class });

  return {
    ...arrhythmiaResult,
    ...cvdResult,
    heart_rate_bpm: features.heart_rate_bpm,
    qt_interval_ms: features.qt_interval_ms,
    qrs_duration_ms: features.qrs_duration_ms,
    pr_interval_ms: features.pr_interval_ms,
    st_deviation_mm: features.st_deviation_mm,
    hrv_rmssd_ms: features.hrv_rmssd_ms,
    p_wave_axis: features.p_wave_axis,
    inference_latency_ms: Math.random() * 200 + 200,
    model_version: '1D-CNN v2.1 + XGBoost v1.7 (simulated)',
    analyzed_at: new Date().toISOString()
  };
}

/**
 * Main analysis pipeline
 */
async function analyzeECG(ecgData) {
  try {
    const startTime = Date.now();
    const result = await callMLService(ecgData);
    result.inference_latency_ms = Date.now() - startTime;
    result.analyzed_at = new Date().toISOString();
    return result;
  } catch (error) {
    console.warn('ML service unavailable, using simulation:', error.message);
    return analyzeECGSimulated(ecgData);
  }
}

/**
 * Simulates 1D-CNN arrhythmia classification (backup)
 */
function classifyArrhythmia(ecgFeatures) {
  const { heart_rate_bpm, qrs_duration_ms, pr_interval_ms, p_wave_present, rr_irregular } = ecgFeatures;
  let rhythm = 'NORMAL';
  let confidence = 98.0 + Math.random() * 1.5;

  if (!p_wave_present && rr_irregular) {
    rhythm = 'AFIB'; confidence = 94 + Math.random() * 3;
  } else if (heart_rate_bpm > 100) {
    rhythm = 'TACHYCARDIA'; confidence = 91 + Math.random() * 4;
  } else if (heart_rate_bpm < 60) {
    rhythm = 'BRADYCARDIA'; confidence = 90 + Math.random() * 4;
  } else if (qrs_duration_ms > 120) {
    rhythm = 'PVC'; confidence = 89 + Math.random() * 4;
  }

  const probs = {};
  let remaining = 100 - confidence;
  RHYTHM_CLASSES.forEach(c => {
    if (c === rhythm) { probs[c] = confidence; return; }
    const share = Math.random() * remaining * 0.4;
    probs[c] = parseFloat(share.toFixed(2));
    remaining -= share;
  });

  return {
    rhythm_class: rhythm,
    confidence: parseFloat(confidence.toFixed(1)),
    probabilities: probs
  };
}

/**
 * Simulates XGBoost CVD risk prediction (backup)
 */
function predictCVDRisk(features) {
  const { heart_rate_bpm, qt_interval_ms, qrs_duration_ms, pr_interval_ms, st_deviation_mm, hrv_rmssd_ms, rhythm_class } = features;
  let score = 15;

  if (heart_rate_bpm > 120) score += 12;
  else if (heart_rate_bpm > 100) score += 6;
  else if (heart_rate_bpm < 40) score += 15;
  else if (heart_rate_bpm < 50) score += 8;

  if (hrv_rmssd_ms < 15) score += 15;
  else if (hrv_rmssd_ms < 25) score += 8;

  if (qt_interval_ms > 480) score += 15;
  else if (qt_interval_ms > 460) score += 8;

  if (qrs_duration_ms > 130) score += 12;
  else if (qrs_duration_ms > 120) score += 6;

  if (pr_interval_ms > 220) score += 6;
  else if (pr_interval_ms < 100) score += 4;

  if (Math.abs(st_deviation_mm) > 1.5) score += 30;
  else if (Math.abs(st_deviation_mm) > 0.8) score += 15;
  else if (Math.abs(st_deviation_mm) > 0.3) score += 6;

  const classWeights = { AFIB: 15, PVC: 10, TACHYCARDIA: 8, BRADYCARDIA: 6, NORMAL: 0 };
  score += classWeights[rhythm_class] || 0;
  score = Math.min(100, Math.max(0, Math.round(score + (Math.random() * 10 - 5))));

  let riskCategory = 'LOW';
  if (score >= 67) riskCategory = 'HIGH';
  else if (score >= 34) riskCategory = 'MODERATE';

  return {
    cvd_risk_score: score,
    risk_category: riskCategory,
    recommendations: generateRecommendations(rhythm_class, features, riskCategory)
  };
}

function generateRecommendations(rhythmClass, features, riskCategory) {
  const recs = [];

  if (rhythmClass === 'AFIB') {
    recs.push('URGENT: Atrial fibrillation detected — immediate cardiology referral required');
    recs.push('Assess stroke risk using CHA₂DS₂-VASc scoring tool');
    recs.push('Consider anticoagulation therapy assessment');
    recs.push('Rate control evaluation — target heart rate 60-80 BPM at rest');
  } else if (rhythmClass === 'TACHYCARDIA') {
    recs.push('Urgent: Cardiology referral for sustained tachycardia evaluation');
    recs.push('Investigate underlying causes: thyroid dysfunction, anemia, hypovolemia, fever');
    recs.push('Consider 24-hour Holter ECG monitoring');
    recs.push('Advise patient to avoid stimulants: caffeine, nicotine, energy drinks');
  } else if (rhythmClass === 'BRADYCARDIA') {
    recs.push('Cardiology referral for bradycardia investigation');
    recs.push('Review medications that may cause bradycardia');
    recs.push('Perform thyroid function tests');
    recs.push('ECG follow-up recommended in 2 weeks');
  } else if (rhythmClass === 'PVC') {
    recs.push('24-hour Holter monitoring recommended');
    recs.push('Evaluate coupling interval and PVC morphology');
    recs.push('Advise patient to avoid triggers: caffeine, alcohol, sleep deprivation, stress');
    recs.push('ECG follow-up in 4 weeks');
  } else {
    recs.push('Normal sinus rhythm — continue regular cardiac screening');
    recs.push('Maintain heart-healthy lifestyle');
    recs.push('No immediate intervention required');
  }

  if (features.qt_interval_ms > 450) {
    recs.push(`QT prolongation detected — check electrolytes`);
  }
  if (features.st_deviation_mm > 1.0) {
    recs.push('ST elevation detected — urgent assessment required');
  }
  if (features.hrv_rmssd_ms < 20) {
    recs.push('Low HRV detected — consider stress management');
  }

  return recs;
}

function extractFeatures(ecgData) {
  return {
    heart_rate_bpm: ecgData.heart_rate_bpm || Math.floor(Math.random() * 80) + 50,
    qt_interval_ms: ecgData.qt_interval_ms || Math.floor(Math.random() * 80) + 400,
    qrs_duration_ms: ecgData.qrs_duration_ms || Math.floor(Math.random() * 40) + 80,
    pr_interval_ms: ecgData.pr_interval_ms || Math.floor(Math.random() * 60) + 140,
    st_deviation_mm: ecgData.st_deviation_mm || parseFloat((Math.random() * 0.4).toFixed(2)),
    hrv_rmssd_ms: ecgData.hrv_rmssd_ms || Math.floor(Math.random() * 40) + 20,
    p_wave_axis: ecgData.p_wave_axis || Math.floor(Math.random() * 60) + 30,
    p_wave_present: ecgData.p_wave_present !== false,
    rr_irregular: ecgData.rr_irregular || false
  };
}

function getPtbxlWaveform(rhythmClass, durationSeconds = 5, sampleRate = 500) {
  // Find all PTB-XL samples with matching rhythm class
  const matchingSamples = ptbxlData.filter(s => s.rhythm_class === rhythmClass);
  
  if (matchingSamples.length > 0) {
    // Pick a random sample from matching ones
    const randomSample = matchingSamples[Math.floor(Math.random() * matchingSamples.length)];
    const samplesNeeded = durationSeconds * sampleRate;
    const availableSamples = randomSample.lead_ii.length;
    let waveformData = randomSample.lead_ii.slice(0, samplesNeeded);
    
    // If we need more data than available, loop the waveform
    while (waveformData.length < samplesNeeded) {
      waveformData = [...waveformData, ...randomSample.lead_ii];
    }
    return waveformData.slice(0, samplesNeeded);
  }
  return null;
}

function generateECGWaveform(rhythmClass = 'NORMAL', durationSeconds = 5, sampleRate = 500) {
  // First try to get PTB-XL sample
  const ptbxlWaveform = getPtbxlWaveform(rhythmClass, durationSeconds, sampleRate);
  if (ptbxlWaveform) {
    return ptbxlWaveform;
  }

  // Fallback to simulated waveform if PTB-XL not available
  const numSamples = durationSeconds * sampleRate;
  const data = [];
  const bpmMap = { NORMAL: 72, TACHYCARDIA: 145, BRADYCARDIA: 42, AFIB: 85, PVC: 75 };
  const bpm = bpmMap[rhythmClass] || 72;
  const rr = (60 / bpm) * sampleRate;

  for (let i = 0; i < numSamples; i++) {
    const tInCycle = (i % rr) / rr;
    let val = 0;

    if (rhythmClass === 'AFIB') {
      val = (Math.sin(i * 0.05) * 0.08) + (Math.random() - 0.5) * 0.15;
      const jitter = (Math.random() - 0.5) * 0.2;
      const qrsPos = 0.4 + jitter;
      val += gauss(tInCycle, qrsPos - 0.01, 0.005) * -0.3;
      val += gauss(tInCycle, qrsPos, 0.008) * 1.5;
      val += gauss(tInCycle, qrsPos + 0.015, 0.006) * -0.4;
      val += gauss(tInCycle, qrsPos + 0.1, 0.025) * 0.35;
    } else if (rhythmClass === 'PVC' && Math.floor(i / rr) % 5 === 4) {
      const qrsPos = 0.4;
      val += gauss(tInCycle, qrsPos, 0.02) * -0.8;
      val += gauss(tInCycle, qrsPos + 0.03, 0.018) * -1.2;
      val += gauss(tInCycle, qrsPos + 0.08, 0.03) * 0.5;
    } else {
      val += gauss(tInCycle, 0.15, 0.025) * 0.2;
      val += gauss(tInCycle, 0.38, 0.008) * -0.25;
      val += gauss(tInCycle, 0.4, 0.01) * 1.5;
      val += gauss(tInCycle, 0.42, 0.008) * -0.35;
      val += gauss(tInCycle, 0.55, 0.04) * 0.4;
    }
    val += (Math.random() - 0.5) * 0.03;
    data.push(parseFloat(val.toFixed(4)));
  }
  return data;
}

function gauss(x, mu, sigma) {
  return Math.exp(-Math.pow(x - mu, 2) / (2 * sigma * sigma));
}

module.exports = { analyzeECG, classifyArrhythmia, predictCVDRisk, generateECGWaveform, analyzeECGSimulated };
