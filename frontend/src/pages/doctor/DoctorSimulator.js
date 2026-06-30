import React, { useState, useEffect } from 'react';
import { Zap, Play, Activity, Users, Bell, TrendingUp, CheckCircle } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import ECGChart from '../../components/shared/ECGChart';
import RiskGauge from '../../components/shared/RiskGauge';
import api from '../../services/api';
import { toast } from 'react-toastify';

const RHYTHMS = [
  { value: 'NORMAL', label: 'Normal Sinus Rhythm', color: '#00875A', desc: 'Regular P-QRS-T, HR 60-100 BPM' },
  { value: 'TACHYCARDIA', label: 'Sinus Tachycardia', color: '#FF8C00', desc: 'HR > 100 BPM, regular rhythm' },
  { value: 'BRADYCARDIA', label: 'Sinus Bradycardia', color: '#2E75B6', desc: 'HR < 60 BPM, regular rhythm' },
  { value: 'AFIB', label: 'Atrial Fibrillation', color: '#C00000', desc: 'Irregular RR, absent P waves' },
  { value: 'PVC', label: 'Premature Ventricular Complexes', color: '#9C27B0', desc: 'Wide QRS, compensatory pause' },
];

export default function DoctorSimulator() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedRhythm, setSelectedRhythm] = useState('NORMAL');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [waveform, setWaveform] = useState(null);
  const [step, setStep] = useState('idle'); // idle | transmitting | analyzing | complete

  useEffect(() => {
    api.get('/doctors/dashboard').then(res => {
      setPatients(res.data.patients || []);
      if (res.data.patients?.[0]) setSelectedPatient(String(res.data.patients[0].id));
    }).catch(() => {});
  }, []);

  // Live waveform generation (for preview)
  const [previewData, setPreviewData] = useState([]);
  useEffect(() => {
    // Generate preview waveform on rhythm change
    const dummy = generatePreviewWave(selectedRhythm);
    setPreviewData(dummy);
  }, [selectedRhythm]);

  const runSimulation = async () => {
    if (!selectedPatient) return toast.error('Select a patient first');
    setRunning(true);
    setResult(null);
    setStep('transmitting');

    try {
      // Step 1: Transmit
      await sleep(800);
      setStep('analyzing');

      // Step 2: Analyze
      const res = await api.post('/ecg/simulate', {
        patient_id: parseInt(selectedPatient),
        rhythm_class: selectedRhythm
      });

      setStep('complete');
      setResult(res.data.analysis);

      // Fetch waveform
      const patient = patients.find(p => p.id === parseInt(selectedPatient));
      if (patient) {
        const history = await api.get(`/patients/${selectedPatient}/ecg-history`);
        const latest = history.data.ecg_history?.[0];
        if (latest) {
          const wRes = await api.get(`/patients/${selectedPatient}/waveform/${latest.id}`);
          setWaveform(wRes.data);
        }
      }

      if (res.data.analysis.risk_category === 'HIGH') {
        toast.error(`🚨 HIGH RISK DETECTED: ${res.data.analysis.rhythm_class} · Score ${res.data.analysis.cvd_risk_score}/100 · Alert dispatched!`, { autoClose: 6000 });
      } else {
        toast.success(`✅ Analysis complete: ${res.data.analysis.rhythm_class} · ${res.data.analysis.risk_category} risk`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simulation failed');
      setStep('idle');
    } finally {
      setRunning(false);
    }
  };

  const riskColor = result ? { HIGH: '#C00000', MODERATE: '#FF8C00', LOW: '#00875A' }[result.risk_category] : null;
  const selectedPatientObj = patients.find(p => p.id === parseInt(selectedPatient));

  return (
    <AppLayout title="ECG Simulator">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>ECG Simulator & Testing Tool</h1>
        <p className="text-secondary text-sm">Simulate ECG transmission and AI analysis pipeline for any patient and rhythm type</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Patient selection */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Select Patient</h3></div>
            <div style={{ padding: 16 }}>
              {patients.map(p => (
                <div key={p.id} onClick={() => setSelectedPatient(String(p.id))} style={{
                  padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${selectedPatient === String(p.id) ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedPatient === String(p.id) ? 'rgba(31,78,121,0.04)' : 'white',
                  cursor: 'pointer', marginBottom: 6, transition: '0.15s'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {p.latest_analysis?.risk_category && <span className={`risk-badge ${p.latest_analysis.risk_category}`} style={{ fontSize: '0.6rem', marginRight: 6 }}>{p.latest_analysis.risk_category}</span>}
                    {p.ecg_count} ECG{p.ecg_count !== 1 ? 's' : ''} on record
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rhythm selection */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Select Rhythm</h3></div>
            <div style={{ padding: 16 }}>
              {RHYTHMS.map(r => (
                <div key={r.value} onClick={() => setSelectedRhythm(r.value)} style={{
                  padding: '10px 12px', borderRadius: 8,
                  border: `1.5px solid ${selectedRhythm === r.value ? r.color : 'var(--border)'}`,
                  background: selectedRhythm === r.value ? `${r.color}11` : 'white',
                  cursor: 'pointer', marginBottom: 6, transition: '0.15s'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: selectedRhythm === r.value ? r.color : 'var(--text-primary)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Run button */}
          <button onClick={runSimulation} disabled={running || !selectedPatient} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            {running ? (
              <><div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                {step === 'transmitting' ? 'Transmitting ECG...' : 'Running AI Analysis...'}</>
            ) : <><Play size={18} /> Run Simulation</>}
          </button>

          {/* Pipeline progress */}
          {step !== 'idle' && (
            <div className="card">
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>PIPELINE PROGRESS</div>
                {[
                  { id: 'transmitting', label: 'ECG Transmitted', sub: 'HL7 FHIR R4 format' },
                  { id: 'analyzing', label: 'AI Analysis', sub: '1D-CNN + XGBoost' },
                  { id: 'complete', label: 'Alert Dispatch', sub: 'SMS + Email if HIGH risk' },
                ].map((s, i) => {
                  const active = step === s.id;
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: step === 'complete' || (s.id === 'transmitting' && ['analyzing','complete'].includes(step)) ? '#00875A' : active ? 'var(--primary)' : 'var(--border)',
                        color: step === 'complete' || (s.id === 'transmitting' && ['analyzing','complete'].includes(step)) || active ? 'white' : 'var(--text-muted)'
                      }}>
                        {step === 'complete' || (s.id === 'transmitting' && ['analyzing','complete'].includes(step)) ? <CheckCircle size={14} /> : active ? <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }}></div> : <span style={{ fontSize: '0.7rem' }}>{i+1}</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Live preview waveform */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '0.9rem' }}>ECG Preview — {RHYTHMS.find(r => r.value === selectedRhythm)?.label}</h3>
            </div>
            <div style={{ padding: 16 }}>
              <ECGChart data={waveform?.data || previewData} rhythmClass={result?.rhythm_class || selectedRhythm} rPeaks={waveform?.r_peaks || []} height={160} />
            </div>
          </div>

          {result && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16 }}>
                {/* Metrics */}
                <div className="card">
                  <div className="card-header" style={{ background: `${riskColor}11`, borderBottom: `2px solid ${riskColor}33` }}>
                    <h3 style={{ fontSize: '0.9rem', color: riskColor }}>AI Analysis Results</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{result.inference_latency_ms}ms inference · {result.model_version}</span>
                  </div>
                  <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Rhythm', value: result.rhythm_class, unit: `${result.rhythm_confidence}% conf.` },
                      { label: 'CVD Score', value: `${result.cvd_risk_score}/100`, unit: result.risk_category },
                      { label: 'Heart Rate', value: result.heart_rate_bpm, unit: 'BPM' },
                      { label: 'QT Interval', value: result.qt_interval_ms, unit: 'ms' },
                      { label: 'QRS Duration', value: result.qrs_duration_ms, unit: 'ms' },
                      { label: 'HRV RMSSD', value: result.hrv_rmssd_ms, unit: 'ms' },
                    ].map(m => (
                      <div key={m.label} className="metric-card">
                        <div className="metric-value" style={{ fontSize: '1.2rem' }}>{m.value}</div>
                        <div className="metric-unit">{m.unit}</div>
                        <div className="metric-label">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Risk gauge */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RiskGauge score={result.cvd_risk_score} category={result.risk_category} size={160} />
                </div>
              </div>

              {/* Recommendations */}
              <div className="card">
                <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Clinical Recommendations</h3></div>
                <div style={{ padding: 16 }}>
                  {(result.recommendations || []).map((rec, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, padding: '8px 12px', background: i === 0 && result.risk_category === 'HIGH' ? '#FFF0F0' : 'var(--bg-primary)', borderRadius: 8, fontSize: '0.82rem', lineHeight: 1.5, border: `1px solid ${i === 0 && result.risk_category === 'HIGH' ? 'rgba(192,0,0,0.15)' : 'transparent'}` }}>
                      <span style={{ flexShrink: 0, color: riskColor, fontWeight: 700 }}>{i + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                  {result.risk_category === 'HIGH' && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: '#FFF0F0', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#C00000', fontWeight: 600 }}>
                      <Zap size={16} />
                      Alert dispatched: SMS + Email sent to {selectedPatientObj?.first_name} {selectedPatientObj?.last_name} and assigned physician
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {!result && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
              <Zap size={36} style={{ opacity: 0.3 }} />
              <p>Select a patient and rhythm, then click "Run Simulation"</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function generatePreviewWave(rhythmClass) {
  const n = 2000;
  const bpm = { NORMAL: 72, TACHYCARDIA: 140, BRADYCARDIA: 42, AFIB: 85, PVC: 75 }[rhythmClass] || 72;
  const rr = (60 / bpm) * 500;
  const data = [];
  for (let i = 0; i < n; i++) {
    const t = (i % rr) / rr;
    let v = 0;
    if (rhythmClass === 'AFIB') {
      v = Math.sin(i * 0.05) * 0.06 + (Math.random() - 0.5) * 0.12;
      v += gauss(t, 0.4 + (Math.random() - 0.5) * 0.15, 0.01) * 1.2;
      v += gauss(t, 0.5, 0.03) * 0.3;
    } else {
      v += gauss(t, 0.15, 0.025) * 0.18;
      v += gauss(t, 0.38, 0.008) * -0.22;
      v += gauss(t, 0.40, 0.01) * (rhythmClass === 'PVC' && Math.floor(i / rr) % 5 === 4 ? -0.8 : 1.4);
      v += gauss(t, 0.42, 0.008) * -0.3;
      v += gauss(t, 0.55, 0.04) * 0.35;
    }
    v += (Math.random() - 0.5) * 0.02;
    data.push(parseFloat(v.toFixed(4)));
  }
  return data;
}

function gauss(x, mu, s) { return Math.exp(-Math.pow(x - mu, 2) / (2 * s * s)); }
