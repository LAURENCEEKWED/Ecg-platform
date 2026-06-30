import React, { useEffect, useState, useCallback } from 'react';
import { Heart, Activity, Bell, User, AlertTriangle, FileText, ChevronRight, MessageSquare, Settings, Calendar, Clock, TrendingUp, Stethoscope, ActivitySquare, Watch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useWS } from '../../context/WSContext';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import ECGWaveform from '../../components/ECGWaveform';

Chart.register(...registerables);

const NAV_ITEMS = [
  { section: 'MY HEALTH', items: [
    { path: '/patient', label: 'My Dashboard', icon: Heart },
    { path: '/patient/analysis', label: 'Latest Analysis', icon: Activity },
    { path: '/patient/ecg-history', label: 'ECG History', icon: FileText },
    { path: '/patient/smartwatch', label: 'Smartwatch', icon: Watch },
    { path: '/messages', label: 'Messages', icon: MessageSquare }
  ] },
  { section: 'ACCOUNT', items: [
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/patient/profile', label: 'My Profile', icon: User }
  ] }
];

// Utility for gradient colors
const getGradientByRisk = (riskCategory) => {
  switch (riskCategory) {
    case 'HIGH':
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    case 'MODERATE':
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    case 'LOW':
      return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    default:
      return 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)';
  }
};

const getRiskIconColor = (riskCategory) => {
  switch (riskCategory) {
    case 'HIGH': return '#ef4444';
    case 'MODERATE': return '#f59e0b';
    case 'LOW': return '#22c55e';
    default: return '#2563eb';
  }
};

// Modern Progress Bar Component
const ProgressBar = ({ value, max = 100, color, label }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ marginBottom: 8 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
          <span style={{ color, fontWeight: 700 }}>{value}/{max}</span>
        </div>
      )}
      <div style={{
        height: 8,
        background: 'var(--border-light)',
        borderRadius: 999,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRadius: 999,
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
    </div>
  );
};

// Mini Heart Rate Chart Component
const MiniHeartRateChart = ({ bpm }) => {
  const data = {
    labels: ['', '', '', '', '', '', '', '', '', ''],
    datasets: [{
      data: [65, 59, 80, 81, 56, 55, 40, 70, bpm, 72],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
      fill: true,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } }
  };

  return <Line data={data} options={options} />;
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const { subscribe } = useWS();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/patients/dashboard');
      setData(res.data);
    } catch { toast.error('Failed to load your health data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    const unsub1 = subscribe('NEW_ANALYSIS_RESULT', (event) => {
      toast.info(`📊 New ECG result: ${event.data.message}`, { autoClose: 6000 });
      fetchDashboard();
    });
    const unsub2 = subscribe('ALERT_ACKNOWLEDGED', () => {
      toast.success('✅ Your alert has been acknowledged by your doctor!', { autoClose: 6000 });
      fetchDashboard();
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe, fetchDashboard]);

  if (loading) return (
    <div className="loading-screen"><div className="loading-spinner"></div></div>
  );

  const { latest_analysis: la, risk_trend, doctor, hospital, stats, alerts, pending_high_alerts } = data || {};
  const riskColor = getRiskIconColor(la?.risk_category);

  const trendChart = risk_trend?.length > 0 ? {
    labels: risk_trend.map(r => new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'CVD Risk Score',
      data: risk_trend.map(r => r.cvd_risk_score),
      borderColor: riskColor,
      backgroundColor: `${riskColor}22`,
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: riskColor,
      pointBorderWidth: 2,
      pointHoverRadius: 8,
    }]
  } : null;

  const rhythmDistribution = {
    labels: ['Normal', 'Tachycardia', 'Bradycardia', 'AFib', 'PVC'],
    datasets: [{
      data: [45, 15, 10, 20, 10],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
      borderWidth: 0,
    }]
  };

  const healthMetrics = la ? [
    {
      label: 'Heart Rate',
      value: la.heart_rate_bpm,
      unit: 'BPM',
      min: 60,
      max: 100,
      status: la.heart_rate_bpm >= 60 && la.heart_rate_bpm <= 100 ? 'normal' : 'warning',
      icon: Activity,
      color: la.heart_rate_bpm >= 60 && la.heart_rate_bpm <= 100 ? '#22c55e' : '#f59e0b',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      label: 'QT Interval',
      value: la.qt_interval_ms,
      unit: 'ms',
      min: 340,
      max: 440,
      status: la.qt_interval_ms <= 450 ? 'normal' : 'warning',
      icon: ActivitySquare,
      color: la.qt_interval_ms <= 450 ? '#22c55e' : '#f59e0b',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
    },
    {
      label: 'HRV (RMSSD)',
      value: la.hrv_rmssd_ms,
      unit: 'ms',
      min: 20,
      max: 100,
      status: la.hrv_rmssd_ms >= 20 ? 'normal' : 'warning',
      icon: Heart,
      color: la.hrv_rmssd_ms >= 20 ? '#22c55e' : '#f59e0b',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
    }
  ] : [];

  return (
    <AppLayout navItems={NAV_ITEMS} title="My Health Dashboard">
      {/* Welcome */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 12,
        marginBottom: 28 
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 6, fontWeight: 800 }}>Hello, {user?.first_name} 👋</h1>
          <p className="text-secondary text-sm" style={{ fontSize: '0.9375rem' }}>Here's your cardiac health overview</p>
        </div>
        {la && (
          <div style={{ textAlign: 'left', display: 'flex', gap: 8 }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last Analysis</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {new Date(la.analyzed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HIGH risk banner for patient */}
      {pending_high_alerts?.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          borderRadius: 20,
          padding: '18px 22px',
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 4px 20px rgba(239,68,68,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#dc2626', marginBottom: 4 }}>
                High Cardiovascular Risk Detected
              </div>
              <div style={{ fontSize: '0.875rem', color: '#b91c1c', opacity: 0.9, lineHeight: 1.6 }}>
                Your doctor has been notified. Please follow up with your physician as soon as possible.
              </div>
            </div>
          </div>
          {doctor && (
            <div style={{
              width: '100%',
              fontSize: '0.8rem',
              background: 'white',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid rgba(239,68,68,0.2)'
            }}>
              <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.875rem', marginBottom: 2 }}>{doctor.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{doctor.phone}</div>
            </div>
          )}
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid-responsive-4" style={{ marginBottom: 28 }}>
        {/* CVD Risk Score Card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: getGradientByRisk(la?.risk_category),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px ${riskColor}33`
            }}>
              <Heart size={28} color="white" fill="white" />
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: `${riskColor}15`,
              color: riskColor
            }}>
              {la?.risk_category || '—'}
            </span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: riskColor, marginBottom: 4 }}>
            {la?.cvd_risk_score ?? '—'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 12 }}>
            CVD Risk Score
          </div>
          <ProgressBar value={la?.cvd_risk_score || 0} max={100} color={riskColor} />
        </div>

        {/* Heart Rate Card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59,130,246,0.2)'
            }}>
              <Activity size={28} color="white" />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#2563eb', marginBottom: 4 }}>
            {la?.heart_rate_bpm ?? '—'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 12 }}>
            Heart Rate (BPM)
          </div>
          <div style={{ height: 40 }}>
            <MiniHeartRateChart bpm={la?.heart_rate_bpm || 72} />
          </div>
        </div>

        {/* Total ECGs Card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(34,197,94,0.2)'
            }}>
              <FileText size={28} color="white" />
            </div>
            <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <div>Total</div>
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#16a34a', marginBottom: 4 }}>
            {stats?.total_ecgs ?? 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 12 }}>
            ECG Records
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                width: '20%',
                height: 32,
                borderRadius: 6,
                background: i < Math.min(stats?.total_ecgs || 0, 5) ? '#22c55e20' : 'var(--border-light)'
              }} />
            ))}
          </div>
        </div>

        {/* Alerts Card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 24,
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(245,158,11,0.2)'
            }}>
              <Bell size={28} color="white" />
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: (stats?.pending_alerts || 0) > 0 ? '#ef444415' : '#22c55e15',
              color: (stats?.pending_alerts || 0) > 0 ? '#ef4444' : '#22c55e'
            }}>
              {(stats?.pending_alerts || 0) > 0 ? 'Active' : 'All Clear'}
            </span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#d97706', marginBottom: 4 }}>
            {stats?.pending_alerts ?? 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Active Alerts
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid-responsive-2col">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Health Metrics Cards */}
          {la && (
            <div className="grid-responsive-3">
              {healthMetrics.map((metric, i) => (
                <div key={i} style={{
                  background: 'white',
                  borderRadius: 20,
                  padding: 20,
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: metric.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <metric.icon size={20} color="white" />
                    </div>
                    <span style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: metric.color,
                      boxShadow: `0 0 0 4px ${metric.color}22`
                    }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: metric.color }}>{metric.value}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>{metric.unit}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 12 }}>
                    {metric.label}
                  </div>
                  <ProgressBar value={metric.value} max={metric.max} min={metric.min} color={metric.color} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    Normal range: {metric.min} - {metric.max} {metric.unit}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Risk Trend Chart */}
          {trendChart && (
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>CVD Risk Trend</h3>
                <button onClick={() => navigate('/patient/ecg-history')} style={{
                  fontSize: '0.8125rem',
                  color: '#2563eb',
                  fontWeight: 600,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  View History <ChevronRight size={14} />
                </button>
              </div>
              <div style={{ height: 240 }}>
                <Line data={trendChart} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1e293b',
                      padding: 14,
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 },
                      borderRadius: 10
                    }
                  },
                  scales: {
                    y: {
                      min: 0,
                      max: 100,
                      grid: { color: 'rgba(0,0,0,0.04)' },
                      ticks: {
                        callback: v => `${v}`,
                        font: { weight: 500 }
                      }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { font: { weight: 500 } }
                    }
                  }
                }} />
              </div>
            </div>
          )}

          {/* Latest Analysis */}
          {la ? (
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Latest ECG Analysis</h3>
                <button onClick={() => navigate('/patient/analysis')} style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  Full Report <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  background: `${riskColor}15`,
                  color: riskColor
                }}>
                  {la.risk_category} RISK
                </span>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)'
                }}>
                  {la.rhythm_class}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-muted)',
                  fontSize: '0.8125rem',
                  fontWeight: 600
                }}>
                  <Clock size={14} /> Confidence: {la.rhythm_confidence}%
                </span>
              </div>

              {/* ECG Waveform */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 12 }}>Live ECG Preview</h4>
                <ECGWaveform rhythmType={la?.rhythm_class || 'NORMAL'} height={180} animate={true} />
              </div>

              {/* Recommendations */}
              {la.recommendations?.[0] && (
                <div style={{
                  padding: '16px 18px',
                  background: la.risk_category === 'HIGH' ? '#fef2f2' : '#f0fdf4',
                  borderRadius: 14,
                  display: 'flex',
                  gap: 12,
                  border: `1px solid ${la.risk_category === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
                }}>
                  <span style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: la.risk_category === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.125rem'
                  }}>
                    {la.risk_category === 'HIGH' ? '⚠️' : '✅'}
                  </span>
                  <span style={{
                    color: la.risk_category === 'HIGH' ? '#dc2626' : '#16a34a',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    lineHeight: 1.6
                  }}>
                    {la.recommendations[0]}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: 60,
              textAlign: 'center',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
            }}>
              <Stethoscope size={56} style={{ margin: '0 auto 16px', opacity: 0.25 }} />
              <h3 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>No ECG Analysis Yet</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
                Visit your hospital for an ECG recording to start tracking your cardiac health.
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Rhythm Distribution */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 24,
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 20 }}>Rhythm Distribution</h3>
            <div style={{ height: 200 }}>
              <Doughnut data={rhythmDistribution} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 12,
                      font: { size: 11, weight: 500 }
                    }
                  }
                }
              }} />
            </div>
          </div>

          {/* Doctor Info */}
          {doctor && (
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 20 }}>Your Doctor</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '1.375rem',
                  flexShrink: 0,
                  boxShadow: '0 6px 20px rgba(59,130,246,0.25)'
                }}>
                  {doctor.name?.split(' ').slice(-2).map(n => n[0]).join('')}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{doctor.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{doctor.specialization}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--bg-primary)',
                  borderRadius: 12,
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>📞</span> {doctor.phone}
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--bg-primary)',
                  borderRadius: 12,
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>✉️</span> {doctor.email}
                </div>
              </div>
            </div>
          )}

          {/* Hospital Info */}
          {hospital && (
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 16 }}>Hospital</h3>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4, color: 'var(--text-primary)' }}>
                {hospital.name}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                {hospital.city}, {hospital.country}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'rgba(34,197,94,0.08)',
                borderRadius: 12,
                border: '1px solid rgba(34,197,94,0.2)'
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 0 4px rgba(34,197,94,0.2)'
                }} />
                <span style={{
                  fontSize: '0.8125rem',
                  color: '#16a34a',
                  fontWeight: 700
                }}>
                  ECG System Online
                </span>
              </div>
            </div>
          )}

          {/* Recent Alerts */}
          {alerts?.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 16 }}>Recent Alerts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {alerts.slice(0, 3).map((alert, i) => (
                  <div key={alert.id} style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{
                          fontWeight: 800,
                          fontSize: '0.9375rem',
                          color: alert.risk_level === 'HIGH' ? '#ef4444' : '#f59e0b',
                          marginBottom: 2
                        }}>
                          {alert.risk_level} RISK — {alert.rhythm_class}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          CVD Score: {alert.cvd_risk_score}/100
                        </div>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Calendar size={12} />
                        {new Date(alert.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
