import React, { useEffect, useState } from 'react';
import { FileText, Heart, Activity, User, ChevronDown, ChevronUp, Download, Share2 } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import ECGWaveform from '../../components/ECGWaveform';
import { generateECGReportDoc, downloadBlob, shareReport } from '../../utils/docGenerator';

const NAV_ITEMS = [
  { section: 'MY HEALTH', items: [
    { path: '/patient', label: 'My Dashboard', icon: Heart },
    { path: '/patient/analysis', label: 'Latest Analysis', icon: Activity },
    { path: '/patient/ecg-history', label: 'ECG History', icon: FileText },
  ]},
  { section: 'ACCOUNT', items: [{ path: '/patient/profile', label: 'My Profile', icon: User }] }
];

export default function PatientECGHistory() {
  const [history, setHistory] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [sharingId, setSharingId] = useState(null);

  const handleDownloadSingle = async (ecg, analysis) => {
    setDownloadingId(ecg.id);
    try {
      const blob = await generateECGReportDoc(patient, analysis, ecg);
      const filename = `ECG_Report_${patient.last_name}_${new Date(ecg.received_at).toISOString().split('T')[0]}_${ecg.id}.html`;
      downloadBlob(blob, filename);
      toast.success("Report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate report");
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShareSingle = async (ecg, analysis) => {
    setSharingId(ecg.id);
    try {
      const blob = await generateECGReportDoc(patient, analysis, ecg);
      const filename = `ECG_Report_${patient.last_name}_${new Date(ecg.received_at).toISOString().split('T')[0]}_${ecg.id}.html`;
      const result = await shareReport(
        blob, 
        filename,
        "My ECG Analysis Report",
        `Hi, here's my ECG analysis from ${new Date(ecg.received_at).toLocaleDateString()} (${analysis.risk_category} Risk, Score: ${analysis.cvd_risk_score}/100)`
      );
      if (result.success) {
        toast.success("Report shared successfully!");
      } else if (result.fallback === "clipboard") {
        toast.success("Share text copied to clipboard!");
      } else {
        toast.warning("Share not supported on this device");
      }
    } catch (err) {
      toast.error("Failed to share report");
      console.error(err);
    } finally {
      setSharingId(null);
    }
  };

  useEffect(() => {
    api.get('/patients/dashboard').then(res => {
      setPatient(res.data.patient);
      if (res.data.patient?.id) {
        api.get(`/patients/${res.data.patient.id}/ecg-history`).then(r => {
          setHistory(r.data.ecg_history || []);
        }).catch(() => toast.error('Failed to load ECG history'));
      }
    }).catch(() => toast.error('Failed to load patient data')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="loading-spinner"></div></div>;

  return (
    <AppLayout navItems={NAV_ITEMS} title="ECG History">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>My ECG History</h1>
        <p className="text-secondary text-sm">{history.length} ECG records on file</p>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
          <FileText size={40} style={{ marginBottom: 12, opacity: 0.3, margin: '0 auto 12px' }} />
          <p>No ECG records yet. Visit your hospital for an ECG recording.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((ecg, idx) => {
            const a = ecg.analysis;
            const riskColor = { HIGH: '#C00000', MODERATE: '#FF8C00', LOW: '#00875A' }[a?.risk_category] || 'var(--border)';
            const isExp = expanded === ecg.id;

            return (
              <div key={ecg.id} className="card" style={{ borderLeft: `4px solid ${riskColor}` }}>
                <div onClick={() => setExpanded(isExp ? null : ecg.id)} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Date */}
                  <div style={{ minWidth: 80 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{new Date(ecg.received_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(ecg.received_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>

                  {/* Rhythm + Risk */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {a?.rhythm_class && <span className="rhythm-badge">{a.rhythm_class}</span>}
                    {a?.risk_category && <span className={`risk-badge ${a.risk_category}`}>{a.risk_category} RISK</span>}
                    {idx === 0 && <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#EFF6FF', color: 'var(--primary)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(31,78,121,0.15)' }}>LATEST</span>}
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    {a?.cvd_risk_score !== undefined && (
                      <>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: riskColor }}>{a.cvd_risk_score}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ 100</div>
                      </>
                    )}
                  </div>

                  {isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>

                {isExp && a && (
                  <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-light)' }}>
                    {/* ECG Waveform */}
                    <div style={{ margin: '14px 0' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 10 }}>ECG Waveform Preview</h4>
                      <ECGWaveform rhythmType={a.rhythm_class || 'NORMAL'} height={160} animate={false} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                      {[
                        { label: 'Heart Rate', value: `${a.heart_rate_bpm} BPM` },
                        { label: 'QT Interval', value: `${a.qt_interval_ms} ms` },
                        { label: 'QRS Duration', value: `${a.qrs_duration_ms} ms` },
                        { label: 'HRV RMSSD', value: `${a.hrv_rmssd_ms} ms` },
                      ].map(m => (
                        <div key={m.label} className="metric-card">
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{m.value}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      AI Model: {a.model_version} · Processing: {a.inference_latency_ms}ms · Source: {ecg.hospital_name || 'Hospital ECG System'}
                    </div>
                    {a.recommendations?.slice(0, 2).map((rec, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: 6, marginBottom: 4 }}>
                        <span style={{ color: riskColor, fontWeight: 700, marginRight: 6 }}>{i + 1}.</span>{rec}
                      </div>
                    ))}
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDownloadSingle(ecg, a); }} disabled={downloadingId === ecg.id} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.875rem' }}>
                        <Download size={14} /> {downloadingId === ecg.id ? 'Generating...' : 'Download Report'}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleShareSingle(ecg, a); }} disabled={sharingId === ecg.id} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.875rem' }}>
                        <Share2 size={14} /> {sharingId === ecg.id ? 'Sharing...' : 'Share Report'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
