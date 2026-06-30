import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Eye, EyeOff, Activity, Shield, Zap, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const demos = {
    DOCTOR: { email: 'dr.kameni@ecgplatform.cm', password: 'doctor123', label: 'Dr. Marie Kameni — Cardiologist' },
    PATIENT: { email: 'emmanuel.b@email.cm', password: 'patient123', label: 'Emmanuel Biya — Patient' },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate(user.role === 'DOCTOR' || user.role === 'ADMIN' ? '/doctor' : '/patient');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoRole) => {
    const d = demos[demoRole];
    setEmail(d.email);
    setPassword(d.password);
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={24} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>ECG AI Platform</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Hospital Integration Edition</div>
            </div>
          </div>

          <h2 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            AI-Powered Cardiac<br />Intelligence for Africa
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
            Cloud-native platform connecting hospital ECG machines to AI analysis. 
            Detecting arrhythmias with 97.6% F1-score. Predicting cardiovascular risk in real time.
          </p>

          {/* Features */}
          {[
            { icon: Activity, title: '1D-CNN Arrhythmia Classification', desc: '5 rhythm classes · 97.6% weighted F1-score' },
            { icon: Shield, title: 'CVD Risk Prediction', desc: 'XGBoost model · Numerical score 0–100' },
            { icon: Zap, title: '< 5-Second Alert Dispatch', desc: 'SMS + Email via AWS SNS on HIGH risk' },
            { icon: Users, title: 'Multi-Hospital Integration', desc: 'HL7 FHIR R4 · Secure HTTPS API' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{title}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom attribution */}
        <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
            University Institute of the Coast (IUC) · SEAS Department<br />
            B.Tech Cloud Computing Final Project · Academic Year 2024–2025
          </p>
        </div>

        {/* Decorative ECG line */}
        <svg style={{ position: 'absolute', bottom: 80, left: 0, right: 0, opacity: 0.15, overflow: 'visible' }} viewBox="0 0 400 60" preserveAspectRatio="none">
          <polyline points="0,30 60,30 70,10 80,50 90,10 100,50 110,30 170,30 180,5 190,55 200,30 260,30 270,15 280,45 290,15 300,45 310,30 370,30 400,30" fill="none" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-container">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
            <p className="text-secondary text-sm">Sign in to your ECG AI Platform account</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Email address</label>
              <div className="input-icon-wrapper">
                <span className="icon">@</span>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginTop: 8, width: '100%' }}>
              {loading ? <><div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 28, padding: 16, background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 10 }}>Demo Accounts</p>
            {Object.entries(demos).map(([r, d]) => (
              <div key={r} onClick={() => fillDemo(r)} style={{ cursor: 'pointer', padding: '8px 10px', borderRadius: 6, marginBottom: 4, background: 'transparent', border: '1px solid transparent', transition: '0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(31,78,121,0.06)'; e.currentTarget.style.border = '1px solid rgba(31,78,121,0.15)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{d.email} · {d.password}</div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Forgot your password?{' '}
            <Link to="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Reset it</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            IUC · School of Engineering and Applied Sciences
          </p>
        </div>
      </div>
    </div>
  );
}
