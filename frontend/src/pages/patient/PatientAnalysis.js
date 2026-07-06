import React, { useEffect, useState } from 'react';
import { Activity, Heart, FileText, User, AlertTriangle, Clock, Download, Share2 } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import ECGChart from '../../components/shared/ECGChart';
import RiskGauge from '../../components/shared/RiskGauge';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { generateECGReportDoc, downloadBlob, shareReport, generateECGReportPDF } from '../../utils/docGenerator';

const NAV_ITEMS = [
  { section: 'MY HEALTH', items: [
    { path: '/patient', label: 'My Dashboard', icon: Heart },
    { path: '/patient/analysis', label: 'Latest Analysis', icon: Activity },
    { path: '/patient/ecg-history', label: 'ECG History', icon: FileText },
  ]},
  { section: 'ACCOUNT', items: [{ path: '/patient/profile', label: 'My Profile', icon: User }] }
];

export default function PatientAnalysis() {
  const [data, setData] = useState(null);
  const [waveform, setWaveform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [downloading, setDownloading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateECGReportDoc(data.patient, data.latest_analysis, null);
      const filename = `ECG_Report_${data.patient.last_name}_${new Date().toISOString().split('T')[0]}.html`;
      downloadBlob(blob, filename);
      toast.success("Report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate report");
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const doc = await generateECGReportPDF(data.patient, data.latest_analysis, null);
      doc.save(`ECG_Report_${data.patient.last_name}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF Report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate PDF report");
      console.error(err);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await generateECGReportDoc(data.patient, data.latest_analysis, null);
      const filename = `ECG_Report_${data.patient.last_name}_${new Date().toISOString().split('T')[0]}.html`;
      const result = await shareReport(
        blob, 
        filename,
        "My ECG Analysis Report",
        `Hi, here's my latest ECG analysis report (${data.latest_analysis.risk_category} Risk, Score: ${data.latest_analysis.cvd_risk_score}/100)`
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
      setSharing(false);
    }
  };

  useEffect(() => {
    api.get('/patients/dashboard').then(async res => {
      setData(res.data);
      const pid = res.data.patient?.id;
      if (pid) {
        const hist = await api.get(`/patients/${pid}/ecg-history`);
        const latest = hist.data.ecg_history?.[0];
        if (latest) {
          const wRes = await api.get(`/patients/${pid}/waveform/${latest.id}`);
          setWaveform(wRes.data);
        }
      }
    }).catch(() => toast.error('Failed to load analysis')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="loading-spinner"></div></div>;

  const la = data?.latest_analysis;
  const riskColor = { HIGH: '#C00000', MODERATE: '#FF8C00', LOW: '#00875A' }[la?.risk_category] || '#94A3B8';

  if (!la) return (
    <AppLayout navItems={NAV_ITEMS} title="Latest Analysis">
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
        <Activity size={48} style={{ marginBottom: 16, opacity: 0.3, display: 'block', margin: '0 auto 16px' }} />
        <h3 style={{ marginBottom: 8 }}>No Analysis Available</h3>
        <p>Visit your hospital to have an ECG recorded and analyzed.</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout navItems={NAV_ITEMS} title="Latest ECG Analysis">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>My Latest ECG Analysis</h1>
          <p className="text-secondary text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={13} /> {new Date(la.analyzed_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`risk-badge ${la.risk_category} ${la.risk_category === 'HIGH' ? 'pulse' : ''}`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
            {la.risk_category} RISK
          </span>
          <span className="rhythm-badge" style={{ fontSize: '0.85rem' }}>{la.rhythm_class}</span>
          <button onClick={handleDownload} disabled={downloading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> {downloading ? 'Generating...' : 'Download HTML'}
          </button>
          <button onClick={handleDownloadPDF} disabled={downloadingPDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#00875A' }}>
            <FileText size={16} /> {downloadingPDF ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={handleShare} disabled={sharing} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Share2 size={16} /> {sharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {[['summary', 'Summary'], ['waveform', 'ECG Waveform'], ['details', 'Full Details']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
            color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: `2px solid ${activeTab === tab ? 'var(--primary)' : 'transparent'}`,
            marginBottom: -2, transition: '0.15s'
          }}>{label}</button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Risk explanation */}
            <div className="card" style={{ borderLeft: `4px solid ${riskColor}` }}>
              <div style={{ padding: '20px 24px' }}>
                <h3 style={{ marginBottom: 8, color: riskColor }}>
                  {la.risk_category === 'HIGH' ? '⚠️ High Risk Detected' : la.risk_category === 'MODERATE' ? '⚡ Moderate Risk' : '✅ Low Risk'}
                </h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  {la.risk_category === 'HIGH'
                    ? 'Your ECG shows signs that require immediate medical attention. Our AI detected an abnormal cardiac rhythm with a high cardiovascular disease risk score. Your doctor has already been notified.'
                    : la.risk_category === 'MODERATE'
                    ? 'Your ECG shows some irregularities that should be monitored. Your cardiovascular risk is in the moderate range. Please follow up with your doctor at your next appointment.'
                    : 'Your ECG looks healthy. The AI detected a normal sinus rhythm with a low cardiovascular disease risk score. Continue your regular check-ups.'
                  }
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--bg-primary)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.4rem', color: riskColor }}>{la.cvd_risk_score}/100</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CVD Risk Score</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--bg-primary)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>{la.rhythm_confidence}%</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AI Confidence</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--bg-primary)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{la.heart_rate_bpm}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Heart Rate (BPM)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="card">
              <div className="card-header"><h3>ECG Measurements</h3></div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  { label: 'Heart Rate', value: la.heart_rate_bpm, unit: 'BPM', normal: '60–100 BPM', ok: la.heart_rate_bpm >= 60 && la.heart_rate_bpm <= 100 },
                  { label: 'QT Interval', value: la.qt_interval_ms, unit: 'ms', normal: '< 450 ms', ok: la.qt_interval_ms < 450 },
                  { label: 'QRS Duration', value: la.qrs_duration_ms, unit: 'ms', normal: '< 120 ms', ok: la.qrs_duration_ms < 120 },
                  { label: 'HRV (RMSSD)', value: la.hrv_rmssd_ms, unit: 'ms', normal: '> 20 ms', ok: la.hrv_rmssd_ms >= 20 },
                ].map(m => (
                  <div key={m.label} style={{ padding: '12px 14px', background: m.ok ? 'var(--bg-primary)' : '#FFF8EC', borderRadius: 8, border: `1px solid ${m.ok ? 'var(--border)' : 'rgba(255,140,0,0.2)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: m.ok ? 'var(--text-primary)' : '#FF8C00' }}>{m.value} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>{m.unit}</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{m.label}</div>
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: m.ok ? '#F0FFF4' : '#FFF8EC', color: m.ok ? '#00875A' : '#FF8C00' }}>
                        {m.ok ? '✓ NORMAL' : '! CHECK'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Normal range: {m.normal}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="card">
              <div className="card-header"><h3>What To Do Next</h3></div>
              <div style={{ padding: 16 }}>
                {(la.recommendations || []).map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '10px 14px', background: i === 0 && la.risk_category === 'HIGH' ? '#FFF0F0' : 'var(--bg-primary)', borderRadius: 8, border: `1px solid ${i === 0 && la.risk_category === 'HIGH' ? 'rgba(192,0,0,0.12)' : 'transparent'}` }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: riskColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: i === 0 && la.risk_category === 'HIGH' ? '#C00000' : 'var(--text-primary)' }}>{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Your Risk Score</h3></div>
              <div style={{ padding: '24px 16px' }}>
                <RiskGauge score={la.cvd_risk_score} category={la.risk_category} size={180} />
                <div style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <strong style={{ color: '#00875A' }}>0–33</strong>: Low · <strong style={{ color: '#FF8C00' }}>34–66</strong>: Moderate · <strong style={{ color: '#C00000' }}>67–100</strong>: High
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '0.9rem' }}>Analysis Details</h3></div>
              <div style={{ padding: '12px 16px' }}>
                {[
                  { label: 'AI Model', value: la.model_version?.split('+')[0]?.trim() || '1D-CNN' },
                  { label: 'Processing Time', value: `${la.inference_latency_ms} ms` },
                  { label: 'Analyzed', value: new Date(la.analyzed_at).toLocaleDateString('en-GB') },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {la.risk_category === 'HIGH' && (
              <div style={{ padding: '14px 16px', background: '#FFF0F0', borderRadius: 10, border: '1.5px solid rgba(192,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} color="#C00000" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#C00000', fontSize: '0.875rem', marginBottom: 4 }}>Alert Dispatched</div>
                    <p style={{ fontSize: '0.78rem', color: '#C00000', lineHeight: 1.5 }}>Your doctor has been notified via SMS and email within 5 seconds of this analysis.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'waveform' && (
        <div className="card">
          <div className="card-header">
            <h3>ECG Waveform — Lead II</h3>
            {waveform && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>500 Hz · {waveform.duration_seconds}s recording</span>}
          </div>
          <div style={{ padding: 20 }}>
            {waveform ? (
              <>
                <ECGChart data={waveform.data} rhythmClass={waveform.rhythm_class} rPeaks={waveform.r_peaks} height={220} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12 }}>
                  The green line shows your heart's electrical activity over time. Each "spike" is one heartbeat. Detected rhythm: <strong>{waveform.rhythm_class}</strong>
                </p>
              </>
            ) : <p className="text-muted text-center" style={{ padding: 40 }}>No waveform data available</p>}
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="card">
          <div className="card-header"><h3>Complete ECG Parameters</h3></div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Rhythm Class', value: la.rhythm_class, unit: '' },
                { label: 'AI Confidence', value: la.rhythm_confidence, unit: '%' },
                { label: 'CVD Risk Score', value: `${la.cvd_risk_score}/100`, unit: '' },
                { label: 'Heart Rate', value: la.heart_rate_bpm, unit: 'BPM' },
                { label: 'QT Interval', value: la.qt_interval_ms, unit: 'ms' },
                { label: 'QRS Duration', value: la.qrs_duration_ms, unit: 'ms' },
                { label: 'PR Interval', value: la.pr_interval_ms || '—', unit: 'ms' },
                { label: 'ST Deviation', value: la.st_deviation_mm, unit: 'mm' },
                { label: 'HRV RMSSD', value: la.hrv_rmssd_ms, unit: 'ms' },
                { label: 'P-wave Axis', value: la.p_wave_axis, unit: '°' },
                { label: 'Model Version', value: la.model_version, unit: '' },
                { label: 'Inference Time', value: la.inference_latency_ms, unit: 'ms' },
              ].map(m => (
                <div key={m.label} className="metric-card">
                  <div className="metric-value" style={{ fontSize: '1rem' }}>{m.value} <span className="metric-unit">{m.unit}</span></div>
                  <div className="metric-label" style={{ marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 14, background: '#F8FAFC', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              ⚠️ <strong>Disclaimer:</strong> This AI-generated analysis is a decision-support tool and does not replace the opinion of a qualified physician. Always consult your doctor before making any health decisions based on this report.
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
