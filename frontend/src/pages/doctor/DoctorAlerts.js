import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, AlertTriangle } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useWS } from '../../context/WSContext';

export default function DoctorAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const { subscribe } = useWS();
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data.alerts || []);
    } catch { toast.error('Failed to load alerts'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => {
    const unsub = subscribe('HIGH_RISK_ALERT', () => fetchAlerts());
    return unsub;
  }, [subscribe, fetchAlerts]);

  const acknowledge = async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/acknowledge`);
      toast.success('Alert acknowledged');
      fetchAlerts();
    } catch { toast.error('Failed to acknowledge alert'); }
  };

  const filtered = alerts.filter(a => {
    if (filter === 'PENDING') return a.resolution_status === 'PENDING';
    if (filter === 'RESOLVED') return a.resolution_status === 'RESOLVED';
    return true;
  });

  const pending = alerts.filter(a => a.resolution_status === 'PENDING').length;

  return (
    <AppLayout title="Clinical Alerts">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 4, color: 'var(--text-primary)' }}>Alert Center</h1>
          <p className="text-secondary text-sm">{alerts.length} total alerts · {pending} pending</p>
        </div>
        {pending > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--risk-high-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
            <AlertTriangle size={16} color="var(--risk-high)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--risk-high)' }}>{pending} alert{pending !== 1 ? 's' : ''} require attention</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {[['ALL', 'All Alerts'], ['PENDING', `Pending (${pending})`], ['RESOLVED', 'Resolved']].map(([f, label]) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
            color: filter === f ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: `2px solid ${filter === f ? 'var(--primary)' : 'transparent'}`,
            marginBottom: -2, transition: '0.15s'
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div className="loading-spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
          <Bell size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No {filter.toLowerCase() !== 'all' ? filter.toLowerCase() : ''} alerts</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(alert => (
            <AlertCard key={alert.id} alert={alert} onAck={() => acknowledge(alert.id)} onView={() => navigate(`/doctor/patients/${alert.patient_id}`)} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function AlertCard({ alert, onAck, onView }) {
  const isPending = alert.resolution_status === 'PENDING';
  const isHigh = alert.risk_level === 'HIGH';

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 12,
      border: `1.5px solid ${isPending && isHigh ? 'var(--risk-high)33' : 'var(--border)'}`,
      borderLeft: `4px solid ${isHigh ? 'var(--risk-high)' : 'var(--risk-moderate)'}`,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      opacity: isPending ? 1 : 0.7,
      transition: '0.15s'
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: isHigh ? 'var(--risk-high-bg)' : 'var(--risk-moderate-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <AlertTriangle size={20} color={isHigh ? 'var(--risk-high)' : 'var(--risk-moderate)'} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{alert.patient_name}</span>
          <span className={`risk-badge ${alert.risk_level}`}>{alert.risk_level} RISK</span>
          <span className="rhythm-badge">{alert.rhythm_class}</span>
          {isPending && isHigh && <span style={{ background: 'var(--risk-high)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>ACTION REQUIRED</span>}
          {!isPending && <span style={{ background: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)' }}>✓ RESOLVED</span>}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
          CVD Risk Score: <strong style={{ color: isHigh ? 'var(--risk-high)' : 'var(--risk-moderate)' }}>{alert.cvd_risk_score}/100</strong>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>📅 {new Date(alert.created_at).toLocaleString('en-GB')}</span>
          <span>📱 SMS: {alert.sms_status}</span>
          <span>📧 Email: {alert.email_status}</span>
          {alert.sms_delivered_at && <span>⚡ Delivered {Math.round((new Date(alert.sms_delivered_at) - new Date(alert.created_at)) / 1000)}s after detection</span>}
          {alert.resolved_at && <span>✓ Resolved: {new Date(alert.resolved_at).toLocaleString('en-GB')}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={onView} className="btn btn-secondary btn-sm">View Patient</button>
        {isPending && (
          <button onClick={onAck} className="btn btn-success btn-sm">
            <Check size={14} /> Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}
