import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Activity, Bell, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/doctors/dashboard');
      setPatients(res.data.patients || []);
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = patients.filter(p => {
    const nameMatch = `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
      || p.email?.toLowerCase().includes(search.toLowerCase())
      || p.phone?.includes(search);
    const riskMatch = riskFilter === 'ALL' || p.latest_analysis?.risk_category === riskFilter;
    return nameMatch && riskMatch;
  });

  return (
    <AppLayout title="My Patients">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Patient Management</h1>
          <p className="text-secondary text-sm">{patients.length} patients under your care</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="input-icon-wrapper" style={{ flex: 1, minWidth: 240 }}>
          <Search size={16} className="icon" />
          <input className="input" placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'HIGH', 'MODERATE', 'LOW'].map(r => (
            <button key={r} onClick={() => setRiskFilter(r)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: '0.15s',
                borderColor: riskFilter === r ? (r === 'ALL' ? 'var(--primary)' : r === 'HIGH' ? '#C00000' : r === 'MODERATE' ? '#FF8C00' : '#00875A') : 'var(--border)',
                background: riskFilter === r ? (r === 'ALL' ? 'var(--primary)' : r === 'HIGH' ? '#FFF0F0' : r === 'MODERATE' ? '#FFF8EC' : '#F0FFF4') : 'white',
                color: riskFilter === r ? (r === 'ALL' ? 'white' : r === 'HIGH' ? '#C00000' : r === 'MODERATE' ? '#FF8C00' : '#00875A') : 'var(--text-secondary)'
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div className="loading-spinner"></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(patient => (
            <PatientCard key={patient.id} patient={patient} onClick={() => navigate(`/doctor/patients/${patient.id}`)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
              <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No patients found</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}

function PatientCard({ patient, onClick }) {
  const risk = patient.latest_analysis?.risk_category;
  const score = patient.latest_analysis?.cvd_risk_score;
  const rhythm = patient.latest_analysis?.rhythm_class;
  const dob = patient.dob ? new Date(patient.dob) : null;
  const age = dob ? Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000)) : null;
  const riskColor = { HIGH: '#C00000', MODERATE: '#FF8C00', LOW: '#00875A' }[risk] || 'var(--border)';

  return (
    <div className="patient-card" onClick={onClick} style={{ borderLeft: `4px solid ${riskColor}` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', flexShrink: 0 }}>
            {patient.first_name?.[0]}{patient.last_name?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{patient.first_name} {patient.last_name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {age ? `${age} yrs` : ''} {patient.gender === 'M' ? '♂' : '♀'} · {patient.blood_type || '—'}
            </div>
          </div>
        </div>
        {risk && <span className={`risk-badge ${risk} ${risk === 'HIGH' ? 'pulse' : ''}`}>{risk}</span>}
      </div>

      {/* Latest analysis */}
      {patient.latest_analysis ? (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>LATEST ANALYSIS</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {new Date(patient.latest_analysis.analyzed_at).toLocaleDateString('en-GB')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="rhythm-badge">{rhythm}</span>
            <span style={{ fontSize: '0.78rem', color: riskColor, fontWeight: 700 }}>CVD Score: {score}/100</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${score}%`, background: riskColor, borderRadius: 2, transition: '0.5s' }}></div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          No ECG analysis yet
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          📊 {patient.ecg_count} ECG{patient.ecg_count !== 1 ? 's' : ''}
          {patient.active_alerts > 0 && <span style={{ marginLeft: 8, color: '#C00000', fontWeight: 700 }}>⚠ {patient.active_alerts} alert{patient.active_alerts !== 1 ? 's' : ''}</span>}
        </div>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </div>
  );
}
