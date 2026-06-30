const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/v1/messages - get messages for current user
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  
  // Get all messages where current user is sender or receiver
  let messages = db.query('messages', msg => 
    msg.sender_id === currentUserId || msg.receiver_id === currentUserId
  ).sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));

  // Enrich messages with user info
  const enrichedMessages = messages.map(msg => {
    const sender = db.findById('users', msg.sender_id);
    const receiver = db.findById('users', msg.receiver_id);
    
    return {
      ...msg,
      sender: sender ? { 
        id: sender.id, 
        first_name: sender.first_name, 
        last_name: sender.last_name, 
        role: sender.role 
      } : null,
      receiver: receiver ? { 
        id: receiver.id, 
        first_name: receiver.first_name, 
        last_name: receiver.last_name, 
        role: receiver.role 
      } : null
    };
  });

  res.json({ messages: enrichedMessages });
}));

// GET /api/v1/messages/conversations - get conversation list
router.get('/conversations', authenticate, asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUser = db.findById('users', currentUserId);
  
  // Get all messages where current user is sender or receiver
  const messages = db.query('messages', msg => 
    msg.sender_id === currentUserId || msg.receiver_id === currentUserId
  );

  const conversationPartners = new Map();
  
  for (const msg of messages) {
    const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
    if (!conversationPartners.has(otherUserId)) {
      conversationPartners.set(otherUserId, {
        user_id: otherUserId,
        last_message: msg,
        unread_count: 0
      });
    }
    
    // Count unread messages
    if (msg.receiver_id === currentUserId && msg.status !== 'READ') {
      const conv = conversationPartners.get(otherUserId);
      conv.unread_count += 1;
    }
    
    // Update last message if this is newer
    const existing = conversationPartners.get(otherUserId);
    if (new Date(msg.sent_at) > new Date(existing.last_message.sent_at)) {
      existing.last_message = msg;
    }
  }

  // Add assigned doctors/patients even if no messages yet
  if (currentUser.role === 'PATIENT') {
    // For patients: find their assigned doctor
    const patientRecord = db.findOne('patients', { user_id: currentUserId });
    if (patientRecord) {
      const doctorRecord = db.findById('doctors', patientRecord.doctor_id);
      if (doctorRecord && !conversationPartners.has(doctorRecord.user_id)) {
        conversationPartners.set(doctorRecord.user_id, {
          user_id: doctorRecord.user_id,
          last_message: null,
          unread_count: 0
        });
      }
    }
  } else if (currentUser.role === 'DOCTOR') {
    // For doctors: find all assigned patients
    const doctorRecord = db.findOne('doctors', { user_id: currentUserId });
    if (doctorRecord) {
      const assignedPatients = db.findAll('patients', { doctor_id: doctorRecord.id });
      for (const patient of assignedPatients) {
        if (!conversationPartners.has(patient.user_id)) {
          conversationPartners.set(patient.user_id, {
            user_id: patient.user_id,
            last_message: null,
            unread_count: 0
          });
        }
      }
    }
  }

  // Enrich conversations with user info
  const conversations = Array.from(conversationPartners.values()).map(conv => {
    const partner = db.findById('users', conv.user_id);
    const patient = db.findOne('patients', { user_id: conv.user_id });
    const doctor = db.findOne('doctors', { user_id: conv.user_id });
    
    return {
      ...conv,
      partner: partner ? { 
        id: partner.id, 
        first_name: partner.first_name, 
        last_name: partner.last_name, 
        role: partner.role 
      } : null,
      patient: patient || null,
      doctor: doctor || null
    };
  }).sort((a, b) => {
    // Sort with conversations with messages first, then others
    if (a.last_message && !b.last_message) return -1;
    if (!a.last_message && b.last_message) return 1;
    if (a.last_message && b.last_message) {
      return new Date(b.last_message.sent_at) - new Date(a.last_message.sent_at);
    }
    return 0;
  });

  res.json({ conversations });
}));

// GET /api/v1/messages/conversation/:userId - get conversation with specific user
router.get('/conversation/:userId', authenticate, asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = parseInt(req.params.userId);
  
  // Get all messages between current user and other user
  let messages = db.query('messages', msg => 
    (msg.sender_id === currentUserId && msg.receiver_id === otherUserId) ||
    (msg.sender_id === otherUserId && msg.receiver_id === currentUserId)
  ).sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

  // Mark messages as read
  messages = messages.map(msg => {
    if (msg.receiver_id === currentUserId && msg.status !== 'READ') {
      return db.update('messages', msg.id, { status: 'READ', read_at: new Date().toISOString() });
    }
    return msg;
  });

  const enrichedMessages = messages.map(msg => {
    const sender = db.findById('users', msg.sender_id);
    const receiver = db.findById('users', msg.receiver_id);
    
    return {
      ...msg,
      sender: sender ? { 
        id: sender.id, 
        first_name: sender.first_name, 
        last_name: sender.last_name, 
        role: sender.role 
      } : null,
      receiver: receiver ? { 
        id: receiver.id, 
        first_name: receiver.first_name, 
        last_name: receiver.last_name, 
        role: receiver.role 
      } : null
    };
  });

  res.json({ messages: enrichedMessages });
}));

// POST /api/v1/messages - send a new message
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { receiver_id, content, patient_id, doctor_id } = req.body;
  
  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'Receiver ID and content are required' });
  }

  const receiver = db.findById('users', receiver_id);
  if (!receiver) {
    return res.status(404).json({ error: 'Receiver not found' });
  }

  const message = db.insert('messages', {
    sender_id: req.user.id,
    receiver_id,
    patient_id: patient_id || null,
    doctor_id: doctor_id || null,
    content,
    status: 'SENT',
    sent_at: new Date().toISOString(),
    read_at: null
  });

  const sender = db.findById('users', req.user.id);
  const enrichedMessage = {
    ...message,
    sender: sender ? { 
      id: sender.id, 
      first_name: sender.first_name, 
      last_name: sender.last_name, 
      role: sender.role 
    } : null,
    receiver: { 
      id: receiver.id, 
      first_name: receiver.first_name, 
      last_name: receiver.last_name, 
      role: receiver.role 
    }
  };

  res.status(201).json({ message: enrichedMessage });
}));

// GET /api/v1/messages/unread-count - get count of unread messages
router.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
  const count = db.count('messages', { receiver_id: req.user.id, status: { $ne: 'READ' } });
  
  // Since our db doesn't support $ne, let's do it manually
  const unreadMessages = db.query('messages', msg => 
    msg.receiver_id === req.user.id && msg.status !== 'READ'
  );

  res.json({ unread_count: unreadMessages.length });
}));

module.exports = router;
