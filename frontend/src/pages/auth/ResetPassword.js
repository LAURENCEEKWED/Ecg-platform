import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error('Please fill in all fields');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (!isPasswordStrong(password)) {
      return toast.error('Password must be at least 8 characters and contain uppercase, lowercase, and a number');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSubmitted(true);
      toast.success('Password reset successful! Please sign in with your new password.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="auth-page">
        <div className="auth-right">
          <div className="auth-form-container">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ marginBottom: 24, color: '#ef4444' }}>
                <ArrowLeft size={64} />
              </div>
              <h2 style={{ marginBottom: 16 }}>Invalid or Missing Token</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                The password reset link is invalid or expired.
              </p>
              <Link to="/forgot-password" className="btn btn-primary">
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-right">
          <div className="auth-form-container">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ marginBottom: 24 }}>
                <CheckCircle2 size={64} color="#10b981" />
              </div>
              <h2 style={{ marginBottom: 16 }}>Password Reset!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                Your password has been successfully reset.
              </p>
              <Link to="/login" className="btn btn-primary">
                Sign In Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-right">
        <div className="auth-form-container">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ marginBottom: 6 }}>Set New Password</h2>
            <p className="text-secondary text-sm">
              Enter your new password below.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength indicators */}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(() => {
                  const s = getPasswordStrength(password);
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
              <label className="input-label">Confirm Password</label>
              <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
              style={{ marginTop: 8, width: '100%' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
