import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Search, Edit, Trash2, Eye, Activity, RefreshCw, Wifi, WifiOff, Settings, Save, Bell } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { toast } from 'react-toastify';

const sampleDevices = [
  { id: 1, name: 'ECG Machine A', type: 'ECG Machine', location: 'ER Room 1', status: 'Online', serialNumber: 'ECG-2024-001', lastSeen: new Date().toISOString(), battery: 95 },
  { id: 2, name: 'ECG Machine B', type: 'ECG Machine', location: 'Cardiology Ward', status: 'Online', serialNumber: 'ECG-2024-002', lastSeen: new Date().toISOString(), battery: 80 },
  { id: 3, name: 'Portable Monitor C', type: 'Portable Monitor', location: 'ICU', status: 'Low Battery', serialNumber: 'PM-2024-003', lastSeen: new Date(Date.now() - 2*60*60*1000).toISOString(), battery: 15 },
  { id: 4, name: 'ECG Machine D', type: 'ECG Machine', location: 'Storage', status: 'Offline', serialNumber: 'ECG-2024-004', lastSeen: new Date(Date.now() - 24*60*60*1000).toISOString(), battery: 0 }
];

export default function DoctorDevices() {
  const [devices, setDevices] = useState(sampleDevices);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', type: 'ECG Machine', location: '', serialNumber: '' });
  const [loading, setLoading] = useState(false);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.type || !addForm.location || !addForm.serialNumber) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newDevice = {
      id: devices.length + 1,
      ...addForm,
      status: 'Online',
      lastSeen: new Date().toISOString(),
      battery: 100
    };
    setDevices([newDevice, ...devices]);
    setShowAddModal(false);
    setAddForm({ name: '', type: 'ECG Machine', location: '', serialNumber: '' });
    setLoading(false);
    toast.success('Device added successfully!');
  };

  const handleRefreshDevices = async () => {
    toast.info('Refreshing devices...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Update last seen times for online devices
    setDevices(devices.map(d => {
      if (d.status === 'Online' || d.status === 'Low Battery') {
        return { ...d, lastSeen: new Date().toISOString() };
      }
      return d;
    }));
    toast.success('Devices refreshed!');
  };

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      setDevices(devices.filter(d => d.id !== deviceId));
      toast.success('Device deleted');
    }
  };

  const filteredDevices = devices.filter(d => {
    const matchesQuery = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || d.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Online': return { bg: 'rgba(16,124,65,0.1)', color: '#107c41', icon: Wifi };
      case 'Low Battery': return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: Bell };
      case 'Offline': return { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', icon: WifiOff };
      default: return { bg: 'var(--border-light)', color: 'var(--text-muted)', icon: WifiOff };
    }
  };

  return (
    <AppLayout title="Devices">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 500 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search devices..."
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
              <option value="All">All Statuses</option>
              <option value="Online">Online</option>
              <option value="Low Battery">Low Battery</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={handleRefreshDevices} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <RefreshCw size={18} />
              Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Plus size={18} />
              Add Device
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 4 }}>Online</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#107c41' }}>{devices.filter(d => d.status === 'Online').length}</div>
              </div>
              <div style={{ background: 'rgba(16,124,65,0.1)', padding: 12, borderRadius: 12 }}><Wifi size={24} color="#107c41" /></div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 4 }}>Low Battery</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{devices.filter(d => d.status === 'Low Battery').length}</div>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', padding: 12, borderRadius: 12 }}><Bell size={24} color="#f59e0b" /></div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 4 }}>Offline</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6b7280' }}>{devices.filter(d => d.status === 'Offline').length}</div>
              </div>
              <div style={{ background: 'rgba(107,114,128,0.1)', padding: 12, borderRadius: 12 }}><WifiOff size={24} color="#6b7280" /></div>
            </div>
          </div>
        </div>

        {/* Device Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredDevices.map(device => {
            const statusStyle = getStatusColor(device.status);
            const StatusIcon = statusStyle.icon;
            return (
              <div key={device.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', padding: 12, borderRadius: 12 }}>
                      <Monitor size={24} color="white" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{device.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{device.type}</div>
                    </div>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: statusStyle.bg, color: statusStyle.color }}>
                    <StatusIcon size={12} />
                    {device.status}
                  </span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Location</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{device.location}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Serial Number</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{device.serialNumber}</div>
                </div>
                {device.battery !== undefined && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Battery</span>
                      <span style={{ color: device.battery > 30 ? '#107c41' : device.battery > 10 ? '#f59e0b' : '#ef4444' }}>{device.battery}%</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'var(--border-light)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${device.battery}%`, 
                        height: '100%', 
                        background: device.battery > 30 ? '#107c41' : device.battery > 10 ? '#f59e0b' : '#ef4444',
                        borderRadius: 999,
                        transition: '0.3s'
                      }} />
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Last Seen</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{new Date(device.lastSeen).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowViewModal(device)} title="View Details" style={{ flex: 1 }}>
                    <Eye size={14} /> View
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowSettingsModal(device)} title="Settings" style={{ flex: 1 }}>
                    <Settings size={14} /> Settings
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteDevice(device.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowAddModal(false)}>
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
            <h3 style={{ marginBottom: 20 }}>Add New Device</h3>
            <form onSubmit={handleAddDevice}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Device Name *</label>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="input" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Device Type *</label>
                <select value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value })} className="input" required>
                  <option value="ECG Machine">ECG Machine</option>
                  <option value="Portable Monitor">Portable Monitor</option>
                  <option value="Holter Monitor">Holter Monitor</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Location *</label>
                <input type="text" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} className="input" required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Serial Number *</label>
                <input type="text" value={addForm.serialNumber} onChange={(e) => setAddForm({ ...addForm, serialNumber: e.target.value })} className="input" required />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Device'}</button>
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
            maxWidth: 600,
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', padding: 16, borderRadius: 12 }}>
                  <Monitor size={32} color="white" />
                </div>
                <div>
                  <h3>{showViewModal.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{showViewModal.type}</p>
                </div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowViewModal(null)}>Close</button>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Status</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, ...getStatusColor(showViewModal.status) }}>
                  {(() => { const S = getStatusColor(showViewModal.status).icon; return <S size={12} />; })()}
                  {showViewModal.status}
                </span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Location</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{showViewModal.location}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Serial Number</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{showViewModal.serialNumber}</div>
              </div>
              {showViewModal.battery !== undefined && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Battery</span>
                    <span style={{ color: showViewModal.battery > 30 ? '#107c41' : showViewModal.battery > 10 ? '#f59e0b' : '#ef4444' }}>{showViewModal.battery}%</span>
                  </div>
                  <div style={{ width: '100%', height: 10, background: 'var(--border-light)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${showViewModal.battery}%`, 
                      height: '100%', 
                      background: showViewModal.battery > 30 ? '#107c41' : showViewModal.battery > 10 ? '#f59e0b' : '#ef4444',
                      borderRadius: 999,
                      transition: '0.3s'
                    }} />
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Last Seen</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{new Date(showViewModal.lastSeen).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => { setShowViewModal(null); setShowSettingsModal(showViewModal); }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Settings size={16} /> Device Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowSettingsModal(null)}>
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
            <h3 style={{ marginBottom: 20 }}>Device Settings</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              await new Promise(resolve => setTimeout(resolve, 1000));
              setDevices(devices.map(d => d.id === showSettingsModal.id ? showSettingsModal : d));
              setShowSettingsModal(null);
              setLoading(false);
              toast.success('Device updated!');
            }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Device Name</label>
                <input type="text" value={showSettingsModal.name} onChange={(e) => setShowSettingsModal({ ...showSettingsModal, name: e.target.value })} className="input" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Location</label>
                <input type="text" value={showSettingsModal.location} onChange={(e) => setShowSettingsModal({ ...showSettingsModal, location: e.target.value })} className="input" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Status</label>
                <select value={showSettingsModal.status} onChange={(e) => setShowSettingsModal({ ...showSettingsModal, status: e.target.value })} className="input">
                  <option value="Online">Online</option>
                  <option value="Low Battery">Low Battery</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettingsModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
