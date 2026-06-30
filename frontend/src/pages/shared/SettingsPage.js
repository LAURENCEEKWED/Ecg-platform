import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Mail, Smartphone, User, Globe, Lock, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';

export default function SettingsPage() {
  const { user, darkMode, setDarkMode, language, setLanguage, t } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navItems = user?.role === 'DOCTOR' ? [
    {
      section: 'Navigation',
      items: [
        { icon: Activity, label: t('dashboard'), path: '/doctor' },
        { icon: User, label: t('patients'), path: '/doctor/patients' },
        { icon: Bell, label: t('messages'), path: '/messages' },
        { icon: Activity, label: t('alerts'), path: '/doctor/alerts' },
        { icon: User, label: 'Simulator', path: '/doctor/simulator' },
        { icon: User, label: 'Profile', path: '/doctor/profile' },
      ]
    }
  ] : user?.role === 'ADMIN' ? [
    {
      section: 'Navigation',
      items: [
        { icon: Activity, label: t('dashboard'), path: '/doctor' },
        { icon: User, label: t('patients'), path: '/doctor/patients' },
        { icon: Bell, label: t('messages'), path: '/messages' },
        { icon: Activity, label: t('alerts'), path: '/doctor/alerts' },
      ]
    }
  ] : [
    {
      section: 'Navigation',
      items: [
        { icon: Activity, label: t('dashboard'), path: '/patient' },
        { icon: User, label: 'ECG History', path: '/patient/ecg-history' },
        { icon: Bell, label: t('messages'), path: '/messages' },
        { icon: User, label: 'Analysis', path: '/patient/analysis' },
        { icon: User, label: 'Profile', path: '/patient/profile' },
      ]
    }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings');
      const loadedSettings = res.data.settings;
      setSettings(loadedSettings);
      if (loadedSettings.dark_mode !== undefined) setDarkMode(loadedSettings.dark_mode);
      if (loadedSettings.language) setLanguage(loadedSettings.language);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { 
        ...settings, 
        dark_mode: darkMode, 
        language 
      });
      alert(t('settingsSaved'));
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AppLayout navItems={navItems} title={t('settings')}>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout navItems={navItems} title={t('settings')}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <User size={20} />
              <h3>{t('appearance')}</h3>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{t('darkMode')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enable dark theme for the application</div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  background: darkMode ? 'var(--primary)' : 'var(--border)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 2,
                  left: darkMode ? 26 : 2,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'left 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {darkMode ? <Moon size={14} color="var(--primary)" /> : <Sun size={14} color="var(--text-muted)" />}
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{t('language')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select your preferred language</div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
                style={{ width: 200 }}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="sw">Swahili</option>
                <option value="ar">العربية</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
                <option value="it">Italiano</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bell size={20} />
              <h3>{t('notifications')}</h3>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Mail size={18} />
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{t('emailNotifications')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive notifications via email</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('email_notifications', !settings?.email_notifications)}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  background: settings?.email_notifications ? 'var(--primary)' : 'var(--border)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 2,
                  left: settings?.email_notifications ? 26 : 2,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Smartphone size={18} />
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{t('smsNotifications')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive notifications via SMS</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting('sms_notifications', !settings?.sms_notifications)}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  background: settings?.sms_notifications ? 'var(--primary)' : 'var(--border)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 2,
                  left: settings?.sms_notifications ? 26 : 2,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          </div>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Activity size={20} />
                <h3>{t('riskThresholds')}</h3>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{t('highRiskThreshold')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score above this triggers critical alert</div>
                </div>
                <input
                  type="number"
                  value={settings?.high_risk_threshold || 67}
                  onChange={(e) => updateSetting('high_risk_threshold', parseInt(e.target.value))}
                  className="input"
                  style={{ width: 100 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{t('moderateRiskThreshold')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score above this triggers warning</div>
                </div>
                <input
                  type="number"
                  value={settings?.moderate_risk_threshold || 34}
                  onChange={(e) => updateSetting('moderate_risk_threshold', parseInt(e.target.value))}
                  className="input"
                  style={{ width: 100 }}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={saveSettings} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : t('saveSettings')}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}