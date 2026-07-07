
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'server.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
  logStream.write(`[LOG] ${new Date().toISOString()} - ${msg}\n`);
  originalLog.apply(console, args);
};

console.error = (...args) => {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
  logStream.write(`[ERROR] ${new Date().toISOString()} - ${msg}\n`);
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
  logStream.write(`[WARN] ${new Date().toISOString()} - ${msg}\n`);
  originalWarn.apply(console, args);
};

console.log('=== Starting ECG Platform Backend ===');

try {
  require('./src/server');
} catch (err) {
  console.error('FATAL ERROR:', err);
  process.exit(1);
}

