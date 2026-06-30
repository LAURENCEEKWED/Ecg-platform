import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, Filter, Calendar, ChevronRight, Download } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function DoctorECGRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      // Mock data
      setRecords([
        {
          id: 1,
          patientName: 'John Smith',
          patientId: 'P001',
          date: '2024-01-15 09:30',
          type: '12-Lead',
          status: 'Analyzed',
          rhythm: 'Normal Sinus Rhythm',
          risk: 'Low'
        },
        {
          id: 2,
          patientName: 'Jane Doe',
          patientId: 'P002',
          date: '2024-01-15 10:15',
          type: '12-Lead',
          status: 'Analyzed',
          rhythm: 'Atrial Fibrillation',
          risk: 'High'
        },
        {
          id: 3,
          patientName: 'Bob Johnson',
          patientId: 'P003',
          date: '2024-01-14 14:45',
          type: 'Portable',
          status: 'Pending',
          rhythm: '-',
          risk: '-'
        }
      ]);
    } catch (error) {
      toast.error('Failed to load ECG records');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesQuery = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       r.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || r.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  const getRiskBadge = (risk) => {
    if (!risk || risk === '-') return null;
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

  if (loading) return (
    <div className="loading-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <AppLayout title="ECG Records">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 500 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search ECG records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: 44 }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
              style={{ width: 160 }}
            >
              <option value="">All Status</option>
              <option value="Analyzed">Analyzed</option>
              <option value="Pending">Pending</option>
              <option value="Error">Error</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Rhythm</th>
                  <th>Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No ECG records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(record => (
                    <tr key={record.id}>
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
                            {record.patientName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              {record.patientName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {record.patientId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{record.date}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{record.type}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: record.status === 'Analyzed' ? '#107c4120' : record.status === 'Pending' ? '#f59e0b20' : '#ef444420',
                          color: record.status === 'Analyzed' ? '#107c41' : record.status === 'Pending' ? '#f59e0b' : '#ef4444'
                        }}>
                          {record.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{record.rhythm}</td>
                      <td>{getRiskBadge(record.risk)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => navigate(`/doctor/ecg-records/${record.id}`)}
                          >
                            View
                            <ChevronRight size={14} />
                          </button>
                        </div>
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
