import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    confirmPassword: '', phone: '', dob: '', gender: '', role: 'PATIENT',
    specialization: '', department: '', invitation_code: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [showInvitationCode, setShowInvitationCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Password strength check
  const getPasswordStrength = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;
    return { hasUpperCase, hasLowerCase, hasNumber, hasMinLength };
  };

  const isPasswordStrong = (password) => {
    const s = getPasswordStrength(password);
    return s.hasUpperCase && s.hasLowerCase && s.hasNumber && s.hasMinLength;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { first_name, last_name, email, password, confirmPassword, phone, dob, gender, role, specialization, department, invitation_code } = form;

    if (!first_name || !last_name || !email || !password) {
      return toast.error('Please fill in all required fields');
    }
    if (!isPasswordStrong(password)) {
      return toast.error('Password must be at least 8 characters and contain uppercase, lowercase, and a number');
    }
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const user = await register({ first_name, last_name, email, password, phone, dob, gender, role, specialization, department, invitation_code });
      toast.success(`Welcome, ${user.first_name}! Your account has been created.`);
      navigate(user.role === 'DOCTOR' ? '/doctor' : '/patient');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: 32 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={24} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>Join ECG AI Platform</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{form.role === 'DOCTOR' ? 'Doctor Registration' : 'Patient Registration'}</div>
            </div>
          </div>

          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            {form.role === 'DOCTOR' ? 'Provide Heart Health Care' : 'Track Your Heart Health'}<br />From Anywhere
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 360 }}>
            {form.role === 'DOCTOR' 
              ? 'Create a doctor account to monitor patients, view ECG analyses, and manage cardiovascular health.' 
              : 'Create a free patient account to view your ECG history, AI analysis results, cardiovascular risk scores, and doctor recommendations.'}
          </p>
        </div>

        <svg style={{ position: 'absolute', bottom: 80, left: 0, right: 0, opacity: 0.15 }} viewBox="0 0 400 60" preserveAspectRatio="none">
          <polyline points="0,30 60,30 70,10 80,50 90,10 100,50 110,30 170,30 180,5 190,55 200,30 260,30 270,15 280,45 290,15 300,45 310,30 370,30 400,30" fill="none" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      <div className="auth-right">
        <div className="auth-form-container" style={{ maxWidth: 440 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 6 }}>Create your account</h2>
            <p className="text-secondary text-sm">Choose your role to register</p>
          </div>

          <form onSubmit={handleRegister}>
            {/* Role Selection */}
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">I am registering as</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: 'PATIENT' }))}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: form.role === 'PATIENT' ? '2px solid var(--primary)' : '2px solid var(--border)',
                    background: form.role === 'PATIENT' ? 'rgba(37,99,235,0.08)' : 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: 'DOCTOR' }))}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: form.role === 'DOCTOR' ? '2px solid var(--primary)' : '2px solid var(--border)',
                    background: form.role === 'DOCTOR' ? 'rgba(37,99,235,0.08)' : 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Doctor
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group" style={{ marginBottom: 12 }}>
                <label className="input-label">First name *</label>
                <input className="input" value={form.first_name} onChange={update('first_name')} placeholder="Emmanuel" required />
              </div>
              <div className="input-group" style={{ marginBottom: 12 }}>
                <label className="input-label">Last name *</label>
                <input className="input" value={form.last_name} onChange={update('last_name')} placeholder="Biya" required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email address *</label>
              <input className="input" type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" autoComplete="email" required />
            </div>

            <div className="input-group">
              <label className="input-label">Phone number</label>
              <input className="input" type="tel" value={form.phone} onChange={update('phone')} placeholder="+237 6XX XXX XXX" />
            </div>

            {form.role === 'PATIENT' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label className="input-label">Date of birth</label>
                  <input className="input" type="date" value={form.dob} onChange={update('dob')} />
                </div>
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label className="input-label">Gender</label>
                  <select className="input" value={form.gender} onChange={update('gender')}>
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
            )}

            {form.role === 'DOCTOR' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group" style={{ marginBottom: 12 }}>
                    <label className="input-label">Specialization</label>
                    <input className="input" value={form.specialization} onChange={update('specialization')} placeholder="Cardiology" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 12 }}>
                    <label className="input-label">Department</label>
                    <input className="input" value={form.department} onChange={update('department')} placeholder="Cardiology" />
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label className="input-label">Hospital Invitation Code *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" type={showInvitationCode ? 'text' : 'password'} value={form.invitation_code} onChange={update('invitation_code')} placeholder="Enter invitation code" required />
                    <button type="button" onClick={() => setShowInvitationCode(!showInvitationCode)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showInvitationCode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Enter the hospital-provided invitation code to register as a doctor</p>
                </div>
              </>
            )}

            <div className="input-group">
              <label className="input-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Min. 8 characters" autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength indicators */}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(() => {
                  const s = getPasswordStrength(form.password);
                  const requirements = [
                    { label: 'At least 8 characters', met: s.hasMinLength },
                    { label: 'Uppercase letter (A-Z)', met: s.hasUpperCase },
                    { label: 'Lowercase letter (a-z)', met: s.hasLowerCase },
                    { label: 'Number (0-9)', met: s.hasNumber }
                  ];
                  return requirements.map((req, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: req.met ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: req.met ? '#22c55e' : '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {req.met ? '✓' : '○'}
                      </span>
                      <span style={{
                        fontSize: '0.78rem',
                        color: req.met ? '#22c55e' : '#94a3b8'
                      }}>
                        {req.label}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm password *</label>
              <input className="input" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Repeat your password" autoComplete="new-password" required />
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginTop: 8, width: '100%' }}>
              {loading ? <><div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Creating account...</> : <><UserPlus size={16} /> Create Account</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
