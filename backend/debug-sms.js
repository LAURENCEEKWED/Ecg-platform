
// Simple debug script to check SMS functionality
console.log('🔍 Starting SMS Debug...\n');

// Step 1: Check .env file
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 .env content (redacted):');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          const displayValue = key.includes('TOKEN') || key.includes('PASS') || key.includes('SID') 
            ? '***REDACTED***' 
            : value.trim();
          console.log(`   ${key.trim()}=${displayValue}`);
        }
      }
    });
  } else {
    console.log('❌ .env file NOT found');
  }
} catch (e) {
  console.log('❌ Error reading .env:', e.message);
}

// Step 2: Load dotenv and check vars
console.log('\n📋 Loading environment variables...');
require('dotenv').config();

const checkVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER'
];

checkVars.forEach(varName => {
  const val = process.env[varName];
  if (val) {
    console.log(`✅ ${varName}: ${val.length > 10 ? val.substring(0, 10) + '...' : val}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Step 3: Check installed packages
console.log('\n📦 Checking installed packages...');
try {
  require('twilio');
  console.log('✅ twilio package installed');
} catch (e) {
  console.log('❌ twilio package NOT installed:', e.message);
}

try {
  require('nodemailer');
  console.log('✅ nodemailer package installed');
} catch (e) {
  console.log('❌ nodemailer package NOT installed:', e.message);
}

console.log('\n✅ Debug complete!');
