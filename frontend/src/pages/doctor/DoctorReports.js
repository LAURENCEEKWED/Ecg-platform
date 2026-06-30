import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Upload, Plus, Filter, Search, Calendar, Eye, Trash2, Edit } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

const REPORT_TYPES = ['All', 'ECG Analysis', 'Patient Summary', 'Monthly Statistics', 'Risk Assessment'];

const sampleReports = [
  { id: 1, title: 'ECG Report - John Smith', patientName: 'John Smith', type: 'ECG Analysis', date: '2024-01-15', status: 'Generated', format: 'PDF' },
  { id: 2, title: 'January 2024 Statistics', patientName: null, type: 'Monthly Statistics', date: '2024-01-31', status: 'Shared', format: 'XLSX' },
  { id: 3, title: 'Risk Assessment - Jane Doe', patientName: 'Jane Doe', type: 'Risk Assessment', date: '2024-01-10', status: 'Generated', format: 'PDF' },
  { id: 4, title: 'Patient Summary - Michael Brown', patientName: 'Michael Brown', type: 'Patient Summary', date: '2024-01-12', status: 'Generated', format: 'DOCX' }
];

export default function DoctorReports() {
  const [reports, setReports] = useState(sampleReports);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [generateForm, setGenerateForm] = useState({ title: '', type: 'ECG Analysis', patientId: '', dateFrom: '', dateTo: '' });
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/doctors/dashboard').then(res => setPatients(res.data.patients || [])).catch(() => {});
  }, []);

  const handleDownload = (report) => {
    toast.success(`Downloading ${report.title}...`);
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${report.title}.${report.format.toLowerCase()}`;
    link.click();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!generateForm.title || !generateForm.type) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newReport = {
      id: reports.length + 1,
      title: generateForm.title,
      type: generateForm.type,
      patientName: generateForm.patientId ? patients.find(p => p.id === parseInt(generateForm.patientId))?.first_name + ' ' + patients.find(p => p.id === parseInt(generateForm.patientId))?.last_name : null,
      date: new Date().toISOString().split('T')[0],
      status: 'Generated',
      format: 'PDF'
    };
    setReports([newReport, ...reports]);
    setShowGenerateModal(false);
    setGenerateForm({ title: '', type: 'ECG Analysis', patientId: '', dateFrom: '', dateTo: '' });
    setLoading(false);
    toast.success('Report generated successfully!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      toast.success(`Uploading ${file.name}...`);
      const newReport = {
        id: reports.length + 1,
        title: file.name.split('.')[0],
        type: 'ECG Analysis',
        patientName: null,
        date: new Date().toISOString().split('T')[0],
        status: 'Uploaded',
        format: file.name.split('.')[1].toUpperCase()
      };
      setReports([newReport, ...reports]);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      setReports(reports.filter(r => r.id !== id));
      toast.success('Report deleted');
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesQuery = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (r.patientName && r.patientName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'All' || r.type === filterType;
    return matchesQuery && matchesType;
  });

  return (
    <AppLayout title="Reports">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 600 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: 44 }}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input"
              style={{ width: 200 }}
            >
              {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Upload size={18} />
              Upload Report
              <input type="file" hidden accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} />
            </label>
            <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Plus size={18} />
              Generate Report
            </button>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Type</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Format</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No reports found
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(report => (
                    <tr key={report.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ background: 'rgba(31,78,121,0.1)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={18} color="var(--primary)" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{report.title}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{report.type}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{report.patientName || '-'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{report.date}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: report.status === 'Generated' ? 'rgba(34,197,94,0.1)' : report.status === 'Shared' ? 'rgba(37,99,235,0.1)' : 'rgba(107,114,128,0.1)',
                          color: report.status === 'Generated' ? '#107c41' : report.status === 'Shared' ? '#2e75b6' : '#6b7280'
                        }}>
                          {report.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{report.format}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => setShowViewModal(report)} title="View">
                            <Eye size={14} />
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleDownload(report)} title="Download">
                            <Download size={14} />
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(report.id)} title="Delete">
                            <Trash2 size={14} />
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

      {showGenerateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowGenerateModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Generate New Report</h3>
            <form onSubmit={handleGenerate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Report Title *</label>
                <input
                  type="text"
                  value={generateForm.title}
                  onChange={(e) => setGenerateForm({ ...generateForm, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Report Type *</label>
                <select
                  value={generateForm.type}
                  onChange={(e) => setGenerateForm({ ...generateForm, type: e.target.value })}
                  className="input"
                  required
                >
                  {REPORT_TYPES.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Patient (Optional)</label>
                <select
                  value={generateForm.patientId}
                  onChange={(e) => setGenerateForm({ ...generateForm, patientId: e.target.value })}
                  className="input"
                >
                  <option value="">All Patients</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Date From</label>
                  <input
                    type="date"
                    value={generateForm.dateFrom}
                    onChange={(e) => setGenerateForm({ ...generateForm, dateFrom: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Date To</label>
                  <input
                    type="date"
                    value={generateForm.dateTo}
                    onChange={(e) => setGenerateForm({ ...generateForm, dateTo: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowViewModal(null)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 700,
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>{showViewModal.title}</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowViewModal(null)}>Close</button>
            </div>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}><strong>Type:</strong> {showViewModal.type}</p>
              {showViewModal.patientName && <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}><strong>Patient:</strong> {showViewModal.patientName}</p>}
              <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}><strong>Date:</strong> {showViewModal.date}</p>
              <p style={{ color: 'var(--text-secondary)' }}><strong>Status:</strong> {showViewModal.status}</p>
            </div>
            <div style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: 20, minHeight: 200 }}>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 50 }}>Report preview would be displayed here...</p>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => handleDownload(showViewModal)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Download size={16} /> Download</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
