
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('========================================');
console.log('FULL RESET - ECG PLATFORM');
console.log('========================================');
console.log();

// Step 1: Delete old database
const dbPath = path.join(__dirname, 'backend', 'data', 'ecg_platform.db');
if (fs.existsSync(dbPath)) {
  console.log('[1/3] Deleting old database...');
  fs.unlinkSync(dbPath);
  console.log('✅ Old database deleted!');
} else {
  console.log('[1/3] No old database found!');
}

// Step 2: Start backend
console.log();
console.log('[2/3] Starting backend...');
const backend = spawn('node', ['src/server.js'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true
});

backend.stdout.on('data', (data) => {
  console.log(`[BACKEND] ${data}`);
});
backend.stderr.on('data', (data) => {
  console.error(`[BACKEND ERROR] ${data}`);
});

// Step 3: Start frontend after a delay
console.log();
console.log('[3/3] Waiting 5 seconds for backend to start, then starting frontend...');
setTimeout(() => {
  console.log('Starting frontend...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    shell: true
  });
  frontend.stdout.on('data', (data) => {
    console.log(`[FRONTEND] ${data}`);
  });
  frontend.stderr.on('data', (data) => {
    console.error(`[FRONTEND ERROR] ${data}`);
  });
}, 5000);

console.log();
console.log('========================================');
console.log('ALL SYSTEMS STARTING!');
console.log('========================================');
console.log('Login credentials:');
console.log('  Patient: emmanuel.b@email.cm / patient123');
console.log('  Doctor: dr.kameni@ecgplatform.cm / doctor123');
console.log();
