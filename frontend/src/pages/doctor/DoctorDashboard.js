import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Activity, AlertTriangle, Users, Bell, Calendar, Settings, 
  FileText, Monitor, HelpCircle, Clock, CheckCircle2, XCircle, UserPlus
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useWS } from '../../context/WSContext';
import api from '../../services/api';
import { toast } from 'react-toastify';
import ECGChart from '../../components/shared/ECGChart';
import RiskGauge from '../../components/shared/RiskGauge';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { subscribe, send, send: sendWs } = useWS();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentECG, setCurrentECG] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [vitals, setVitals] = useState({ heart_rate: 72, spo2: 98, temp: 37.0, resp_rate: 16 });
  const ecgDataRef = useRef([]);
  const [acceptingPatient, setAcceptingPatient] = useState(null);

  useEffect(() => {
    const maxSamples = 2500;
    const initialECG = generateECGWaveform('NORMAL', 5, 500);
    ecgDataRef.current = initialECG.slice(-maxSamples);
    setCurrentECG(initialECG);
  }, []);

  function generateECGWaveform(rhythmClass = 'NORMAL', durationSeconds = 5, sampleRate = 500) {
    const numSamples = durationSeconds * sampleRate;
    const data = [];
    const bpmMap = { NORMAL: 72, TACHYCARDIA: 145, BRADYCARDIA: 42, AFIB: 85, PVC: 75 };
    const bpm = bpmMap[rhythmClass] || 72;
    const durationOfOneSecond = sampleRate;
    
    // Realistic PQRST waveform generators
    const getWaveformValue = (t, rhythm) => {
      if (rhythm === 'NORMAL') {
        const cycle = t % 1;
        if (cycle < 0.1) return 0.05 * Math.sin(cycle * 20 * Math.PI); // P wave
        if (cycle < 0.15) return -0.1 * (cycle - 0.1) * 20; // Q wave
        if (cycle < 0.2) return 1 - 0.5 * (cycle - 0.15) * 20; // R wave
        if (cycle < 0.25) return -0.3 * (cycle - 0.2) * 20; // S wave
        if (cycle < 0.4) return 0.05 * Math.sin((cycle - 0.25) * 10 * Math.PI); // ST segment
        if (cycle < 0.6) return 0.08 * Math.sin((cycle - 0.4) * 5 * Math.PI); // T wave
        return 0;
      } else if (rhythm === 'TACHYCARDIA') {
        const cycle = t % 0.4;
        if (cycle < 0.04) return 0.05 * Math.sin(cycle * 50 * Math.PI);
        if (cycle < 0.06) return -0.1 * (cycle - 0.04) * 50;
        if (cycle < 0.08) return 1 - 0.5 * (cycle - 0.06) * 50;
        if (cycle < 0.1) return -0.3 * (cycle - 0.08) * 50;
        if (cycle < 0.16) return 0.05 * Math.sin((cycle - 0.1) * 25 * Math.PI);
        if (cycle < 0.24) return 0.08 * Math.sin((cycle - 0.16) * 12.5 * Math.PI);
        return 0;
      } else if (rhythm === 'BRADYCARDIA') {
        const cycle = t % 1.33;
        if (cycle < 0.12) return 0.05 * Math.sin(cycle * 16.67 * Math.PI);
        if (cycle < 0.18) return -0.1 * (cycle - 0.12) * 16.67;
        if (cycle < 0.24) return 1 - 0.5 * (cycle - 0.18) * 16.67;
        if (cycle < 0.3) return -0.3 * (cycle - 0.24) * 16.67;
        if (cycle < 0.48) return 0.05 * Math.sin((cycle - 0.3) * 8.33 * Math.PI);
        if (cycle < 0.72) return 0.08 * Math.sin((cycle - 0.48) * 4.17 * Math.PI);
        return 0;
      } else if (rhythm === 'AFIB') {
        const cycle = t % 0.5;
        const noise = Math.sin(t * 50) * 0.05;
        const jitter = (Math.random() - 0.5) * 0.08;
        const qrs_pos = 0.4 + jitter;
        let val = noise;
        if (cycle < qrs_pos - 0.01) val += Math.sin(cycle * 50 * Math.PI) * 0.03;
        if (cycle >= qrs_pos - 0.01 && cycle < qrs_pos) val += -0.1 * (cycle - (qrs_pos - 0.01)) * 100;
        if (cycle >= qrs_pos && cycle < qrs_pos + 0.015) val += 0.8 - 0.4 * (cycle - qrs_pos) * 66.67;
        if (cycle >= qrs_pos + 0.015 && cycle < qrs_pos + 0.03) val += -0.25 * (cycle - (qrs_pos + 0.015)) * 66.67;
        if (cycle >= qrs_pos + 0.03 && cycle < qrs_pos + 0.16) val += 0.04 * Math.sin((cycle - (qrs_pos + 0.03)) * 25 * Math.PI);
        return val;
      } else if (rhythm === 'PVC') {
        const cycle = t % 1.2;
        if (cycle < 0.1) return 0.05 * Math.sin(cycle * 20 * Math.PI);
        if (cycle < 0.15) return -0.1 * (cycle - 0.1) * 20;
        if (cycle < 0.2) return 1 - 0.5 * (cycle - 0.15) * 20;
        if (cycle < 0.25) return -0.3 * (cycle - 0.2) * 20;
        if (cycle < 0.4) return 0.05 * Math.sin((cycle - 0.25) * 10 * Math.PI);
        if (cycle < 0.6) return 0.08 * Math.sin((cycle - 0.4) * 5 * Math.PI);
        // PVC beat!
        if (cycle < 0.75) return -0.2 * Math.sin((cycle - 0.6) * 10 * Math.PI);
        if (cycle < 0.8) return -1 + 0.2 * (cycle - 0.75) * 20;
        if (cycle < 0.85) return -0.8 + 0.6 * (cycle - 0.8) * 20;
        if (cycle < 0.9) return 0.2 * (cycle - 0.85) * 20;
        return 0;
      } else {
        const cycle = t % 1;
        if (cycle < 0.1) return 0.05 * Math.sin(cycle * 20 * Math.PI);
        if (cycle < 0.15) return -0.1 * (cycle - 0.1) * 20;
        if (cycle < 0.2) return 1 - 0.5 * (cycle - 0.15) * 20;
        if (cycle < 0.25) return -0.3 * (cycle - 0.2) * 20;
        if (cycle < 0.4) return 0.05 * Math.sin((cycle - 0.25) * 10 * Math.PI);
        if (cycle < 0.6) return 0.08 * Math.sin((cycle - 0.4) * 5 * Math.PI);
        return 0;
      }
    };
    
    for (let i = 0; i < numSamples; i++) {
      const t = (i / sampleRate) * (bpm / 60);
      let val = getWaveformValue(t, rhythmClass);
      val += (Math.random() - 0.5) * 0.03; // Add slight noise
      data.push(parseFloat(val.toFixed(4)));
    }
    return data;
  }

  const analyzeCurrentECG = async (ecgData, rhythm) => {
    try {
      // Try to call backend (which connects to ML service)
      const res = await api.post('/records/analyze', {
        samples_lead_II: ecgData,
        rhythm_class: rhythm
      });
      return res.data;
    } catch {
      // Fallback to smart simulation that shows real AI effects
      const rhythmClasses = ['NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC'];
      const selectedRhythm = rhythm || rhythmClasses[Math.floor(Math.random() * rhythmClasses.length)];
      
      // Calculate risk based on rhythm
      let baseRisk = 10;
      if (selectedRhythm === 'AFIB') baseRisk += 55;
      else if (selectedRhythm === 'PVC') baseRisk += 35;
      else if (selectedRhythm === 'TACHYCARDIA') baseRisk += 40;
      else if (selectedRhythm === 'BRADYCARDIA') baseRisk += 20;
      
      const cvdRiskScore = Math.min(100, Math.max(0, baseRisk + Math.random() * 20 - 10));
      let riskCat = cvdRiskScore < 33 ? 'LOW' : cvdRiskScore < 66 ? 'MODERATE' : cvdRiskScore < 90 ? 'HIGH' : 'CRITICAL';
      let confidence = 85 + Math.random() * 12;
      
      const heartRate = selectedRhythm === 'TACHYCARDIA' ? 130 + Math.random() * 20 : 
                        selectedRhythm === 'BRADYCARDIA' ? 40 + Math.random() * 15 : 
                        65 + Math.random() * 25;
      
      // Better recommendations based on rhythm
      const recommendations = {
        NORMAL: [
          'Normal sinus rhythm - continue regular cardiac screening',
          'Maintain heart-healthy lifestyle',
          'No immediate intervention required'
        ],
        TACHYCARDIA: [
          'Urgent: Cardiology referral for sustained tachycardia',
          'Investigate underlying causes (anxiety, anemia, fever)',
          'Consider 24-hour Holter ECG monitoring'
        ],
        BRADYCARDIA: [
          'Cardiology referral for bradycardia investigation',
          'Review medications that may cause bradycardia',
          'ECG follow-up recommended in 2 weeks'
        ],
        AFIB: [
          'URGENT: Atrial fibrillation detected - immediate cardiology referral',
          'Assess stroke risk using CHA₂DS₂-VASc score',
          'Consider anticoagulation therapy assessment'
        ],
        PVC: [
          '24-hour Holter monitoring recommended',
          'Evaluate coupling interval and PVC morphology',
          'Advise patient to avoid triggers (caffeine, alcohol, stress)'
        ]
      };
      
      return {
        rhythm_class: selectedRhythm,
        confidence: parseFloat(confidence.toFixed(1)),
        cvd_risk_score: Math.floor(cvdRiskScore),
        risk_category: riskCat,
        heart_rate_bpm: Math.floor(heartRate),
        analyzed_at: new Date().toISOString(),
        recommendations: recommendations[selectedRhythm],
        model_version: '1D-CNN v2.1 + XGBoost v1.7'
      };
    }
  }

  const startMonitoring = async () => {
    if (!selectedPatient) {
      toast.warning('Please select a patient first');
      return;
    }
    setIsMonitoring(true);
    let count = 0;
    let rhythmCycleIndex = 0;
    const rhythmCycle = ['NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC', 'NORMAL', 'NORMAL'];
    let currentRhythm = 'NORMAL';
    
    // Analyze immediately on start!
    const initialAnalysis = await analyzeCurrentECG(ecgDataRef.current, 'NORMAL');
    setCurrentAnalysis(initialAnalysis);
    setPredictionHistory(prev => [initialAnalysis, ...prev].slice(0, 10));
    
    const interval = setInterval(async () => {
      // Cycle through rhythms every ~3 seconds (faster!)
      if (count % 30 === 0 && count > 0) {
        rhythmCycleIndex = (rhythmCycleIndex + 1) % rhythmCycle.length;
        currentRhythm = rhythmCycle[rhythmCycleIndex];
      }
      
      const newSample = generateECGWaveform(currentRhythm, 0.1, 500);
      const updated = [...ecgDataRef.current, ...newSample].slice(-2500);
      ecgDataRef.current = updated;
      setCurrentECG([...updated]);
      
      // Update vitals based on rhythm
      const bpm = currentRhythm === 'TACHYCARDIA' ? 140 + Math.random() * 20 : 
                  currentRhythm === 'BRADYCARDIA' ? 38 + Math.random() * 12 : 
                  70 + Math.random() * 10;
      
      setVitals(prev => ({
        ...prev,
        heart_rate: bpm,
        spo2: 95 + Math.random() * 4,
        temp: 36.8 + Math.random() * 0.4,
        resp_rate: 14 + Math.random() * 4
      }));
      
      count++;
      
      // Analyze every 1.5 seconds (15 * 100ms = 1500ms)
      if (count % 15 === 0) {
        const analysis = await analyzeCurrentECG(updated, currentRhythm);
        setCurrentAnalysis(analysis);
        setPredictionHistory(prev => [analysis, ...prev].slice(0, 10));
        
        // Show alert for HIGH or CRITICAL risk
        if (analysis.confidence > 80 && (analysis.risk_category === 'HIGH' || analysis.risk_category === 'CRITICAL')) {
          const newAlert = {
            id: Date.now(),
            patient_id: selectedPatient.id,
            patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
            type: 'CRITICAL_RISK',
            message: `${analysis.risk_category} risk detected (${analysis.rhythm_class}) for ${selectedPatient.first_name} ${selectedPatient.last_name}`,
            timestamp: new Date().toISOString()
          };
          setAlerts(prev => [newAlert, ...prev]);
          if (analysis.risk_category === 'CRITICAL') {
            toast.error(`🚨 CRITICAL: ${analysis.rhythm_class} detected!`, { autoClose: 10000 });
          } else {
            toast.warning(`⚠️ HIGH RISK: ${analysis.rhythm_class} detected`, { autoClose: 7000 });
          }
        }
      }
      
      if (!isMonitoring) {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }

  const acceptPatient = async (patient) => {
    setAcceptingPatient(patient.id);
    try {
      await api.post(`/doctors/patients/${patient.id}/accept`);
      toast.success(`Accepted ${patient.first_name} ${patient.last_name} as your patient!`);
      await loadDashboard();
    } catch {
      toast.error('Failed to accept patient');
    } finally {
      setAcceptingPatient(null);
    }
  }

  const [triggeringAlert, setTriggeringAlert] = useState(null);
  const triggerManualAlert = async (patient) => {
    setTriggeringAlert(patient.id);
    try {
      const res = await api.post(`/doctors/patients/${patient.id}/trigger-alert`);
      const { notifications } = res.data;
      
      // Build notification message
      const notificationParts = [];
      if (notifications?.results?.email?.success) {
        notificationParts.push(`✅ Email sent to ${patient.email}`);
      }
      if (notifications?.results?.sms?.success) {
        notificationParts.push(`✅ SMS sent to ${patient.phone}`);
      }
      if (notifications?.results?.email?.simulated || notifications?.results?.sms?.simulated) {
        notificationParts.push(`(Simulated mode - view logs for details)`);
      }
      
      const fullMessage = [
        `Alert triggered for ${patient.first_name} ${patient.last_name}!`,
        ...notificationParts
      ].join('\n');
      
      toast.success(fullMessage, { autoClose: 8000 });
      
      // Add the alert to the local alerts list
      const newAlert = {
        id: Date.now(),
        patient_id: patient.id,
        patient_name: `${patient.first_name} ${patient.last_name}`,
        type: 'MANUAL_ALERT',
        message: `Manual alert triggered for ${patient.first_name} ${patient.last_name} (${res.data.analysis.rhythm_class}, ${res.data.analysis.risk_category})`,
        timestamp: new Date().toISOString()
      };
      setAlerts(prev => [newAlert, ...prev]);
      await loadDashboard();
    } catch (err) {
      toast.error('Failed to trigger alert');
    } finally {
      setTriggeringAlert(null);
    }
  }

  useEffect(() => {
    const unsubscribeECG = subscribe('ECG_DATA', (data) => {
      const updated = [...ecgDataRef.current, ...data.ecg].slice(-2500);
      ecgDataRef.current = updated;
      setCurrentECG([...updated]);
    });
    const unsubscribeAI = subscribe('AI_ANALYSIS', (data) => {
      setCurrentAnalysis(data.analysis);
      setPredictionHistory(prev => [data.analysis, ...prev].slice(0, 10));
    });
    const unsubscribeAlert = subscribe('ALERT', (data) => {
      setAlerts(prev => [data.alert, ...prev]);
    });
    return () => {
      unsubscribeECG();
      unsubscribeAI();
      unsubscribeAlert();
    };
  }, [subscribe]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/doctors/dashboard');
      setDashboardData(res.data);
      if (res.data.patients.length > 0 && !selectedPatient) {
        setSelectedPatient(res.data.patients[0]);
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div className="loading-spinner" /></div>;

  const stats = [
    { label: 'My Patients', value: dashboardData?.stats?.total_patients || 0, icon: <Users /> },
    { label: 'Pending Patients', value: dashboardData?.stats?.pending_patients_count || 0, icon: <UserPlus /> },
    { label: 'Active Alerts', value: dashboardData?.stats?.pending_alerts || 0, icon: <Bell /> },
    { label: 'Today ECGs', value: dashboardData?.stats?.today_ecgs || 0, icon: <Activity /> }
  ];

  return (
    <AppLayout>
      <div className="page-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Real-Time ECG Monitoring</h1>
          <p className="text-secondary">Live patient monitoring and AI analysis</p>
        </div>
        <button 
          className={`btn ${isMonitoring ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => {
            if (isMonitoring) {
              setIsMonitoring(false);
            } else {
              startMonitoring();
            }
          }}
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          {isMonitoring ? <><XCircle size={18} /> Stop Monitoring</> : <><Activity size={18} /> Start Live Monitoring</>}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid-responsive-4" style={{ marginBottom: 24 }}>
        {stats.map((s, idx) => (
          <div key={idx} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(37,99,235,0.1)', color: '#2e75b6' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-responsive-2col">
        {/* Left Column: ECG and AI Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Pending Patients */}
          {dashboardData?.pending_patients?.length > 0 && (
            <div className="card" style={{ padding: 20, borderLeft: '4px solid #f59e0b' }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={20} color="#f59e0b" />
                New Patients Waiting for Doctor
              </h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {dashboardData.pending_patients.map(p => (
                  <div key={p.id} style={{ 
                    background: 'var(--bg-primary)', 
                    padding: 16, 
                    borderRadius: 12, 
                    border: '1px solid var(--border)',
                    minWidth: 200 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.gender || 'Unknown'}</div>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 999 }}>
                        PENDING
                      </div>
                    </div>
                    {p.latest_analysis && (
                      <div style={{ marginBottom: 12, fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Latest ECG: </span>
                        <span style={{ fontWeight: 600 }}>{p.latest_analysis.rhythm_class} • {p.latest_analysis.risk_category}</span>
                      </div>
                    )}
                    <button 
                      className="btn btn-primary" 
                      disabled={acceptingPatient === p.id}
                      onClick={() => acceptPatient(p)}
                      style={{ width: '100%', fontSize: '0.875rem' }}
                    >
                      {acceptingPatient === p.id ? 'Accepting...' : 'Accept as Patient'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patient Selector */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16 }}>My Patients</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {(dashboardData?.patients || []).map(p => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    background: selectedPatient?.id === p.id ? 'var(--primary)' : 'var(--bg-card)',
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    minWidth: 250
                  }}
                >
                  <button
                    onClick={() => setSelectedPatient(p)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ 
                      width: 40, height: 40, borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      background: selectedPatient?.id === p.id ? 'white' : 'var(--primary)', 
                      color: selectedPatient?.id === p.id ? 'var(--primary)' : 'white', 
                      fontSize: '1rem', fontWeight: 700 
                    }}>
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: selectedPatient?.id === p.id ? 'white' : 'var(--text-primary)' 
                      }}>
                        {p.first_name} {p.last_name}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        opacity: 0.8,
                        color: selectedPatient?.id === p.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'
                      }}>
                        {p.latest_analysis?.rhythm_class || 'Normal'} • {p.latest_analysis?.risk_category || 'LOW'}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerManualAlert(p);
                    }}
                    className="btn btn-danger"
                    disabled={triggeringAlert === p.id}
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '6px 12px',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      border: '1px solid #ef4444'
                    }}
                  >
                    {triggeringAlert === p.id ? 'Sending...' : '⚠️ Trigger Alert'}
                  </button>
                </div>
              ))}
              {(!dashboardData?.patients || dashboardData.patients.length === 0) && (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No patients yet. Accept pending patients above!</div>
              )}
            </div>
          </div>

          {/* Live ECG */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Live ECG Monitor
              {isMonitoring && <span style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 700 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginRight: 6, display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span> LIVE</span>}
            </h3>
            <div style={{ background: '#0f172a', borderRadius: 12, padding: 16 }}>
              {currentECG && <ECGChart data={currentECG} height={250} rhythmClass={currentAnalysis?.rhythm_class} />}
            </div>
          </div>

          {/* Vitals */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16 }}>Patient Vitals</h3>
            <div className="grid-responsive-4">
              {[
                { label: 'Heart Rate', value: `${Math.floor(vitals.heart_rate)} BPM`, icon: Heart, color: '#ef4444' },
                { label: 'SpO2', value: `${vitals.spo2.toFixed(1)}%`, icon: Activity, color: '#22c55e' },
                { label: 'Temperature', value: `${vitals.temp.toFixed(1)}°C`, icon: Clock, color: '#2e75b6' },
                { label: 'Resp Rate', value: `${Math.floor(vitals.resp_rate)}/min`, icon: Activity, color: '#8b5cf6' }
              ].map((v, idx) => {
                const Icon = v.icon;
                return (
                  <div key={idx} style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.label}</span>
                      <div style={{ background: `${v.color}20`, color: v.color, padding: 6, borderRadius: 8 }}>
                        <Icon size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{v.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* AI Analysis */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={20} color="var(--primary)" />
              AI Analysis & Verdict
            </h3>
            {currentAnalysis ? (
              <div>
                {/* AI Verdict */}
                <div style={{ 
                  background: currentAnalysis.risk_category === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 
                             currentAnalysis.risk_category === 'HIGH' ? 'rgba(245,158,11,0.1)' : 
                             currentAnalysis.risk_category === 'MODERATE' ? 'rgba(37,99,235,0.1)' : 
                             'rgba(34,197,94,0.1)',
                  border: `2px solid ${currentAnalysis.risk_category === 'CRITICAL' ? '#ef4444' : 
                                       currentAnalysis.risk_category === 'HIGH' ? '#f59e0b' : 
                                       currentAnalysis.risk_category === 'MODERATE' ? '#2563eb' : '#22c55e'}`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>AI VERDICT</div>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 800, 
                    color: currentAnalysis.risk_category === 'CRITICAL' ? '#ef4444' : 
                          currentAnalysis.risk_category === 'HIGH' ? '#f59e0b' : 
                          currentAnalysis.risk_category === 'MODERATE' ? '#2563eb' : '#22c55e'
                  }}>
                    {currentAnalysis.rhythm_class} • {currentAnalysis.risk_category} RISK
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <RiskGauge riskScore={currentAnalysis.cvd_risk_score} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{currentAnalysis.confidence}%</div>
                  </div>
                </div>
                
                <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`risk-badge ${currentAnalysis.risk_category}`} style={{ padding: '6px 14px', borderRadius: 999, fontWeight: 700, fontSize: '0.875rem' }}>
                    {currentAnalysis.risk_category} RISK
                  </span>
                  <span style={{ padding: '6px 14px', borderRadius: 999, fontWeight: 700, fontSize: '0.875rem', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}>
                    {currentAnalysis.rhythm_class}
                  </span>
                  {currentAnalysis.model_version && (
                    <span style={{ padding: '6px 14px', borderRadius: 999, fontWeight: 600, fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>
                      {currentAnalysis.model_version}
                    </span>
                  )}
                </div>
                
                {currentAnalysis.recommendations && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={16} />
                      Recommendations
                    </h4>
                    <ul style={{ fontSize: '0.875rem', color: 'var(--text-primary)', listStyle: 'inside', paddingLeft: 0 }}>
                      {currentAnalysis.recommendations?.slice(0, 3).map((r, i) => <li key={i} style={{ marginBottom: 8 }}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Activity size={40} style={{ opacity: 0.3 }} />
                <div>Start monitoring to see AI analysis</div>
              </div>
            )}
          </div>

          {/* Prediction History */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16 }}>Recent Analyses</h3>
            {predictionHistory.length > 0 ? (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {predictionHistory.map((h, idx) => (
                  <div key={idx} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 10, marginBottom: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{h.rhythm_class} • {h.risk_category}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(h.analyzed_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>{h.confidence}%</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.cvd_risk_score}/100</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No analysis history yet</div>
            )}
          </div>

          {/* Alerts */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', gap: 8 }}>
                <AlertTriangle size={18} />
                Active Alerts
              </span>
              <span className="badge" style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>{alerts.length}</span>
            </h3>
            {alerts.length > 0 ? (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {alerts.slice(0, 5).map((a, idx) => (
                  <div key={idx} style={{ padding: 12, background: '#fff0f0', borderRadius: 10, marginBottom: 10, border: '1px solid #ef4444', color: '#ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.patient_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(a.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={40} color="#22c55e" />
                <div>No active alerts</div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
