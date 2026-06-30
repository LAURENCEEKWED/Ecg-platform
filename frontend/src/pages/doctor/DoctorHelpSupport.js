import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, MessageSquare, FileText, Phone, Mail, ExternalLink, Plus, Search } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { toast } from 'react-toastify';

const FAQ = [
  {
    question: 'How do I interpret an ECG report?',
    answer: 'The AI analysis provides a detailed interpretation of the ECG, including rhythm classification and risk assessment. You can always refer to the patient history for comparison.'
  },
  {
    question: 'How do I add a new patient?',
    answer: 'Go to Patients → Add Patient, fill in the required fields, and click save.'
  },
  {
    question: 'Why am I not receiving alerts?',
    answer: 'Check your notification settings in Settings → Notifications. Make sure you have enabled the types of alerts you want to receive.'
  },
  {
    question: 'How do I export ECG data?',
    answer: 'You can export ECG data from the Reports page or from an individual patient record.'
  }
];

const CATEGORIES = ['All', 'Technical', 'Clinical', 'Account'];

export default function DoctorHelpSupport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: '', category: 'Technical', message: '' });
  const navigate = useNavigate();

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    toast.success('Support ticket submitted successfully! We will get back to you soon.');
    setShowContactModal(false);
    setContactForm({ subject: '', category: 'Technical', message: '' });
  };

  const filteredFAQ = FAQ.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Help & Support">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 24 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: 8, color: 'var(--text-primary)' }}>How can we help?</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Find answers, get support, or contact our team</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowContactModal(true)}>
            <Plus size={18} />
            Contact Support
          </button>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { icon: FileText, title: 'Documentation', desc: 'API guides & tutorials', link: '#' },
            { icon: MessageSquare, title: 'Contact Us', desc: 'Email or chat support', onClick: () => setShowContactModal(true) },
            { icon: Phone, title: 'Emergency', desc: '24/7 support line' },
            { icon: HelpCircle, title: 'Video Guides', desc: 'Step-by-step tutorials', link: '#' }
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <div
                key={idx}
                className="card"
                style={{
                  padding: 20,
                  cursor: action.onClick || action.link ? 'pointer' : 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onClick={() => {
                  if (action.onClick) action.onClick();
                  if (action.link) window.open(action.link, '_blank');
                }}
                onMouseEnter={(e) => {
                  if (action.onClick || action.link) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <Icon size={20} color="white" />
                </div>
                <h4 style={{ marginBottom: 4, color: 'var(--text-primary)' }}>{action.title}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{action.desc}</p>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--text-primary)' }}>Frequently Asked Questions</h3>
            <div style={{ position: 'relative', width: 300 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: 44 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                style={{
                  padding: '6px 16px',
                  borderRadius: 999,
                  border: `1px solid ${selectedCategory === cat ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedCategory === cat ? 'var(--primary)' : 'transparent',
                  color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredFAQ.length === 0 ? (
              <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                No FAQ entries found
              </div>
            ) : (
              filteredFAQ.map((faq, idx) => (
                <FAQItem key={idx} question={faq.question} answer={faq.answer} />
              ))
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--text-primary)' }}>Contact Information</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { icon: Mail, title: 'Email', value: 'support@ecgplatform.com' },
                { icon: Phone, title: 'Phone', value: '+1 (555) 123-4567' },
                { icon: FileText, title: 'Working Hours', value: '24/7 Support' }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      background: 'rgba(31,78,121,0.1)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={18} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowContactModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 550,
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Contact Support</h3>
            <form onSubmit={handleSubmitTicket}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="input"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Category</label>
                <select
                  value={contactForm.category}
                  onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  className="input"
                  required
                >
                  <option value="Technical">Technical</option>
                  <option value="Clinical">Clinical</option>
                  <option value="Account">Account</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: 'var(--text-primary)' }}>Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="input"
                  rows={6}
                  placeholder="Please provide details about your issue..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowContactModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          color: 'var(--text-primary)'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontWeight: 500, fontSize: '1rem' }}>{question}</span>
        <div style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: 'var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '0 20px 20px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {answer}
        </div>
      )}
    </div>
  );
}
