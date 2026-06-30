import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Activity, Users, Bell, Zap, TrendingUp, Clock,
  ChevronRight, Eye, Download, Share2,
  Play, Pause, Volume2, VolumeX, Mic, Square,
  MessageCircle, Facebook, Twitter, Linkedin
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function DoctorPatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState(true);
  const [ecgWaveform, setEcgWaveform] = useState([]);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Initialize ECG waveform data
  useEffect(() => {
    const initialWaveform = [];
    for (let i = 0; i < 200; i++) {
      initialWaveform.push(20);
    }
    setEcgWaveform(initialWaveform);
  }, []);

  const fetch = useCallback(async () => {
    try {
      const [analysisRes, historyRes] = await Promise.all([
        api.get(`/patients/${id}/analysis`),
        api.get(`/patients/${id}/ecg-history`)
      ]);
      setPatient(analysisRes.data);
      setHistory(historyRes.data.ecg_history || []);
    } catch { toast.error('Failed to load patient data'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const [patientInfo, setPatientInfo] = useState(null);
  useEffect(() => {
    api.get('/doctors/dashboard').then(res => {
      const p = res.data.patients?.find(p => p.id === parseInt(id));
      setPatientInfo(p);
    }).catch(() => {});
  }, [id]);



  // Generate realistic ECG waveform
  const generateECGSample = (time) => {
    const base = 20;
    const t = time * Math.PI;
    
    // P wave
    const p = 5 * Math.sin(t * 2.5) * Math.exp(-Math.pow((t - 0.2) / 0.1, 2));
    // QRS complex
    const q = -8 * Math.exp(-Math.pow((t - 0.35) / 0.04, 2));
    const r = 15 * Math.exp(-Math.pow((t - 0.4) / 0.06, 2));
    const s = -6 * Math.exp(-Math.pow((t - 0.45) / 0.04, 2));
    // T wave
    const twave = 6 * Math.sin(t * 0.8) * Math.exp(-Math.pow((t - 0.7) / 0.15, 2));
    
    return base + p + q + r + s + twave;
  };

  // Playback/Recording
  useEffect(() => {
    if (isPlaying || isRecording) {
      let time = 0;
      recordingIntervalRef.current = setInterval(() => {
        time += 0.02;
        setProgress(prev => prev < 60 ? prev + 1 : 0);
        
        setEcgWaveform(prev => {
          const newWaveform = [...prev.slice(1)];
          newWaveform.push(generateECGSample(time % 1));
          return newWaveform;
        });

        // Sound effect
        if (sound) {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          if (!oscillatorRef.current) {
            oscillatorRef.current = audioContextRef.current.createOscillator();
            gainNodeRef.current = audioContextRef.current.createGain();
            oscillatorRef.current.connect(gainNodeRef.current);
            gainNodeRef.current.connect(audioContextRef.current.destination);
            oscillatorRef.current.frequency.value = 800;
            gainNodeRef.current.gain.value = 0.05;
            oscillatorRef.current.start();
          }
        }
      }, 50);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
        audioContextRef.current = null;
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isPlaying, isRecording, sound]);

  const startRecording = () => {
    setIsRecording(true);
    toast.success('ECG recording started');
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast.success('ECG recording stopped');
  };

  const downloadReport = () => {
    const reportContent = `
ECG REPORT
==========
Patient: ${patientInfo?.first_name || 'Koffi'} ${patientInfo?.last_name || 'Alan'}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

ANALYSIS
--------
Status: Abnormal
Confidence: 92%
Findings: Atrial Fibrillation, ST-T Abnormality

VITAL SIGNS
-----------
HR: 112 bpm
BP: 148/92 mmHg
SpO2: 96%
Temp: 37.2°C
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ecg-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully');
  };

  const shareReport = (platform) => {
    const text = `ECG Report for ${patientInfo?.first_name || 'Koffi'} ${patientInfo?.last_name || 'Alan'} - Status: Abnormal`;
    const url = window.location.href;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'messages') {
      if (navigator.share) {
        navigator.share({
          title: 'ECG Report',
          text: text,
          url: url
        }).catch(console.error);
      } else {
        toast.info('Share not supported on this browser');
      }
    }
    toast.success(`Sharing to ${platform}`);
  };

  if (loading) return (
    <AppLayout title="Patient Detail">
      <div className="loading-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="loading-spinner"></div>
      </div>
    </AppLayout>
  );

  const analysis = patient?.analysis;
  const age = patientInfo?.dob ? Math.floor((Date.now() - new Date(patientInfo.dob)) / (365.25 * 24 * 3600 * 1000)) : 58;

  // 12-lead ECG waveform visualization
  const renderECGGrid = () => {
    const leads = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
    
    return (
      <div style={{ 
        background: '#0f172a', 
        padding: 16, 
        borderRadius: 12, 
        border: '1px solid #334155'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '12px 24px',
          marginBottom: 12
        }}>
          {leads.map((lead, idx) => (
            <div key={lead} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              padding: '6px 0',
              borderBottom: '1px solid #1e293b'
            }}>
              <span style={{ 
                color: '#94a3b8', 
                fontWeight: 700, 
                fontSize: '0.75rem',
                width: 28
              }}>{lead}</span>
              <svg viewBox="0 0 200 40" style={{ flex: 1, height: 40 }}>
                <defs>
                  <pattern id={`grid-${lead}`} width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#grid-${lead})`} />
                <polyline 
                  points={ecgWaveform.map((v, i) => `${i},${v + (idx % 3 * 5)}`).join(' ')}
                  fill="none" 
                  stroke="#22c55e" 
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Playback/Recording controls */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              style={{ 
                background: '#2563eb', 
                border: 'none', 
                borderRadius: 8, 
                padding: 8, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isPlaying ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}
            </button>
            
            <button 
              onClick={isRecording ? stopRecording : startRecording} 
              style={{ 
                background: isRecording ? '#ef4444' : '#22c55e', 
                border: 'none', 
                borderRadius: 8, 
                padding: 8, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isRecording ? <Square size={16} color="white" /> : <Mic size={16} color="white" />}
            </button>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                {String(Math.floor(progress / 60)).padStart(2, '0')}:{String(progress % 60).padStart(2, '0')}
              </span>
              <div style={{ 
                flex: 1, 
                height: 4, 
                background: '#334155', 
                borderRadius: 999,
                overflow: 'hidden',
                cursor: 'pointer'
              }}>
                <div style={{ 
                  width: `${(progress / 60) * 100}%`, 
                  height: '100%', 
                  background: isRecording ? '#ef4444' : '#2563eb', 
                  borderRadius: 999,
                  transition: 'width 0.05s linear'
                }}></div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>01:00</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.75rem' }}>
              <span>Speed: 25 mm/s</span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>Gain: 10 mm/mV</span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>Filter: 0.05 - 150 Hz</span>
            </div>
            <button 
              onClick={() => setSound(!sound)} 
              style={{ 
                background: 'transparent', 
                border: '1px solid #334155', 
                borderRadius: 8, 
                padding: 6, 
                cursor: 'pointer'
              }}
            >
              {sound ? <Volume2 size={16} color="#94a3b8" /> : <VolumeX size={16} color="#94a3b8" />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleViewRecord = (index) => {
    toast.success(`Viewing ECG record #${index + 1}`);
  };

  return (
    <AppLayout title="Patient Detail">
      <div style={{ 
        padding: '16px',
        maxWidth: '100%',
        margin: 0
      }}>
        {/* Patient header */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)', 
          borderRadius: 12, 
          padding: '12px 16px', 
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/doctor/patients')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-primary)' }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #2563eb, #1e40af)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: 700
            }}>
              {patientInfo?.first_name?.[0]}{patientInfo?.last_name?.[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Patient ID:</span>
                <span style={{ fontSize: '0.7rem', color: '#f8fafc', fontWeight: 700 }}>PAT-{String(id || 2024).padStart(4, '0')}</span>
              </div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 2 }}>
                {patientInfo?.first_name || 'Koffi'} {patientInfo?.last_name || 'Alan'}
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#22c55e', 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  padding: '2px 8px', 
                  borderRadius: 999,
                  marginLeft: 8,
                  fontWeight: 600
                }}>{age} Y</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                <span>12 May 1966</span>
                <span>•</span>
                <span>Male</span>
                <span>•</span>
                <span>+233 24 123 4567</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: 1 }}>Date & Time</div>
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.8rem' }}>15 May 2024, 10:24 AM</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: 1 }}>Referring Doctor</div>
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.8rem' }}>Dr. K. Mensah</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: 1 }}>Location</div>
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.8rem' }}>Cardiology Unit, KATH</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          {/* Left column: ECG & History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ECG Display */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1rem' }}>
                  <Activity size={18} />
                  ECG Recording
                  {isRecording && (
                    <span style={{ 
                      color: '#ef4444', 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(239,68,68,0.1)',
                      padding: '3px 10px',
                      borderRadius: 999
                    }}>
                      ● RECORDING
                    </span>
                  )}
                </h3>
              </div>
              <div className="card-body" style={{ padding: 12 }}>
                {renderECGGrid()}
              </div>
            </div>

            {/* Previous ECG Records */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
                <h3 style={{ fontSize: '1rem' }}>Previous ECG Records</h3>
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px'
                }}>
                  {[
                    { date: '02 May 2024, 09:15 AM', result: 'Abnormal', summary: 'Atrial Fibrillation', reviewed: 'Dr. K. Mensah' },
                    { date: '20 Apr 2024, 11:40 AM', result: 'Normal', summary: 'Sinus Rhythm', reviewed: 'Dr. A. Boateng' },
                    { date: '10 Mar 2024, 08:30 AM', result: 'Normal', summary: 'Sinus Rhythm', reviewed: 'Dr. A. Boateng' }
                  ].map((record, index) => (
                    <div 
                      key={index}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px', 
                        background: 'var(--bg-primary)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            color: record.result === 'Abnormal' ? '#ef4444' : '#22c55e', 
                            fontWeight: 700, 
                            fontSize: '0.75rem',
                            background: record.result === 'Abnormal' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                            padding: '3px 8px',
                            borderRadius: 999
                          }}>
                            {record.result}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{record.date}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#f8fafc' }}>{record.summary}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Reviewed by: {record.reviewed}</div>
                      </div>
                      <button 
                        onClick={() => handleViewRecord(index)}
                        style={{ 
                          background: 'var(--primary)', 
                          border: 'none', 
                          borderRadius: '8px', 
                          padding: '8px 16px', 
                          color: 'white', 
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                        <Eye size={16} />
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column: AI Analysis & Vitals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* AI Analysis */}
            <div className="card">
              <div className="card-header" style={{ 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px'
              }}>
                <h3 style={{ fontSize: '1rem' }}>AI Analysis Result</h3>
                <span style={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  color: '#a78bfa', 
                  padding: '3px 8px', 
                  borderRadius: 6,
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}>AI</span>
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 800, 
                    color: '#ef4444', 
                    marginBottom: 2 
                  }}>
                    Abnormal
                  </h4>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>High Confidence</div>
                </div>

                {/* Confidence meter */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#22c55e' }}>92%</span>
                  </div>
                  <div style={{ 
                    height: 6, 
                    background: 'linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%)', 
                    borderRadius: 999,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '92%', 
                      height: '100%', 
                      background: 'transparent', 
                      borderRight: '3px solid white',
                      boxShadow: '0 0 8px rgba(255,255,255,0.5)'
                    }}></div>
                  </div>
                </div>

                {/* Possible findings */}
                <div style={{ marginBottom: 16 }}>
                  <h5 style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Possible Findings</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 600 }}>Atrial Fibrillation</span>
                      <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700 }}>High Probability</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>ST-T Abnormality</span>
                      <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700 }}>Moderate Probability</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Left Ventricular Hypertrophy</span>
                      <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>Low Probability</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div style={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  borderRadius: 10, 
                  padding: '12px',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ 
                      background: 'rgba(139, 92, 246, 0.2)', 
                      width: 20, 
                      height: 20, 
                      borderRadius: 6, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center'
                    }}>
                      <Activity size={12} color="#a78bfa" />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>AI Recommendation</span>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                    Consider clinical correlation. Cardiology consultation recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="card">
              <div className="card-header" style={{ 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px'
              }}>
                <h3 style={{ fontSize: '1rem' }}>Vital Signs (At Time of ECG)</h3>
                <Activity size={16} color="#64748b" />
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    borderRadius: 10,
                    padding: 10
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>HR</div>
                    <div style={{ color: '#ef4444', fontSize: '1.125rem', fontWeight: 800 }}>112 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>bpm</span></div>
                  </div>

                  <div style={{ 
                    background: 'rgba(245, 158, 11, 0.05)', 
                    border: '1px solid rgba(245, 158, 11, 0.2)', 
                    borderRadius: 10,
                    padding: 10
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>BP</div>
                    <div style={{ color: '#f59e0b', fontSize: '1.125rem', fontWeight: 800 }}>148/92 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>mmHg</span></div>
                  </div>

                  <div style={{ 
                    background: 'rgba(34, 197, 94, 0.05)', 
                    border: '1px solid rgba(34, 197, 94, 0.2)', 
                    borderRadius: 10,
                    padding: 10
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>SpO2</div>
                    <div style={{ color: '#22c55e', fontSize: '1.125rem', fontWeight: 800 }}>96 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>%</span></div>
                  </div>

                  <div style={{ 
                    background: 'rgba(148, 163, 184, 0.05)', 
                    border: '1px solid rgba(148, 163, 184, 0.2)', 
                    borderRadius: 10,
                    padding: 10
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>RR</div>
                    <div style={{ color: '#cbd5e1', fontSize: '1.125rem', fontWeight: 800 }}>20 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>breaths/min</span></div>
                  </div>

                  <div style={{ 
                    background: 'rgba(34, 197, 94, 0.05)', 
                    border: '1px solid rgba(34, 197, 94, 0.2)', 
                    borderRadius: 10,
                    padding: 10
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Temp</div>
                    <div style={{ color: '#22c55e', fontSize: '1.125rem', fontWeight: 800 }}>37.2 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>°C</span></div>
                  </div>

                  <div style={{ 
                    background: 'rgba(148, 163, 184, 0.05)', 
                    border: '1px solid rgba(148, 163, 184, 0.2)', 
                    borderRadius: 10,
                    padding: 10
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Weight</div>
                    <div style={{ color: '#cbd5e1', fontSize: '1.125rem', fontWeight: 800 }}>78 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>kg</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                onClick={downloadReport}
                style={{ 
                  width: '100%', 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)', 
                  color: '#60a5fa', 
                  padding: '10px 14px', 
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}>
                <Download size={16} />
                Download Report
              </button>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => shareReport('whatsapp')}
                  style={{ 
                    flex: 1, 
                    background: '#25D366', 
                    border: 'none', 
                    color: 'white', 
                    padding: '8px 10px', 
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                  <MessageCircle size={14} />
                  WhatsApp
                </button>
                
                <button 
                  onClick={() => shareReport('facebook')}
                  style={{ 
                    flex: 1, 
                    background: '#1877F2', 
                    border: 'none', 
                    color: 'white', 
                    padding: '8px 10px', 
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                  <Facebook size={14} />
                  Facebook
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => shareReport('twitter')}
                  style={{ 
                    flex: 1, 
                    background: '#1DA1F2', 
                    border: 'none', 
                    color: 'white', 
                    padding: '8px 10px', 
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                  <Twitter size={14} />
                  Twitter
                </button>
                
                <button 
                  onClick={() => shareReport('messages')}
                  style={{ 
                    flex: 1, 
                    background: '#22c55e', 
                    border: 'none', 
                    color: 'white', 
                    padding: '8px 10px', 
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                  <Share2 size={14} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
