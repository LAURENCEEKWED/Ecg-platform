import React, { useState, useEffect, useCallback } from 'react';
import { Watch, Smartphone, Plus, CheckCircle, XCircle, Activity, AlertTriangle, RefreshCw, Battery, Clock, MoreHorizontal, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

const NAV_ITEMS = [
  { section: 'MY HEALTH', items: [
    { path: '/patient', label: 'My Dashboard', icon: Activity },
    { path: '/patient/analysis', label: 'Latest Analysis', icon: Activity },
    { path: '/patient/ecg-history', label: 'ECG History', icon: Activity },
    { path: '/patient/smartwatch', label: 'Smartwatch', icon: Watch },
    { path: '/messages', label: 'Messages', icon: Activity }
  ] },
  { section: 'ACCOUNT', items: [
    { path: '/settings', label: 'Settings', icon: Activity },
    { path: '/patient/profile', label: 'My Profile', icon: Activity }
  ] }
];

export default function PatientSmartwatch() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_name: '',
    device_type: 'APPLE',
    device_model: ''
  });

  const fetchDevices = useCallback(async () => {
    try {
      const res = await api.get('/smartwatch/devices');
      setDevices(res.data.devices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/smartwatch/devices', newDevice);
      toast.success('Smartwatch linked successfully!');
      setShowAddDevice(false);
      setNewDevice({ device_name: '', device_type: 'APPLE', device_model: '' });
      fetchDevices();
    } catch (err) {
      toast.error('Failed to link smartwatch');
    }
  };

  const handleUnlinkDevice = async (deviceId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to unlink this smartwatch?')) return;
    try {
      await api.delete(`/smartwatch/devices/${deviceId}`);
      toast.success('Smartwatch unlinked');
      fetchDevices();
    } catch (err) {
      toast.error('Failed to unlink smartwatch');
    }
  };

  const getDeviceIconEmoji = (type) => {
    switch(type) {
      case 'APPLE':
      case 'WATCHOS':
        return '🍎';
      case 'ANDROID':
      case 'WEAROS':
        return '🤖';
      default:
        return '⌚';
    }
  };

  const getBatteryStatusColor = (level) => {
    if (level > 60) return '#00875A';
    if (level > 20) return '#FF8C00';
    return '#C00000';
  };

  const linkedDevices = devices.filter(d => d.status === 'LINKED');

  return (
    <AppLayout navItems={NAV_ITEMS} title="Smartwatch Integration">
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Smartwatch Management</h1>
          <p className="text-secondary text-sm">Link and manage your smartwatch devices for real‑time ECG monitoring</p>
        </div>
        <button 
          onClick={() => setShowAddDevice(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} />
          Link Smartwatch
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {/* Device Grid */}
          {linkedDevices.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
              <Watch size={56} style={{ marginBottom: 16, opacity: 0.25, color: 'var(--text-muted)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>No Smartwatches Linked</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                Link your smartwatch to start sending real‑time ECG data directly to your healthcare provider
              </p>
              <button 
                onClick={() => setShowAddDevice(true)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Plus size={18} />
                Link New Smartwatch
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {linkedDevices.map(device => (
                <div key={device.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                    <div style={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: 16, 
                      background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '2rem'
                    }}>
                      {getDeviceIconEmoji(device.device_type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{device.device_name}</h3>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 4, 
                          background: '#DCFCE7', 
                          color: '#00875A', 
                          padding: '2px 8px', 
                          borderRadius: 999,
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          <CheckCircle size={12} />
                          ACTIVE
                        </div>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{device.device_model || 'Unknown Device'}</p>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: 12, 
                    paddingTop: 16, 
                    borderTop: '1px solid var(--border-light)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 10, 
                        background: 'var(--bg-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Battery size={16} color={getBatteryStatusColor(device.battery_level)} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Battery</div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: getBatteryStatusColor(device.battery_level) }}>
                          {device.battery_level}%
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 10, 
                        background: 'var(--bg-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Clock size={16} color="var(--text-secondary)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last Sync</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {new Date(device.last_sync).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginTop: 16, 
                    paddingTop: 16, 
                    borderTop: '1px solid var(--border-light)'
                  }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => toast.info('Syncing in progress...')}
                    >
                      <RefreshCw size={14} /> Sync Now
                    </button>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleUnlinkDevice(device.id)}
                    >
                      <Trash2 size={14} /> Unlink
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Setup Guide Card */}
          <div className="card" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 14, 
                background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Smartphone size={24} color="#1e40af" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>
                  How to Set Up Your Smartwatch
                </h3>
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: 20, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 8 
                }}>
                  <li style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Step 1:</span> Download the ECG companion app on your smartphone
                  </li>
                  <li style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Step 2:</span> Pair your smartwatch with the companion app
                  </li>
                  <li style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Step 3:</span> Use the "Link Smartwatch" button above to connect it to your account
                  </li>
                  <li style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Step 4:</span> Start recording ECGs directly from your wrist!
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Device Modal */}
      {showAddDevice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ 
            width: '100%', 
            maxWidth: 460, 
            margin: 16, 
            padding: 24,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Link New Smartwatch</h2>
              <button 
                onClick={() => setShowAddDevice(false)}
                style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 10, 
                  border: 'none', 
                  background: 'transparent', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDevice} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  marginBottom: 6 
                }}>
                  Device Name
                </label>
                <input
                  type="text"
                  value={newDevice.device_name}
                  onChange={(e) => setNewDevice({...newDevice, device_name: e.target.value})}
                  className="input"
                  placeholder="e.g., My Apple Watch"
                  required
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  marginBottom: 6 
                }}>
                  Device Type
                </label>
                <select
                  value={newDevice.device_type}
                  onChange={(e) => setNewDevice({...newDevice, device_type: e.target.value})}
                  className="input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="APPLE">Apple Watch</option>
                  <option value="WATCHOS">WatchOS</option>
                  <option value="ANDROID">Android Watch</option>
                  <option value="WEAROS">Wear OS</option>
                  <option value="GENERIC">Generic Smartwatch</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  marginBottom: 6 
                }}>
                  Model (Optional)
                </label>
                <input
                  type="text"
                  value={newDevice.device_model}
                  onChange={(e) => setNewDevice({...newDevice, device_model: e.target.value})}
                  className="input"
                  placeholder="e.g., Apple Watch Series 8"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddDevice(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Link Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
