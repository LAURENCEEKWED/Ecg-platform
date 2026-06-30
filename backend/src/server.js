require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const db = require('./config/database');
const { initializeDatabase } = require('./utils/dbInit');
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const ecgRoutes = require('./routes/ecg');
const alertRoutes = require('./routes/alerts');
const adminRoutes = require('./routes/admin');
const hospitalRoutes = require('./routes/hospital');
const messagesRoutes = require('./routes/messages');
const settingsRoutes = require('./routes/settings');
const profilesRoutes = require('./routes/profiles');
const smartwatchRoutes = require('./routes/smartwatch');
const { setupWebSocket } = require('./services/websocket');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Setup WebSocket
setupWebSocket(wss);

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (uploaded ECGs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' }));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/ecg', ecgRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/profiles', profilesRoutes);
app.use('/api/v1/smartwatch', smartwatchRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Initialize DB and start server
const PORT = process.env.PORT || 5000;
initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🏥 ECG AI Platform Backend running on port ${PORT}`);
    console.log(`📡 WebSocket server active at ws://localhost:${PORT}/ws`);
    console.log(`🔗 API available at http://localhost:${PORT}/api/v1\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = { app, server, wss };
