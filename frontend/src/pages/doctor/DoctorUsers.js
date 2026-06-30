import React, { useState, useRef, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Eye, User, Mail, Phone, MoreVertical, Save, Camera, X, Check } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { toast } from 'react-toastify';

const sampleUsers = [
  { id: 1, firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@hospital.com', role: 'DOCTOR', status: 'Active', specialization: 'Cardiology', phone: '+1-555-123-4567' },
  { id: 2, firstName: 'Mike', lastName: 'Chen', email: 'mike.c@hospital.com', role: 'TECHNICIAN', status: 'Active', specialization: null, phone: '+1-555-987-6543' },
  { id: 3, firstName: 'Emily', lastName: 'Davis', email: 'emily.d@hospital.com', role: 'NURSE', status: 'Active', specialization: null, phone: '+1-555-456-7890' },
  { id: 4, firstName: 'Robert', lastName: 'Wilson', email: 'robert.w@hospital.com', role: 'ADMIN', status: 'Inactive', specialization: null, phone: '+1-555-789-0123' }
];

export default function DoctorUsers() {
  const [users, setUsers] = useState(sampleUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', role: 'DOCTOR', password: '', phone: '', specialization: '', profile_picture: '' });
  const [loading, setLoading] = useState(false);
  
  // Camera state - we need to know which modal is using the camera (add or edit)
  const [cameraMode, setCameraMode] = useState(null); // 'add' or 'edit'
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleAddProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPicture = event.target.result;
        setAddForm(f => ({ ...f, profile_picture: newPicture }));
        toast.success('Profile picture selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPicture = event.target.result;
        setShowEditModal({ ...showEditModal, profile_picture: newPicture });
        toast.success('Profile picture selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera functions
  const startCamera = (mode) => {
    setCameraMode(mode);
    navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' },
      audio: false
    }).then(stream => {
      setCameraStream(stream);
      setShowCamera(true);
    }).catch(err => {
      toast.error('Failed to access camera: ' + err.message);
    });
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

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/png');
      
      if (cameraMode === 'add') {
        setAddForm(f => ({ ...f, profile_picture: imageData }));
      } else if (cameraMode === 'edit') {
        setShowEditModal({ ...showEditModal, profile_picture: imageData });
      }
      
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!addForm.firstName || !addForm.lastName || !addForm.email || !addForm.password) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newUser = {
      id: users.length + 1,
      ...addForm,
      status: 'Active'
    };
    setUsers([newUser, ...users]);
    setShowAddModal(false);
    setAddForm({ firstName: '', lastName: '', email: '', role: 'DOCTOR', password: '', phone: '', specialization: '' });
    setLoading(false);
    toast.success('User added successfully!');
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUsers(users.map(u => u.id === showEditModal.id ? { ...u, ...showEditModal } : u));
    setShowEditModal(null);
    setLoading(false);
    toast.success('User updated successfully!');
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesQuery = 
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    return matchesQuery && matchesRole;
  });

  const getRoleBadge = (role) => {
    const colors = {
      'ADMIN': { bg: '#f59e0b20', color: '#f59e0b' },
      'DOCTOR': { bg: '#2e75b620', color: '#2e75b6' },
      'NURSE': { bg: '#107c4120', color: '#107c41' },
      'TECHNICIAN': { bg: '#8b5cf620', color: '#8b5cf6' }
    };
    const c = colors[role] || { bg: 'var(--border-light)', color: 'var(--text-muted)' };
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 600,
        background: c.bg,
        color: c.color
      }}>
        {role}
      </span>
    );
  };

  return (
    <AppLayout title="Users">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 500 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: 44 }}
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input"
              style={{ width: 160 }}
            >
              <option value="All">All Roles</option>
              <option value="DOCTOR">Doctor</option>
              <option value="NURSE">Nurse</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Plus size={18} />
            Add User
          </button>
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    overflow: 'hidden'
                  }}>
                    {u.profile_picture ? (
                      <img 
                        src={u.profile_picture} 
                        alt={`${u.firstName} ${u.lastName}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      `${u.firstName[0]}${u.lastName[0]}`
                    )}
                  </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: u.status === 'Active' ? 'rgba(16,124,65,0.1)' : 'rgba(239,68,68,0.1)',
                          color: u.status === 'Active' ? '#107c41' : '#ef4444'
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => setShowViewModal(u)} title="View">
                            <Eye size={14} />
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => setShowEditModal(u)} title="Edit">
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Add New User</h3>
            <form onSubmit={handleAddUser}>
              {/* Profile Picture */}
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <div style={{ 
                  position: 'relative', 
                  width: 110, 
                  height: 110, 
                  borderRadius: '50%', 
                  overflow: 'hidden',
                  margin: '0 auto 16px auto',
                  border: '3px solid var(--border)',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.12)'
                }}>
                  {addForm.profile_picture ? (
                    <img 
                      src={addForm.profile_picture} 
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={50} color="white" />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <label style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 500,
                    boxShadow: '0 2px 6px rgba(31, 78, 121, 0.25)',
                    transition: 'all 0.2s ease',
                  }}>
                    <Camera size={14} />
                    Upload Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      hidden 
                      onChange={handleAddProfilePictureChange}
                    />
                  </label>
                  <button 
                    type="button"
                    onClick={() => startCamera('add')}
                    style={{
                      background: 'var(--secondary)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 999,
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 500,
                      boxShadow: '0 2px 6px rgba(16, 124, 65, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Camera size={14} />
                    Take Photo
                  </button>
                  {addForm.profile_picture && (
                    <button 
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, profile_picture: '' }))}
                      style={{
                        background: 'transparent',
                        color: 'var(--danger)',
                        padding: '8px 16px',
                        borderRadius: 999,
                        fontSize: '0.8rem',
                        border: '2px solid var(--danger)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <X size={14} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>First Name *</label>
                  <input type="text" value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} className="input" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Last Name *</label>
                  <input type="text" value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} className="input" required />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Email *</label>
                <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="input" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Phone</label>
                <input type="tel" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className="input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Role *</label>
                  <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })} className="input" required>
                    <option value="DOCTOR">Doctor</option>
                    <option value="NURSE">Nurse</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                {addForm.role === 'DOCTOR' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Specialization</label>
                    <input type="text" value={addForm.specialization} onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })} className="input" />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Password *</label>
                <input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} className="input" required minLength={6} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowViewModal(null)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '1.5rem', 
                  fontWeight: 700,
                  overflow: 'hidden'
                }}>
                  {showViewModal.profile_picture ? (
                    <img 
                      src={showViewModal.profile_picture} 
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    `${showViewModal.firstName[0]}${showViewModal.lastName[0]}`
                  )}
                </div>
                <div>
                  <h3>{showViewModal.firstName} {showViewModal.lastName}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{showViewModal.role}</p>
                </div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowViewModal(null)}>Close</button>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 4, fontSize: '0.875rem' }}><Mail size={16} /> Email</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{showViewModal.email}</div>
              </div>
              {showViewModal.phone && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 4, fontSize: '0.875rem' }}><Phone size={16} /> Phone</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{showViewModal.phone}</div>
                </div>
              )}
              {showViewModal.specialization && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 4, fontSize: '0.875rem' }}><User size={16} /> Specialization</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{showViewModal.specialization}</div>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 4, fontSize: '0.875rem' }}><span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</span></div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: showViewModal.status === 'Active' ? 'rgba(16,124,65,0.1)' : 'rgba(239,68,68,0.1)',
                  color: showViewModal.status === 'Active' ? '#107c41' : '#ef4444'
                }}>{showViewModal.status}</span>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => { setShowViewModal(null); setShowEditModal(showViewModal); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Edit size={16} /> Edit User</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowEditModal(null)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Edit User</h3>
            <form onSubmit={handleEditUser}>
              {/* Profile Picture */}
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <div style={{ 
                  position: 'relative', 
                  width: 110, 
                  height: 110, 
                  borderRadius: '50%', 
                  overflow: 'hidden',
                  margin: '0 auto 16px auto',
                  border: '3px solid var(--border)',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.12)'
                }}>
                  {showEditModal.profile_picture ? (
                    <img 
                      src={showEditModal.profile_picture} 
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={50} color="white" />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <label style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 500,
                    boxShadow: '0 2px 6px rgba(31, 78, 121, 0.25)',
                    transition: 'all 0.2s ease',
                  }}>
                    <Camera size={14} />
                    Upload Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      hidden 
                      onChange={handleEditProfilePictureChange}
                    />
                  </label>
                  <button 
                    type="button"
                    onClick={() => startCamera('edit')}
                    style={{
                      background: 'var(--secondary)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 999,
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 500,
                      boxShadow: '0 2px 6px rgba(16, 124, 65, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Camera size={14} />
                    Take Photo
                  </button>
                  {showEditModal.profile_picture && (
                    <button 
                      type="button"
                      onClick={() => setShowEditModal({ ...showEditModal, profile_picture: '' })}
                      style={{
                        background: 'transparent',
                        color: 'var(--danger)',
                        padding: '8px 16px',
                        borderRadius: 999,
                        fontSize: '0.8rem',
                        border: '2px solid var(--danger)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <X size={14} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>First Name</label>
                  <input type="text" value={showEditModal.firstName} onChange={(e) => setShowEditModal({ ...showEditModal, firstName: e.target.value })} className="input" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Last Name</label>
                  <input type="text" value={showEditModal.lastName} onChange={(e) => setShowEditModal({ ...showEditModal, lastName: e.target.value })} className="input" required />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Email</label>
                <input type="email" value={showEditModal.email} onChange={(e) => setShowEditModal({ ...showEditModal, email: e.target.value })} className="input" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Phone</label>
                <input type="tel" value={showEditModal.phone} onChange={(e) => setShowEditModal({ ...showEditModal, phone: e.target.value })} className="input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Role</label>
                  <select value={showEditModal.role} onChange={(e) => setShowEditModal({ ...showEditModal, role: e.target.value })} className="input" required>
                    <option value="DOCTOR">Doctor</option>
                    <option value="NURSE">Nurse</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                {showEditModal.role === 'DOCTOR' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Specialization</label>
                    <input type="text" value={showEditModal.specialization} onChange={(e) => setShowEditModal({ ...showEditModal, specialization: e.target.value })} className="input" />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Status</label>
                <select value={showEditModal.status} onChange={(e) => setShowEditModal({ ...showEditModal, status: e.target.value })} className="input">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Camera Modal */}
      {showCamera && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001,
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
    </AppLayout>
  );
}
