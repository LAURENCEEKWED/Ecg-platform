import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WSProvider } from './context/WSContext';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import LandingPage from './pages/public/LandingPage';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPatientDetail from './pages/doctor/DoctorPatientDetail';
import DoctorAlerts from './pages/doctor/DoctorAlerts';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorSimulator from './pages/doctor/DoctorSimulator';
import DoctorReports from './pages/doctor/DoctorReports';
import DoctorDevices from './pages/doctor/DoctorDevices';
import DoctorUsers from './pages/doctor/DoctorUsers';
import DoctorHelpSupport from './pages/doctor/DoctorHelpSupport';
import DoctorECGRecords from './pages/doctor/DoctorECGRecords';
import DoctorAIAnalysis from './pages/doctor/DoctorAIAnalysis';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientECGHistory from './pages/patient/PatientECGHistory';
import PatientAnalysis from './pages/patient/PatientAnalysis';
import PatientProfile from './pages/patient/PatientProfile';
import PatientSmartwatch from './pages/patient/PatientSmartwatch';

// Shared pages
import MessagesPage from './pages/shared/MessagesPage';
import SettingsPage from './pages/shared/SettingsPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p className="text-muted text-sm">Loading ECG Platform...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'DOCTOR' ? '/doctor' : '/patient'} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to={user.role === 'DOCTOR' || user.role === 'ADMIN' ? '/doctor' : '/patient'} replace /> : <LandingPage />
      } />
      <Route path="/login" element={user ? <Navigate to={user.role === 'DOCTOR' || user.role === 'ADMIN' ? '/doctor' : '/patient'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'DOCTOR' || user.role === 'ADMIN' ? '/doctor' : '/patient'} replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={user ? <Navigate to={user.role === 'DOCTOR' || user.role === 'ADMIN' ? '/doctor' : '/patient'} replace /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to={user.role === 'DOCTOR' || user.role === 'ADMIN' ? '/doctor' : '/patient'} replace /> : <ResetPassword />} />

      {/* Doctor routes */}
      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorPatients /></ProtectedRoute>} />
      <Route path="/doctor/patients/:id" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorPatientDetail /></ProtectedRoute>} />
      <Route path="/doctor/alerts" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorAlerts /></ProtectedRoute>} />
      <Route path="/doctor/simulator" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorSimulator /></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorProfile /></ProtectedRoute>} />
      <Route path="/doctor/reports" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorReports /></ProtectedRoute>} />
      <Route path="/doctor/devices" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorDevices /></ProtectedRoute>} />
      <Route path="/doctor/users" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorUsers /></ProtectedRoute>} />
      <Route path="/doctor/help-support" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorHelpSupport /></ProtectedRoute>} />
      <Route path="/doctor/ecg-records" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorECGRecords /></ProtectedRoute>} />
      <Route path="/doctor/ai-analysis" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorAIAnalysis /></ProtectedRoute>} />

      {/* Patient routes */}
      <Route path="/patient" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/ecg-history" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientECGHistory /></ProtectedRoute>} />
      <Route path="/patient/analysis" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientAnalysis /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/smartwatch" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientSmartwatch /></ProtectedRoute>} />

      {/* Shared routes */}
      <Route path="/messages" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN', 'PATIENT']}><MessagesPage /></ProtectedRoute>} />
      <Route path="/messages/:userId" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN', 'PATIENT']}><MessagesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN', 'PATIENT']}><SettingsPage /></ProtectedRoute>} />

      {/* Root redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <WSProvider>
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} closeOnClick pauseOnHover theme="light" />
        </WSProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
