const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { analyzeECG } = require('../services/aiAnalysis');
const { sendEmail } = require('../services/notifications');

// Helper: Generate initial ECG records for new patients
const generateInitialECGRecords = async (patientId, doctorId, hospitalId) => {
  const rhythms = ['NORMAL', 'NORMAL', 'NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC'];
  
  for (let i = 0; i < 5; i++) {
    const rhythm = rhythms[Math.floor(Math.random() * rhythms.length)];
    
    const simulatedFeatures = {
      NORMAL: { heart_rate_bpm: 72, qt_interval_ms: 420, qrs_duration_ms: 88, pr_interval_ms: 160, st_deviation_mm: 0.1, hrv_rmssd_ms: 45, p_wave_present: true, rr_irregular: false },
      TACHYCARDIA: { heart_rate_bpm: 145, qt_interval_ms: 380, qrs_duration_ms: 82, pr_interval_ms: 148, st_deviation_mm: 0.3, hrv_rmssd_ms: 18, p_wave_present: true, rr_irregular: false },
      BRADYCARDIA: { heart_rate_bpm: 42, qt_interval_ms: 460, qrs_duration_ms: 95, pr_interval_ms: 178, st_deviation_mm: 0.2, hrv_rmssd_ms: 52, p_wave_present: true, rr_irregular: false },
      AFIB: { heart_rate_bpm: 88, qt_interval_ms: 465, qrs_duration_ms: 90, pr_interval_ms: null, st_deviation_mm: 0.5, hrv_rmssd_ms: 8, p_wave_present: false, rr_irregular: true },
      PVC: { heart_rate_bpm: 76, qt_interval_ms: 440, qrs_duration_ms: 148, pr_interval_ms: 162, st_deviation_mm: 0.2, hrv_rmssd_ms: 22, p_wave_present: true, rr_irregular: false }
    };

    const features = simulatedFeatures[rhythm] || simulatedFeatures.NORMAL;
    const analysisResult = await analyzeECG(features);
    
    const daysAgo = 30 - (i * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const ecgRecord = db.insert('ecg_records', {
      patient_id: patientId,
      hospital_id: hospitalId,
      doctor_id: doctorId,
      file_name: `initial_ecg_${patientId}_${i + 1}.json`,
      file_format: 'JSON-SIMULATED',
      sample_rate: 500,
      leads: 12,
      duration_seconds: 30,
      processing_status: 'COMPLETE',
      received_at: date.toISOString(),
      processing_time_ms: analysisResult.inference_latency_ms
    });

    db.insert('ai_analyses', {
      ecg_record_id: ecgRecord.id,
      patient_id: patientId,
      rhythm_class: analysisResult.rhythm_class,
      rhythm_confidence: analysisResult.confidence,
      cvd_risk_score: analysisResult.cvd_risk_score,
      risk_category: analysisResult.risk_category,
      heart_rate_bpm: analysisResult.heart_rate_bpm,
      qt_interval_ms: analysisResult.qt_interval_ms,
      qrs_duration_ms: analysisResult.qrs_duration_ms,
      pr_interval_ms: analysisResult.pr_interval_ms,
      st_deviation_mm: analysisResult.st_deviation_mm,
      hrv_rmssd_ms: analysisResult.hrv_rmssd_ms,
      p_wave_axis: analysisResult.p_wave_axis,
      recommendations: JSON.stringify(analysisResult.recommendations),
      model_version: analysisResult.model_version,
      inference_latency_ms: analysisResult.inference_latency_ms,
      analyzed_at: date.toISOString()
    });
  }
};

// Helper: Check password strength
const isPasswordStrong = (password) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  return hasUpperCase && hasLowerCase && hasNumber && hasMinLength;
};

// POST /api/v1/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password, phone, dob, gender, role = 'PATIENT', specialization, department, invitation_code } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email, and password are required' });
  }
  if (!isPasswordStrong(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number' 
    });
  }

  // Require and validate invitation code for doctor registration
  if (role.toUpperCase() === 'DOCTOR') {
    if (!invitation_code) {
      return res.status(400).json({ error: 'Hospital invitation code is required to register as a doctor' });
    }
    if (invitation_code !== 'ECG103') {
      return res.status(400).json({ error: 'Invalid hospital invitation code' });
    }
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (db.findOne('users', { email: normalizedEmail })) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = db.insert('users', {
    email: normalizedEmail,
    password: hashed,
    role: role.toUpperCase(),
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    phone: phone?.trim() || null,
    status: 'ACTIVE'
  });

  let profile;
  
  // Create default settings for new user
  db.insert('settings', {
    user_id: user.id,
    email_notifications: true,
    sms_notifications: true,
    dark_mode: false,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  if (user.role === 'DOCTOR') {
    const defaultHospital = db.findAll('hospitals')[0];
    if (!defaultHospital) return res.status(503).json({ error: 'Registration is temporarily unavailable' });

    profile = db.insert('doctors', {
      user_id: user.id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      specialization: specialization || 'Cardiology',
      department: department || 'Cardiology',
      hospital_id: defaultHospital.id,
      status: 'ACTIVE',
      total_patients: 0
    });
  } else {
    const defaultHospital = db.findAll('hospitals')[0];
    if (!defaultHospital) return res.status(503).json({ error: 'Registration is temporarily unavailable' });

    // Create patient with PENDING status (no doctor assigned yet)
    profile = db.insert('patients', {
      user_id: user.id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      dob: dob || null,
      gender: gender || null,
      doctor_id: null,
      hospital_id: defaultHospital.id,
      status: 'PENDING'
    });

    // Generate initial ECG records even for pending patients
    await generateInitialECGRecords(profile.id, null, defaultHospital.id);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'ecg-secret-2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const { password: _, ...safeUser } = user;
  res.status(201).json({ token, user: safeUser, profile, message: 'Account created successfully' });
}));

// POST /api/v1/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.findOne('users', { email: email.toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.status !== 'ACTIVE') return res.status(403).json({ error: 'Account is inactive' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'ecg-secret-2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Fetch role-specific profile
  let profile = null;
  if (user.role === 'DOCTOR') {
    profile = db.findOne('doctors', { user_id: user.id });
  } else if (user.role === 'PATIENT') {
    profile = db.findOne('patients', { user_id: user.id });
  }

  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser, profile });
}));

// GET /api/v1/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const { password: _, ...safeUser } = req.user;
  let profile = null;
  if (req.user.role === 'DOCTOR') profile = db.findOne('doctors', { user_id: req.user.id });
  else if (req.user.role === 'PATIENT') profile = db.findOne('patients', { user_id: req.user.id });
  res.json({ user: safeUser, profile });
}));

// POST /api/v1/auth/change-password
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (!isPasswordStrong(newPassword)) {
    return res.status(400).json({ 
      error: 'New password must be at least 8 characters and contain uppercase, lowercase, and a number' 
    });
  }

  const valid = await bcrypt.compare(currentPassword, req.user.password);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hashed = await bcrypt.hash(newPassword, 10);
  db.update('users', req.user.id, { password: hashed });
  res.json({ message: 'Password updated successfully' });
}));

// POST /api/v1/auth/forgot-password - Request password reset
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.findOne('users', { email: normalizedEmail });
  
  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If an account exists with that email, you will receive a password reset link' });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  // Store reset token in user record (we can add a reset_tokens table if needed, but for simplicity we'll use user fields)
  // Since our database is simple, let's create a reset_tokens collection
  db.insert('reset_tokens', {
    user_id: user.id,
    token: resetToken,
    expires_at: resetTokenExpiry,
    used: false,
    created_at: new Date().toISOString()
  });

  // Send reset email
  console.log('📧 Sending password reset email to:', user.email);
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  console.log('🔗 Reset URL:', resetUrl);
  const emailContent = `
    <h2>Password Reset Request</h2>
    <p>Dear ${user.first_name},</p>
    <p>You have requested to reset your password for the ECG AI Platform.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}" style="background: #1f4e79; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
    <hr>
    <p style="color: #666; font-size: 12px;">This is an automated message. Do not reply.</p>
  `;

  const emailResult = await sendEmail(user.email, 'Password Reset Request - ECG AI Platform', emailContent);
  console.log('📧 Email result:', emailResult);

  res.json({ message: 'If an account exists with that email, you will receive a password reset link' });
}));

// POST /api/v1/auth/reset-password - Confirm password reset
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
  if (!isPasswordStrong(newPassword)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number' 
    });
  }

  // Find valid reset token
  const resetTokens = db.query('reset_tokens', rt => rt.token === token && !rt.used && new Date(rt.expires_at) > new Date());
  if (resetTokens.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired password reset token' });
  }

  const resetToken = resetTokens[0];
  const user = db.findById('users', resetToken.user_id);
  if (!user) return res.status(400).json({ error: 'Invalid or expired password reset token' });

  // Update password
  const hashed = await bcrypt.hash(newPassword, 10);
  db.update('users', user.id, { password: hashed });

  // Mark token as used
  db.update('reset_tokens', resetToken.id, { used: true });

  res.json({ message: 'Password reset successful' });
}));

module.exports = router;
