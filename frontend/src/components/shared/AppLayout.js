import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, LogOut, Wifi, WifiOff, Bell, Sun, Moon, 
  Maximize2, Search, Menu,
  Home, Users, Activity, FileText, Settings, HelpCircle, Monitor, Brain, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWS } from '../../context/WSContext';

export default function AppLayout({ children, navItems, title }) {
  const { user, logout, darkMode, setDarkMode } = useAuth();
  const { connected } = useWS();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  // Update isMobile on window resize
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user ? `${user.first_name?.[0]}${user.last_name?.[0]}`.toUpperCase() : 'U';
  const avatarColor = user?.role === 'DOCTOR' ? '#2563eb' : '#22c55e';

  const defaultNavItems = [
    {
      section: 'Overview',
      items: [
        { icon: Home, label: 'Dashboard', path: '/doctor', exact: true }
      ]
    },
    {
      section: 'Clinical',
      items: [
        { icon: Users, label: 'Patients', path: '/doctor/patients' },
        { icon: MessageSquare, label: 'Messages', path: '/messages' },
        { icon: Activity, label: 'ECG Records', path: '/doctor/ecg-records' },
        { icon: Brain, label: 'AI Analysis', path: '/doctor/ai-analysis' },
        { icon: Bell, label: 'Alerts', path: '/doctor/alerts', badge: 3 }
      ]
    },
    {
      section: 'Management',
      items: [
        { icon: FileText, label: 'Reports', path: '/doctor/reports' },
        { icon: Monitor, label: 'Devices', path: '/doctor/devices' },
        { icon: Users, label: 'Users', path: '/doctor/users' }
      ]
    },
    {
      section: 'Account',
      items: [
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: HelpCircle, label: 'Help & Support', path: '/doctor/help-support' },
        { icon: LogOut, label: 'Logout', action: handleLogout }
      ]
    }
  ];

  const itemsToRender = navItems || defaultNavItems;

  // Handle search
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // For now, navigate to patients page and show search results
      navigate('/doctor/patients');
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className={`sidebar-overlay ${sidebarMobileOpen ? 'visible' : ''}`}
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`sidebar ${isMobile && sidebarMobileOpen ? 'open' : ''}`}
        style={{ 
          width: isMobile ? '100%' : (sidebarExpanded ? 260 : 80), 
          minWidth: isMobile ? '100%' : (sidebarExpanded ? 260 : 80) 
        }}
      >
        <div className="sidebar-logo" style={{ justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}>
              <Heart size={20} color="white" />
            </div>
            {(isMobile || sidebarExpanded) && (
              <>
                <h1 style={{ fontSize: '1rem', color: 'white', fontWeight: 800 }}>ECG AI</h1>
                <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Platform</p>
              </>
            )}
          </div>
          
          {isMobile && (
            <button 
              onClick={() => setSidebarMobileOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
            >
              <Menu size={24} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {itemsToRender.map((section, sIdx) => (
            <React.Fragment key={sIdx}>
              {(isMobile || sidebarExpanded) && section.section && (
                <div className="nav-section-title">{section.section}</div>
              )}
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = item.path && (item.exact 
                  ? location.pathname === item.path 
                  : location.pathname.startsWith(item.path));
                const handleClick = () => {
                  if (item.action) {
                    item.action();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                  if (isMobile) {
                    setSidebarMobileOpen(false);
                  }
                };
                return (
                  <button 
                    key={item.path || item.label} 
                    className={`nav-item ${isActive ? 'active' : ''}`} 
                    onClick={handleClick} 
                    style={{ 
                      justifyContent: (isMobile || sidebarExpanded) ? 'flex-start' : 'center',
                      color: item.label === 'Logout' ? '#ef4444' : undefined
                    }}
                  >
                    <Icon size={18} />
                    {(isMobile || sidebarExpanded) && <span>{item.label}</span>}
                    {(isMobile || sidebarExpanded) && item.badge && <span className="badge">{item.badge}</span>}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {(isMobile || sidebarExpanded) && (
          <div className="sidebar-footer">
            <div className="user-card">
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                overflow: 'hidden',
                background: avatarColor, 
                color: 'white', 
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {user?.profile_picture ? (
                  <img 
                    src={user.profile_picture} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : initials}
              </div>
              <div className="user-info" style={{ flex: 1 }}>
                <div className="user-name" style={{ fontSize: '0.875rem' }}>
                  {user?.role === 'DOCTOR' ? 'Dr. ' : ''}{user?.first_name} {user?.last_name}
                </div>
                <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></div>
                  <span>
                    {user?.role === 'DOCTOR' ? 'Cardiologist' : (user?.role === 'PATIENT' ? 'Patient' : user?.role)}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#ef4444', 
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 8
                }}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ marginLeft: isMobile ? 0 : (sidebarExpanded ? 260 : 80) }}>
        <div className="top-bar" style={{ 
          background: 'var(--bg-card)', 
          borderBottom: '1px solid var(--border)',
          justifyContent: 'space-between',
          paddingLeft: isMobile ? 16 : 24,
          paddingRight: isMobile ? 16 : 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile ? (
              <button 
                onClick={() => setSidebarMobileOpen(true)} 
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer' }}
              >
                <Menu size={18} />
              </button>
            ) : (
              <button onClick={() => setSidebarExpanded(!sidebarExpanded)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
                <Menu size={18} />
              </button>
            )}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border)', 
              borderRadius: 10, 
              padding: '8px 14px', 
              width: isMobile ? '100%' : 400,
              gap: 10
            }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input 
                placeholder="Search patient by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  outline: 'none', 
                  width: '100%',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => navigate('/doctor/alerts')}
              style={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border)', 
                borderRadius: 8, 
                padding: 8, 
                cursor: 'pointer',
                position: 'relative',
                transition: '0.2s'
              }}
              title="Alerts"
            >
              <Bell size={18} />
              <span style={{ 
                position: 'absolute', 
                top: -4, 
                right: -4, 
                background: '#ef4444', 
                color: 'white', 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                borderRadius: '50%', 
                width: 18, 
                height: 18, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>3</span>
            </button>
            {!isMobile && (
              <>
                <button 
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(err => {
                        console.log(err);
                      });
                    } else {
                      document.exitFullscreen();
                    }
                  }}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer' }}
                  title="Toggle Fullscreen"
                >
                  <Maximize2 size={18} />
                </button>
              </>
            )}
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer' }}
              title={darkMode ? "Light Mode" : "Dark Mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {!isMobile && <div style={{ width: 1, height: 24, background: 'var(--border)' }}></div>}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%', 
                  background: avatarColor, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  overflow: 'hidden'
                }}>
                  {user?.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : initials}
                </div>
                <button 
                  onClick={handleLogout}
                  style={{ 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 8, 
                    padding: 8, 
                    cursor: 'pointer',
                    color: '#ef4444'
                  }}
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="page-content" style={{ padding: isMobile ? 16 : 24 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
