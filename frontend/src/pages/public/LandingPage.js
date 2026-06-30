import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Activity, Shield, Zap, Users, ArrowRight,
  Stethoscope, Brain, Globe, Mail, Phone, MapPin, GraduationCap,
  Monitor, AlertTriangle, CheckCircle2, Microscope, Clock,
  Smartphone, Database, Share2, MessageCircle
} from 'lucide-react';
import { CREATOR } from '../../config/site';

const ECG_FACTS = [
  { icon: Activity, title: 'What is an ECG?', text: 'An electrocardiogram (ECG) records the electrical activity of your heart. Each heartbeat produces a wave pattern that doctors use to detect arrhythmias, heart attacks, and other cardiovascular conditions.' },
  { icon: Stethoscope, title: 'Why It Matters', text: 'Cardiovascular disease is the leading cause of death worldwide. Early detection through ECG monitoring can save lives — especially in regions where specialist cardiologists are scarce.' },
  { icon: Brain, title: 'AI-Enhanced Analysis', text: 'Modern AI models can classify heart rhythms with over 97% accuracy, flagging dangerous patterns like atrial fibrillation or tachycardia in seconds instead of hours.' },
];

const APP_FEATURES = [
  { icon: Activity, title: '1D-CNN Arrhythmia Detection', desc: '5 rhythm classes with 97.6% weighted F1-score' },
  { icon: Shield, title: 'CVD Risk Prediction', desc: 'XGBoost model scores cardiovascular risk 0–100' },
  { icon: Zap, title: 'Real-Time Alerts', desc: 'SMS & email dispatch in under 5 seconds for HIGH risk' },
  { icon: Users, title: 'Multi-Hospital Integration', desc: 'HL7 FHIR R4 · Secure HTTPS API for any hospital' },
  { icon: Globe, title: 'Cloud-Native Architecture', desc: 'Scalable, accessible from any device, anywhere' },
  { icon: Heart, title: 'Patient & Doctor Portals', desc: 'Dedicated dashboards for clinicians and patients' },
];

const MORE_IMAGES = [
  { 
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=800&fit=crop',
    title: 'Hospital Workflow', 
    desc: 'Seamless integration into existing clinical processes' 
  },
  { 
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=800&fit=crop',
    title: 'Patient Monitoring', 
    desc: '24/7 continuous cardiac monitoring' 
  },
  { 
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=800&fit=crop',
    title: 'Telemedicine', 
    desc: 'Remote consultations from anywhere' 
  },
  { 
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=800&fit=crop',
    title: 'Data Analytics', 
    desc: 'Comprehensive reports and insights' 
  },
  { 
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=800&fit=crop',
    title: 'Doctor Consultation', 
    desc: 'Direct access to cardiologists' 
  },
  { 
    image: 'https://images.unsplash.com/photo-1551076805-e1851c4a6e61?w=800&h=800&fit=crop',
    title: 'ECG Analysis', 
    desc: 'Advanced AI-powered interpretation' 
  }
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="container">
          <div className="landing-nav-inner">
            <Link to="/" className="landing-brand">
              <div className="landing-brand-icon">
                <Heart size={20} color="white" />
              </div>
              <div>
                <span className="landing-brand-name">ECG AI Platform</span>
                <span className="landing-brand-sub">Advanced Cardiac Intelligence</span>
              </div>
            </Link>
            <div className="landing-nav-links">
              <Link to="/login">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="container">
          <div className="landing-hero-inner">
            <div>
              <span className="landing-badge">AI-Powered Cardiac Intelligence for Africa</span>
              <h1>Smarter ECG Analysis.<br />Faster Life-Saving Decisions.</h1>
              <p>
                A cloud-native platform connecting hospital ECG machines to real-time AI analysis.
                Detect arrhythmias, predict cardiovascular risk, and alert doctors — all in seconds.
              </p>
              <div className="landing-hero-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">Sign In to Dashboard</Link>
              </div>
              <div className="landing-hero-stats">
                <div>
                  <strong>97.6%</strong>
                  <span>AI F1-Score</span>
                </div>
                <div>
                  <strong>&lt;5s</strong>
                  <span>Alert Dispatch</span>
                </div>
                <div>
                  <strong>5</strong>
                  <span>Rhythm Classes</span>
                </div>
                <div>
                  <strong>12-Lead</strong>
                  <span>ECG Support</span>
                </div>
              </div>
            </div>
            
            <div className="landing-hero-visual">
              <div className="ecg-sticker" style={{ top: 30, right: 10 }}>
                <Activity size={40} color="white" />
              </div>
              <div className="ecg-sticker" style={{ bottom: 40, left: 0, animationDelay: '1.5s' }}>
                <Heart size={40} color="white" />
              </div>
              <div className="landing-ecg-card">
                <div className="landing-ecg-header">
                  <Activity size={18} /> Real-Time ECG Monitor
                </div>
                <svg className="landing-ecg-svg" viewBox="0 0 400 100">
                  <path
                    d="M0,50 L50,50 L60,30 L70,50 L80,70 L90,50 L150,50 L160,30 L170,50 L180,70 L190,50 L250,50 L260,30 L270,50 L280,70 L290,50 L350,50 L360,30 L370,50 L380,70 L390,50 L400,50"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                </svg>
                <div className="landing-ecg-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Heart size={18} color="#ef4444" fill="#ef4444" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>85 BPM</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Live</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* First Image Section */}
      <section className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-tag">Our Mission</span>
            <h2>Connecting Doctors and Patients</h2>
            <p>Bridging the gap between bedside ECG machines and intelligent cardiac insights</p>
          </div>
          <div className="landing-image-grid">
            <div className="landing-image-card">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=800&fit=crop"
                alt="Doctor consultation"
                className="landing-image"
              />
              <div className="minimalist-image-card-content" style={{ padding: '24px' }}>
                <h4>Personalized Consultations</h4>
                <p>Doctors can review ECG results and provide immediate care</p>
              </div>
            </div>
            <div className="landing-image-card">
              <img
                src="https://images.unsplash.com/photo-1551076805-e1851c4a6e61?w=800&h=800&fit=crop"
                alt="ECG Analysis"
                className="landing-image"
              />
              <div className="minimalist-image-card-content" style={{ padding: '24px' }}>
                <h4>Advanced ECG Analysis</h4>
                <p>AI-powered interpretation of heart rhythms</p>
              </div>
            </div>
            <div className="landing-image-card">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=800&fit=crop"
                alt="Patient Monitoring"
                className="landing-image"
              />
              <div className="minimalist-image-card-content" style={{ padding: '24px' }}>
                <h4>Continuous Patient Monitoring</h4>
                <p>Real-time tracking of patient vitals</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About ECG Section */}
      <section className="landing-section landing-section-alt">
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-tag">Heart Health</span>
            <h2>Understanding ECG & Heart Health</h2>
            <p>Electrocardiography is one of the most important tools in modern medicine</p>
          </div>
          <div className="landing-cards-grid">
            {ECG_FACTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="landing-info-card">
                <div className="landing-info-icon">
                  <Icon size={24} color="var(--primary)" />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Features Section */}
      <section className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-tag">The Platform</span>
            <h2>About the ECG AI Platform</h2>
            <p>Built for hospitals, doctors, and patients — bridging the gap between bedside ECG machines and intelligent, actionable cardiac insights</p>
          </div>
          <div className="landing-features-grid">
            {APP_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <Icon size={24} color="var(--primary)" />
                </div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Images Section */}
      <section className="landing-section landing-section-alt">
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-tag">Features</span>
            <h2>Comprehensive Capabilities</h2>
            <p>Everything you need for modern cardiac care in one platform</p>
          </div>
          <div className="landing-image-grid">
            {MORE_IMAGES.map((item, idx) => (
              <div key={idx} className="landing-image-card">
                <img
                  src={item.image}
                  alt={item.title}
                  className="landing-image"
                />
                <div className="minimalist-image-card-content" style={{ padding: '24px' }}>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-tag">The Team</span>
            <h2>About the Developer</h2>
          </div>
          <div className="landing-developer-card">
            <div className="landing-developer-avatar">
              {CREATOR.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="landing-developer-info">
              <h3>{CREATOR.name}</h3>
              <p className="landing-developer-title">{CREATOR.title}</p>
              <p className="landing-developer-bio">{CREATOR.bio}</p>
              <div className="landing-developer-meta">
                <span><GraduationCap size={15} /> {CREATOR.university}</span>
                <span><MapPin size={15} /> {CREATOR.location}</span>
                <span><Mail size={15} /> {CREATOR.email}</span>
                <span><Phone size={15} /> {CREATOR.phone}</span>
              </div>
              <div className="landing-skills">
                {CREATOR.skills.map(s => (
                  <span key={s} className="landing-skill-tag">{s}</span>
                ))}
              </div>
              <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {CREATOR.department} · Academic Year {CREATOR.projectYear}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section">
        <div className="container">
          <div className="landing-cta-banner">
            <div>
              <h3>Ready to explore the platform?</h3>
              <p>Create a patient account or sign in as a doctor to access the full dashboard</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/register" className="btn btn-secondary">Create Account</Link>
              <Link to="/login" className="btn btn-primary">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <Heart size={18} color="white" />
              ECG AI Platform
            </div>
            <div className="landing-footer-links">
              <a href="#features">Features</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              {CREATOR.university} · {CREATOR.department} · {CREATOR.projectYear}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
