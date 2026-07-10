import React, { useState, useRef, useEffect } from 'react';
import { Activity, Users, Bell, Zap, TrendingUp, Save, Camera, User, X, Check } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function DoctorProfile() {
  const { user, profile, updateUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    specialization: profile?.specialization || '',
    department: profile?.department || '',
    profile_picture: user?.profile_picture || '',
  });

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPicture = event.target.result;
        setForm(f => ({ ...f, profile_picture: newPicture }));
        toast.success('Profile picture selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      // Check if HTTPS (required for camera API)
      const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isHttps) {
        toast.error('Camera access requires HTTPS connection! Please ensure your site is served over HTTPS.');
        return;
      }

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera access is not supported in this browser.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      console.error('Camera error:', err);
      let errorMessage = 'Failed to access camera';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      toast.error(errorMessage, { autoClose: 8000 });
    }
  };

  // Stop camera when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Update video element when stream is ready
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, showCamera]);

  // Capture photo
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to base64
      const imageData = canvas.toDataURL('image/png');
      setForm(f => ({ ...f, profile_picture: imageData }));
      closeCamera();
      toast.success('Photo captured!');
    }
  };

  const closeCamera = () => {
    setShowCamera(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const confirmRemovePicture = () => {
    setForm(f => ({ ...f, profile_picture: '' }));
    setShowRemoveConfirm(false);
    toast.success('Profile picture removed');
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/doctors/profile', form);
      updateUser({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        profile_picture: form.profile_picture
      });
      toast.success('Profile updated successfully');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to change password'); }
    finally { setSavingPw(false); }
  };

  return (
    <AppLayout title="My Profile">
      <div style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 20 }}>Profile Settings</h1>

        {/* Profile card */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Personal Information</h3></div>
          <div className="card-body">
            {/* Profile Picture */}
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <div style={{ 
                  position: 'relative', 
                  width: 140, 
                  height: 140, 
                  borderRadius: '50%', 
                  overflow: 'hidden',
                  margin: '0 auto 20px auto',
                  border: '4px solid var(--border)',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {form.profile_picture ? (
                    <img 
                      src={form.profile_picture} 
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={60} color="white" />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <label style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: 999,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 500,
                    boxShadow: '0 2px 8px rgba(31, 78, 121, 0.3)',
                    transition: 'all 0.2s ease',
                  }}>
                    <Camera size={16} />
                    Upload Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      hidden 
                      onChange={handleProfilePictureChange}
                    />
                  </label>
                  <button 
                    type="button"
                    onClick={startCamera}
                    style={{
                      background: 'var(--secondary)',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: 999,
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 500,
                      boxShadow: '0 2px 8px rgba(16, 124, 65, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Camera size={16} />
                    Take Photo
                  </button>
                  {form.profile_picture && (
                    <button 
                      type="button"
                      onClick={() => setShowRemoveConfirm(true)}
                      style={{
                        background: 'transparent',
                        color: 'var(--danger)',
                        padding: '10px 20px',
                        borderRadius: 999,
                        fontSize: '0.875rem',
                        border: '2px solid var(--danger)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <X size={16} />
                      Remove
                    </button>
                  )}
                </div>
            </div>
            {/* Camera Modal */}
            {showCamera && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
                padding: 20
              }}>
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: 16,
                  padding: 20,
                  width: '100%',
                  maxWidth: 500,
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Take Profile Photo</h3>
                    <button 
                      type="button" 
                      onClick={closeCamera}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4
                      }}
                    >
                      <X size={24} color="var(--text-muted)" />
                    </button>
                  </div>
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline
                      style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button 
                      type="button" 
                      onClick={closeCamera}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={capturePhoto}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'var(--primary)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Check size={18} />
                      Capture
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Remove Picture Confirmation Modal */}
            {showRemoveConfirm && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
                padding: 20
              }}>
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  padding: 24,
                  width: '100%',
                  maxWidth: 400,
                  textAlign: 'center'
                }}>
                  <h3 style={{ marginBottom: 12, fontSize: '1.125rem' }}>Remove Profile Photo</h3>
                  <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Are you sure you want to remove your profile photo?</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setShowRemoveConfirm(false)}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmRemovePicture}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#EF4444',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">First Name</label>
                <input className="input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Last Name</label>
                <input className="input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Email (read-only)</label>
              <input className="input" value={user?.email || ''} readOnly style={{ background: 'var(--bg-primary)', cursor: 'not-allowed' }} />
            </div>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Specialization</label>
                <input className="input" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Department</label>
                <input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn btn-primary" style={{ marginTop: 16 }}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="card">
          <div className="card-header"><h3>Change Password</h3></div>
          <div className="card-body">
            {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
              <div key={field} className="input-group">
                <label className="input-label">{['Current Password', 'New Password', 'Confirm New Password'][i]}</label>
                <input className="input" type="password" value={pwForm[field]} onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
            <button onClick={changePassword} disabled={savingPw} className="btn btn-primary">
              {savingPw ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
