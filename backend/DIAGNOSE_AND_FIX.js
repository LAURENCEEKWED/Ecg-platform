
require('dotenv').config();
const db = require('./src/config/database');
const fs = require('fs');

console.log('🔍 DIAGNOSING SMS ISSUE...\n');

// =========================================
// STEP 1: Check Database
// =========================================
console.log('📊 STEP 1: Checking Database...');
const patients = db.findAll('patients');

console.log(`   Found ${patients.length} patients`);

if (patients.forEach((p, i) => {
  console.log(`   Patient ${i+1}: ${p.first_name} ${p.last_name} | Phone: ${p.phone || '❌ NOT SET'}`);
});

// =========================================
// STEP 2: Update all patients to use YOUR number
// =========================================
console.log('\n🔧 STEP 2: Updating patients to use your phone number...');
const yourPhone = '+19714637569';

patients.forEach(p => {
  console.log(`   Updating ${p.first_name} ${p.last_name}...`);
  db.update('patients', p.id, { phone: yourPhone });
  
  // Also update user record
  const user = db.findById('users', p.user_id);
  if (user) {
    db.update('users', user.id, { phone: yourPhone });
  }
});

console.log('   ✅ All patients updated!');

// =========================================
// STEP 3: Verify Twilio Config
// =========================================
console.log('\n🔐 STEP 3: Verifying Twilio Configuration...');
const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
console.log(`   Twilio configured: ${hasTwilio ? '✅ Yes' : '❌ No'}`);

if (hasTwilio) {
  console.log(`   SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...`);
  console.log(`   From: ${process.env.TWILIO_FROM_NUMBER}`);
}

// =========================================
// STEP 4: Check if packages are installed
// =========================================
console.log('\n📦 STEP 4: Checking installed packages...');
let twilioInstalled = false;
try {
  require('twilio');
  twilioInstalled = true;
  console.log('   ✅ twilio installed');
} catch (e) {
  console.log('   ❌ twilio NOT installed - run: npm.cmd install twilio nodemailer');
}

// =========================================
// STEP 5: Create a test script template
// =========================================
console.log('\n📝 STEP 5: Creating test files...');

const testScript = `
// =========================================
// COMPLETE SMS TEST
// =========================================
require('dotenv').config();
const db = require('./src/config/database');
const { sendPatientAlertNotifications } = require('./src/services/notifications');

console.log('🧪 COMPLETE ALERT TEST\n');

const patients = db.findAll('patients');
const testPatient = patients[0];

console.log('👤 Test Patient:');
console.log('   ID:', testPatient.id);
console.log('   Name:', testPatient.first_name, testPatient.last_name);
console.log('   Phone:', testPatient.phone);

console.log('\\n📱 Sending alert...');

const alertData = {
  patient_id: testPatient.id,
  rhythm_class: 'AFIB',
  cvd_risk_score: 88,
  risk_level: 'HIGH'
};

sendPatientAlertNotifications(testPatient.id, alertData)
  .then(result => {
    console.log('\\n✅ DONE! Result:');
    console.log(result);
  });
`;

fs.writeFileSync('./COMPLETE_ALERT_TEST.js', testScript);
console.log('   ✅ Created COMPLETE_ALERT_TEST.js');

// =========================================
// SUMMARY
// =========================================
console.log('\n✅ =============================================');
console.log('DIAGNOSIS COMPLETE!');
console.log('=============================================');
console.log('\nWhat we did:');
console.log('1. Updated ALL patients to use YOUR phone number');
console.log('2. Created a complete test script');
console.log('\nNEXT STEPS:');
if (!twilioInstalled) {
  console.log('1. FIRST: Install packages → npm.cmd install twilio nodemailer');
}
console.log('2. Run complete test → node COMPLETE_ALERT_TEST.js');
console.log('3. Check console for detailed logs!');
console.log('4. Verify you get SMS at: +19714637569');
console.log('');
