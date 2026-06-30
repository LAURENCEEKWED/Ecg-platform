import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, ArrowLeft, Mail } from 'lucide-react';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-right">
          <div className="auth-form-container">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ marginBottom: 24 }}>
                <Mail size={64} color="#1f4e79" />
              </div>
              <h2 style={{ marginBottom: 16 }}>Check Your Email</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                If an account exists with {email}, you will receive a password reset link shortly.
              </p>
              <Link to="/login" className="btn btn-primary">
                <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back to Login
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
            <h2 style={{ marginBottom: 6 }}>Forgot Password?</h2>
            <p className="text-secondary text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email address</label>
              <div className="input-icon-wrapper">
                <span className="icon">@</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Remember your password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
