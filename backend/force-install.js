
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Starting force install of backend dependencies...');

const deps = [
  'bcryptjs@^2.4.3',
  'compression@^1.7.4',
  'cors@^2.8.5',
  'dotenv@^16.3.1',
  'express@^4.18.2',
  'express-rate-limit@^7.1.5',
  'express-validator@^7.0.1',
  'helmet@^7.1.0',
  'jsonwebtoken@^9.0.2',
  'morgan@^1.10.0',
  'multer@^1.4.5-lts.1',
  'nodemailer@^6.9.7',
  'twilio@^4.20.0',
  'uuid@^9.0.1',
  'ws@^8.14.2'
];

const devDeps = [
  'nodemon@^3.0.2'
];

console.log('\nInstalling dependencies...');
try {
  for (const pkg of deps) {
    console.log(`Installing ${pkg}...`);
    const result = execSync(`npm.cmd install ${pkg}`, { stdio: 'inherit' });
  }
} catch (err) {
  console.error('❌ Failed to install dependencies');
  console.error(err);
}

console.log('\nInstalling dev dependencies...');
try {
  for (const pkg of devDeps) {
    console.log(`Installing ${pkg}...`);
    const result = execSync(`npm.cmd install -D ${pkg}`, { stdio: 'inherit' });
  }
} catch (err) {
  console.error('❌ Failed to install dev dependencies');
  console.error(err);
}

console.log('\n✅ Done! Now let\'s check...');

console.log('\nChecking node_modules directory...');
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('✅ node_modules exists!');
  
  console.log('\nChecking if express is available...');
  try {
    require('express');
    console.log('✅ express loaded successfully');
    
    console.log('\nStarting backend server...');
    require('./src/server');
    
  } catch (err) {
    console.error('❌ Failed to load express:', err);
  }
} else {
  console.error('❌ node_modules is missing!');
}

