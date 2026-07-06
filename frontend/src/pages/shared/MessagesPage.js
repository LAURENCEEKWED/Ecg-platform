import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft, User, Trash2, Copy, Reply, Check, CheckCheck, MoreVertical, Settings, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/shared/AppLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function MessagesPage() {
  const { user, t } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [messageSettings, setMessageSettings] = useState({
    notifications: true,
    readReceipts: true
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { userId } = useParams();

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = user?.role === 'DOCTOR' ? [
    {
      section: 'Navigation',
      items: [
        { icon: MessageSquare, label: t('dashboard'), path: '/doctor' },
        { icon: User, label: t('patients'), path: '/doctor/patients' },
        { icon: MessageSquare, label: t('messages'), path: '/messages', badge: unreadCount },
        { icon: MessageSquare, label: t('alerts'), path: '/doctor/alerts' },
        { icon: User, label: 'Simulator', path: '/doctor/simulator' },
        { icon: User, label: t('profile'), path: '/doctor/profile' },
      ]
    }
  ] : [
    {
      section: 'Navigation',
      items: [
        { icon: MessageSquare, label: t('dashboard'), path: '/patient' },
        { icon: User, label: 'ECG History', path: '/patient/ecg-history' },
        { icon: MessageSquare, label: t('messages'), path: '/messages', badge: unreadCount },
        { icon: User, label: 'Analysis', path: '/patient/analysis' },
        { icon: User, label: t('profile'), path: '/patient/profile' },
      ]
    }
  ];

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (userId) {
      loadConversation(parseInt(userId));
    }
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setShowSettings(false);
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside);
    };
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/messages/unread-count');
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const loadConversation = async (partnerId) => {
    try {
      const res = await api.get(`/messages/conversation/${partnerId}`);
      setMessages(res.data.messages);
      const conv = conversations.find(c => c.user_id === partnerId);
      setCurrentConversation(conv);
      loadUnreadCount();
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;

    try {
      await api.post('/messages', {
        receiver_id: currentConversation.user_id,
        content: newMessage.trim(),
        patient_id: currentConversation.patient?.id || (currentConversation.partner?.role === 'PATIENT' ? currentConversation.patient?.id : null),
        doctor_id: currentConversation.doctor?.id || (currentConversation.partner?.role === 'DOCTOR' ? currentConversation.doctor?.id : null)
      });
      setNewMessage('');
      loadConversation(currentConversation.user_id);
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const deleteMessage = async (msgId) => {
    try {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success('Message deleted successfully!');
      setDeleteConfirm(null);
      setContextMenu(null);
      loadConversations();
    } catch (err) {
      console.error('Failed to delete message:', err);
      toast.error('Failed to delete message. Please try again.');
      setDeleteConfirm(null);
      setContextMenu(null);
    }
  };

  const copyMessage = async (msgId) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      await navigator.clipboard.writeText(msg.content);
      toast.success('Message copied to clipboard!');
    }
    setContextMenu(null);
  };

  const markAsRead = async (msgId) => {
    try {
      await api.put(`/messages/${msgId}/read`);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'READ' } : m));
      loadUnreadCount();
      toast.success('Marked as read!');
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
    setContextMenu(null);
  };

  const replyToMessage = async (msgId) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      setNewMessage(`Replying to: "${msg.content.substring(0, 50)}..." `);
    }
    setContextMenu(null);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <AppLayout navItems={navItems} title={t('messages')}>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout navItems={navItems} title={t('messages')}>
      <div style={{ display: 'flex', height: 'calc(100vh - 160px)', gap: '24px', flexDirection: 'column' }}>
        {/* Mobile Responsive Styles */}
        <style>{`
          @media (min-width: 641px) {
            .messages-container {
              flex-direction: row !important;
            }
            .conversation-list {
              width: 350px !important;
              display: flex !important;
            }
            .messages-panel {
              display: flex !important;
            }
          }
          @media (max-width: 640px) {
            .messages-container {
              height: calc(100vh - 120px) !important;
            }
            .conversation-list, .messages-panel {
              width: 100% !important;
            }
            .hide-on-mobile {
              display: none !important;
            }
          }
        `}</style>

        <div className="messages-container" style={{ display: 'flex', height: '100%', gap: '24px', flexDirection: 'column' }}>
          {/* Conversation List */}
          <div
            className={`conversation-list ${currentConversation && isMobile ? 'hide-on-mobile' : ''}`}
            style={{
              width: isMobile ? '100%' : '350px',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{t('conversations')}</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('noConversations')}
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.user_id}
                    onClick={() => navigate(`/messages/${conv.user_id}`)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      background: currentConversation?.user_id === conv.user_id ? 'var(--bg-primary)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: conv.partner?.role === 'DOCTOR' ? '#2E75B6' : '#107C41',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          {conv.partner?.first_name?.[0]}{conv.partner?.last_name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                            {conv.partner?.first_name} {conv.partner?.last_name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {conv.partner?.role}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {conv.last_message ? formatTime(conv.last_message.sent_at) : ''}
                        </div>
                        {conv.unread_count > 0 && (
                          <div style={{
                            marginTop: '4px',
                            background: 'var(--primary)',
                            color: 'white',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            padding: '2px 8px',
                            display: 'inline-block'
                          }}>
                            {conv.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      marginTop: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontStyle: conv.last_message ? 'normal' : 'italic'
                    }}>
                      {conv.last_message ? conv.last_message.content : 'Start a conversation'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div
            className={`messages-panel ${!currentConversation && isMobile ? 'hide-on-mobile' : ''}`}
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {currentConversation ? (
              <>
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => navigate('/messages')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      <ArrowLeft size={18} />
                    </button>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: currentConversation.partner?.role === 'DOCTOR' ? '#2E75B6' : '#107C41',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      {currentConversation.partner?.first_name?.[0]}{currentConversation.partner?.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>
                        {currentConversation.partner?.first_name} {currentConversation.partner?.last_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {currentConversation.partner?.role}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettings(!showSettings);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Settings size={20} />
                  </button>
                </div>

                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      {t('noMessages')}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {messages.map((msg, idx) => {
                        const isOwn = msg.sender_id === user.id;
                        const showDate = idx === 0 || formatDate(msg.sent_at) !== formatDate(messages[idx - 1].sent_at);

                        const handleRightClick = (e, messageId) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            messageId: messageId,
                            isOwn: isOwn
                          });
                        };

                        return (
                          <React.Fragment key={msg.id}>
                            {showDate && (
                              <div style={{ textAlign: 'center', margin: '8px 0' }}>
                                <span style={{
                                  background: 'var(--bg-card)',
                                  padding: '4px 12px',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border-light)'
                                }}>
                                  {formatDate(msg.sent_at)}
                                </span>
                              </div>
                            )}
                            <div style={{
                              display: 'flex',
                              justifyContent: isOwn ? 'flex-end' : 'flex-start',
                              alignItems: 'flex-end',
                              gap: '8px'
                            }}>
                              <div
                                onContextMenu={(e) => handleRightClick(e, msg.id)}
                                style={{
                                  maxWidth: '70%',
                                  padding: '10px 14px',
                                  borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  background: isOwn ? 'var(--primary)' : 'var(--bg-card)',
                                  color: isOwn ? 'white' : 'var(--text-primary)',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  border: isOwn ? 'none' : '1px solid var(--border-light)',
                                  cursor: 'context-menu'
                                }}
                              >
                                <div style={{ fontSize: '0.92rem', marginBottom: '4px' }}>
                                  {msg.content}
                                </div>
                                <div style={{
                                  fontSize: '0.7rem',
                                  opacity: 0.8,
                                  textAlign: 'right'
                                }}>
                                  {formatTime(msg.sent_at)}
                                  {msg.status === 'READ' && <CheckCheck size={12} style={{ marginLeft: '4px' }} />}
                                  {msg.status !== 'READ' && <Check size={12} style={{ marginLeft: '4px' }} />}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                  <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('typeAMessage')}
                      className="input"
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
                      <Send size={16} />
                    </button>
                  </form>
                </div>

                {deleteConfirm && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                  }}>
                    <div style={{
                      background: 'var(--bg-card)',
                      padding: '24px',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                      maxWidth: '400px',
                      width: '90%'
                    }}>
                      <h3 style={{ marginBottom: '12px', fontSize: '1.125rem' }}>{t('deleteMessage')}</h3>
                      <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>{t('deleteMessageConfirm')}</p>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="btn btn-secondary"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          onClick={() => deleteMessage(deleteConfirm)}
                          className="btn"
                          style={{ background: '#EF4444', color: 'white' }}
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showSettings && (
                  <div style={{
                    position: 'absolute',
                    top: '70px',
                    right: '16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    width: '280px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    zIndex: 40
                  }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontWeight: '600', fontSize: '1rem' }}>Conversation Settings</h4>
                      <button
                        onClick={() => setShowSettings(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={() => setMessageSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {messageSettings.notifications ? <Bell size={16} /> : <BellOff size={16} />}
                          Notifications
                        </span>
                        <span style={{
                          width: '36px',
                          height: '20px',
                          borderRadius: '999px',
                          background: messageSettings.notifications ? 'var(--primary)' : '#ccc',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}>
                          <span style={{
                            position: 'absolute',
                            top: '2px',
                            left: messageSettings.notifications ? '18px' : '2px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'white',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            transition: 'left 0.2s'
                          }} />
                        </span>
                      </button>

                      <button
                        onClick={() => setMessageSettings(prev => ({ ...prev, readReceipts: !prev.readReceipts }))}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCheck size={16} />
                          Read Receipts
                        </span>
                        <span style={{
                          width: '36px',
                          height: '20px',
                          borderRadius: '999px',
                          background: messageSettings.readReceipts ? 'var(--primary)' : '#ccc',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}>
                          <span style={{
                            position: 'absolute',
                            top: '2px',
                            left: messageSettings.readReceipts ? '18px' : '2px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'white',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            transition: 'left 0.2s'
                          }} />
                        </span>
                      </button>

                      <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />

                      <button
                        onClick={() => {
                          if (window.confirm('Clear all chat history?')) {
                            setMessages([]);
                            toast.success('Chat history cleared!');
                            setShowSettings(false);
                          }
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <Trash2 size={16} /> Clear Chat History
                      </button>

                      <button
                        onClick={() => {
                          toast.info('Search functionality coming soon!');
                          setShowSettings(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)'
                        }}
                      >
                        🔍 Search in Conversation
                      </button>

                      <button
                        onClick={() => {
                          toast.success('Conversation pinned!');
                          setShowSettings(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)'
                        }}
                      >
                        📌 Pin Conversation
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('Block this user?')) {
                            toast.success('User blocked!');
                            navigate('/messages');
                            setShowSettings(false);
                          }
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem',
                          color: '#EF4444'
                        }}
                      >
                        🚫 Block User
                      </button>
                    </div>
                  </div>
                )}

                {contextMenu && (
                  <div
                    style={{
                      position: 'fixed',
                      top: contextMenu.y,
                      left: contextMenu.x,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '8px 0',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      zIndex: 50,
                      minWidth: '180px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => copyMessage(contextMenu.messageId)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <Copy size={16} /> Copy Message
                    </button>

                    <button
                      onClick={() => replyToMessage(contextMenu.messageId)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <Reply size={16} /> Reply
                    </button>

                    {!contextMenu.isOwn && (
                      <button
                        onClick={() => markAsRead(contextMenu.messageId)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 16px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <Check size={16} /> Mark as Read
                      </button>
                    )}

                    {contextMenu.isOwn && (
                      <button
                        onClick={() => setDeleteConfirm(contextMenu.messageId)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 16px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.9rem',
                          color: '#EF4444'
                        }}
                      >
                        <Trash2 size={16} /> Delete Message
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <div style={{ textAlign: 'center' }}>
                  <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>{t('selectConversation')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
