import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Search, Filter, ChevronRight, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function DoctorAIAnalysis() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      // Mock data
      setAnalyses([
        {
          id: 1,
          patientName: 'Jane Doe',
          patientId: 'P002',
          date: '2024-01-15 10:15',
          rhythm: 'Atrial Fibrillation',
          confidence: 94,
          riskScore: 82,
          riskCategory: 'High',
          findings: ['Irregular rhythm', 'Elevated ST segment']
        },
        {
          id: 2,
          patientName: 'John Smith',
          patientId: 'P001',
          date: '2024-01-15 09:30',
          rhythm: 'Normal Sinus Rhythm',
          confidence: 98,
          riskScore: 15,
          riskCategory: 'Low',
          findings: ['Normal rhythm']
        },
        {
          id: 3,
          patientName: 'Alice Brown',
          patientId: 'P004',
          date: '2024-01-14 16:20',
          rhythm: 'Tachycardia',
          confidence: 91,
          riskScore: 58,
          riskCategory: 'Moderate',
          findings: ['Elevated heart rate']
        }
      ]);
    } catch (error) {
      toast.error('Failed to load AI analyses');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter(a => {
    const matchesQuery = a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       a.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       a.rhythm.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = !filterRisk || a.riskCategory === filterRisk;
    return matchesQuery && matchesRisk;
  });

  const getRiskBadge = (risk) => {
    const colors = {
      'Low': { bg: '#107c4120', color: '#107c41' },
      'Moderate': { bg: '#f59e0b20', color: '#f59e0b' },
      'High': { bg: '#ef444420', color: '#ef4444' }
    };
    const c = colors[risk] || colors['Low'];
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 600,
        background: c.bg,
        color: c.color
      }}>
        {risk}
      </span>
    );
  };

  const stats = {
    total: analyses.length,
    highRisk: analyses.filter(a => a.riskCategory === 'High').length,
    moderateRisk: analyses.filter(a => a.riskCategory === 'Moderate').length,
    avgConfidence: analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + a.confidence, 0) / analyses.length) : 0
  };

  if (loading) return (
    <div className="loading-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <AppLayout title="AI Analysis">
      <div style={{ marginBottom: 24 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(31,78,121,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Analyses</div>
            </div>
          </div>
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(239,68,68,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{stats.highRisk}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>High Risk</div>
            </div>
          </div>
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(245,158,11,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{stats.moderateRisk}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Moderate Risk</div>
            </div>
          </div>
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(139,92,246,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={18} color="#8b5cf6" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{stats.avgConfidence}%</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Avg Confidence</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 500 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search AI analyses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: 44 }}
              />
            </div>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="input"
              style={{ width: 160 }}
            >
              <option value="">All Risks</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Rhythm</th>
                  <th>Confidence</th>
                  <th>Risk</th>
                  <th>Findings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnalyses.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No AI analyses found
                    </td>
                  </tr>
                ) : (
                  filteredAnalyses.map(analysis => (
                    <tr key={analysis.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.875rem'
                          }}>
                            {analysis.patientName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              {analysis.patientName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {analysis.patientId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{analysis.date}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{analysis.rhythm}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 80,
                            height: 8,
                            background: 'var(--border-light)',
                            borderRadius: 999,
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${analysis.confidence}%`,
                              height: '100%',
                              background: analysis.confidence > 90 ? '#22c55e' : analysis.confidence > 70 ? '#f59e0b' : '#ef4444',
                              borderRadius: 999
                            }} />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {analysis.confidence}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {getRiskBadge(analysis.riskCategory)}
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Score: {analysis.riskScore}/100
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {analysis.findings.map((f, idx) => (
                            <span key={idx} style={{
                              fontSize: '0.7rem',
                              background: 'var(--border-light)',
                              color: 'var(--text-secondary)',
                              padding: '3px 8px',
                              borderRadius: 4
                            }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/doctor/ai-analysis/${analysis.id}`)}
                        >
                          View
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
